/**
 * Email Gateway - Centralized email sending with security controls.
 *
 * All outbound email MUST flow through this module. It enforces:
 * - Global daily and hourly caps
 * - Per-recipient daily cap
 * - Circuit breaker on consecutive failures
 * - Recipient allowlisting (admin-only by default)
 */

import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const gw = logger.child({ route: 'email-gateway' })

// ---------------------------------------------------------------------------
// Configuration (env-driven with safe defaults)
// ---------------------------------------------------------------------------

const DAILY_LIMIT = parseInt(process.env.EMAIL_DAILY_LIMIT || '100', 10)
const HOURLY_LIMIT = parseInt(process.env.EMAIL_HOURLY_LIMIT || '20', 10)
const PER_RECIPIENT_DAILY = parseInt(process.env.EMAIL_PER_RECIPIENT_DAILY || '2', 10)
const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes

// ---------------------------------------------------------------------------
// In-memory counters (reset on cold start, which is acceptable for serverless
// because Vercel functions restart frequently). KV-backed counters could be
// added later for multi-instance deployments.
// ---------------------------------------------------------------------------

interface BucketState {
  hourly: { count: number; resetAt: number }
  daily: { count: number; resetAt: number }
  recipients: Map<string, { count: number; resetAt: number }>
  circuit: { failures: number; openUntil: number }
}

const state: BucketState = {
  hourly: { count: 0, resetAt: Date.now() + 3_600_000 },
  daily: { count: 0, resetAt: Date.now() + 86_400_000 },
  recipients: new Map(),
  circuit: { failures: 0, openUntil: 0 },
}

function resetIfExpired() {
  const now = Date.now()
  if (now >= state.hourly.resetAt) {
    state.hourly = { count: 0, resetAt: now + 3_600_000 }
  }
  if (now >= state.daily.resetAt) {
    state.daily = { count: 0, resetAt: now + 86_400_000 }
    state.recipients.clear()
  }
}

// ---------------------------------------------------------------------------
// Lazy Resend client
// ---------------------------------------------------------------------------

let resendClient: Resend | null = null

function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY
    if (!key || key.startsWith('re_your') || key === '') {
      throw new Error('RESEND_API_KEY is missing or uses a placeholder value')
    }
    resendClient = new Resend(key)
  }
  return resendClient
}

// ---------------------------------------------------------------------------
// Allowed recipients
// ---------------------------------------------------------------------------

/** Only these addresses may receive email. Keeps outbound locked to staff. */
function getAllowedRecipients(): Set<string> {
  const allowed = new Set<string>()
  const admin = process.env.CONTACT_TO_EMAIL || process.env.ADMIN_EMAIL
  if (admin) allowed.add(admin.toLowerCase())

  const extra = process.env.EMAIL_ALLOWED_RECIPIENTS
  if (extra) {
    extra.split(',').forEach((e) => {
      const trimmed = e.trim().toLowerCase()
      if (trimmed) allowed.add(trimmed)
    })
  }
  return allowed
}

function isRecipientAllowed(to: string): boolean {
  // If EMAIL_ALLOW_USER_EMAILS is explicitly set to 'true', allow any
  // validated email. Otherwise restrict to the allowlist.
  if (process.env.EMAIL_ALLOW_USER_EMAILS === 'true') {
    return true
  }
  return getAllowedRecipients().has(to.toLowerCase())
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GatewayEmailOptions {
  from: string
  to: string
  subject: string
  html?: string
  text?: string
  replyTo?: string
  react?: React.ReactElement
  bcc?: string
  /** Tag for logging/metrics */
  tag?: string
}

export interface GatewayResult {
  sent: boolean
  blocked?: string
  messageId?: string
  error?: string
}

/**
 * Send an email through the gateway. Returns a result object; never throws
 * for expected conditions (budget exceeded, circuit open, recipient blocked).
 */
export async function sendEmailViaGateway(
  opts: GatewayEmailOptions
): Promise<GatewayResult> {
  resetIfExpired()
  const now = Date.now()
  const tag = opts.tag || 'unknown'
  const toNorm = opts.to.toLowerCase()

  // 1. Circuit breaker
  if (state.circuit.openUntil > now) {
    gw.warn('Circuit breaker open, email blocked', { tag, to: toNorm })
    return { sent: false, blocked: 'circuit_breaker_open' }
  }

  // 2. Recipient allowlist
  if (!isRecipientAllowed(toNorm)) {
    gw.warn('Recipient not in allowlist, email blocked', { tag, to: toNorm })
    return { sent: false, blocked: 'recipient_not_allowed' }
  }

  // 3. Daily cap
  if (state.daily.count >= DAILY_LIMIT) {
    gw.warn('Daily email limit reached', { tag, count: state.daily.count })
    return { sent: false, blocked: 'daily_limit' }
  }

  // 4. Hourly cap
  if (state.hourly.count >= HOURLY_LIMIT) {
    gw.warn('Hourly email limit reached', { tag, count: state.hourly.count })
    return { sent: false, blocked: 'hourly_limit' }
  }

  // 5. Per-recipient daily cap
  const recipBucket = state.recipients.get(toNorm)
  if (recipBucket && recipBucket.count >= PER_RECIPIENT_DAILY) {
    gw.warn('Per-recipient daily limit reached', { tag, to: toNorm, count: recipBucket.count })
    return { sent: false, blocked: 'per_recipient_limit' }
  }

  // 6. Send
  try {
    const payload: Record<string, unknown> = {
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      replyTo: opts.replyTo,
    }
    if (opts.react) {
      payload.react = opts.react
    } else {
      payload.html = opts.html || opts.text || ''
      payload.text = opts.text
    }
    if (opts.bcc) {
      payload.bcc = opts.bcc
    }

    const { data, error } = await getResend().emails.send(payload as Parameters<Resend['emails']['send']>[0])

    if (error) {
      throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : String(error))
    }

    // Success bookkeeping
    state.daily.count++
    state.hourly.count++
    const existing = state.recipients.get(toNorm)
    if (existing) {
      existing.count++
    } else {
      state.recipients.set(toNorm, {
        count: 1,
        resetAt: state.daily.resetAt,
      })
    }
    state.circuit.failures = 0

    gw.info('Email sent', { tag, to: toNorm, messageId: data?.id })
    return { sent: true, messageId: data?.id }
  } catch (err) {
    state.circuit.failures++
    if (state.circuit.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      state.circuit.openUntil = now + CIRCUIT_BREAKER_COOLDOWN_MS
      gw.error('Circuit breaker tripped after consecutive failures', {
        tag,
        failures: state.circuit.failures,
      })
    }
    const message = err instanceof Error ? err.message : String(err)
    gw.error('Email send failed', { tag, to: toNorm, error: message })
    return { sent: false, error: message }
  }
}

/**
 * Read-only snapshot of gateway state for monitoring/health checks.
 */
export function getGatewayStats() {
  resetIfExpired()
  return {
    dailySent: state.daily.count,
    dailyLimit: DAILY_LIMIT,
    hourlySent: state.hourly.count,
    hourlyLimit: HOURLY_LIMIT,
    circuitOpen: state.circuit.openUntil > Date.now(),
    circuitFailures: state.circuit.failures,
    uniqueRecipients: state.recipients.size,
  }
}
