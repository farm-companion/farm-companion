// Email verification adapter — mailboxlayer.
//
// Sole caller surface is verifyEmail(email): Promise<EmailVerdict>.
// Used by /api/contact/submit and /api/farms/submit to reject malformed,
// MX-less, disposable, and low-score addresses before persistence /
// Resend send. Fail-open on any third-party failure so legitimate
// submissions are never blocked by an outage.
//
// Spec: docs/assistant/email-verification-plan.md

import { logger } from '@/lib/logger'

export type EmailRejectionReason =
  | 'invalid_format'
  | 'no_mx_record'
  | 'disposable_provider'
  | 'low_confidence_score'

export type EmailVerdict = {
  email: string                  // normalised (lowercase, trimmed)
  isValid: boolean               // single source of truth for callers
  reason?: EmailRejectionReason  // populated when isValid === false
  suggestion?: string            // mailboxlayer did_you_mean
  details: {
    formatValid: boolean
    mxFound: boolean
    disposable: boolean
    role: boolean
    score: number                // 0.0 – 1.0
  }
  source: 'api' | 'cache' | 'disabled' | 'error'
}

interface MailboxlayerSuccess {
  email: string
  did_you_mean?: string
  user?: string
  domain?: string
  format_valid: boolean
  mx_found: boolean
  smtp_check?: boolean
  catch_all?: boolean | null
  role: boolean
  disposable: boolean
  free?: boolean
  score: number
}

interface MailboxlayerError {
  success: false
  error: {
    code: number
    type?: string
    info?: string
  }
}

interface Config {
  apiKey: string | null
  apiUrl: string
  minScore: number
  timeoutMs: number
  cacheTtlMs: number
}

function getConfig(): Config {
  return {
    apiKey: process.env.MAILBOXLAYER_API_KEY ?? null,
    apiUrl: process.env.MAILBOXLAYER_API_URL ?? 'https://apilayer.net/api/check',
    minScore: Number.parseFloat(process.env.MAILBOXLAYER_MIN_SCORE ?? '0.65'),
    timeoutMs: Number.parseInt(process.env.MAILBOXLAYER_TIMEOUT_MS ?? '5000', 10),
    cacheTtlMs: Number.parseInt(process.env.MAILBOXLAYER_CACHE_TTL_MS ?? '86400000', 10),
  }
}

const MAX_CACHE_SIZE = 1000
interface CacheEntry { verdict: EmailVerdict; expiresAt: number }
const cache = new Map<string, CacheEntry>()

function cacheGet(key: string): EmailVerdict | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.verdict
}

function cacheSet(key: string, verdict: EmailVerdict, ttlMs: number): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, { verdict, expiresAt: Date.now() + ttlMs })
}

// Test-only: clear cache between cases. Production code never calls this.
export function __resetCacheForTests(): void {
  cache.clear()
}

const verifyLogger = logger.child({ route: 'lib/email-verification' })

function failOpenVerdict(email: string, source: 'disabled' | 'error'): EmailVerdict {
  return {
    email,
    isValid: true,
    source,
    details: {
      formatValid: true,
      mxFound: true,
      disposable: false,
      role: false,
      score: 1,
    },
  }
}

function verdictFromApi(body: MailboxlayerSuccess, minScore: number, normalised: string): EmailVerdict {
  const details = {
    formatValid: !!body.format_valid,
    mxFound: !!body.mx_found,
    disposable: !!body.disposable,
    role: !!body.role,
    score: typeof body.score === 'number' ? body.score : 0,
  }

  let reason: EmailRejectionReason | undefined
  if (!details.formatValid) reason = 'invalid_format'
  else if (!details.mxFound) reason = 'no_mx_record'
  else if (details.disposable) reason = 'disposable_provider'
  else if (details.score < minScore) reason = 'low_confidence_score'

  return {
    email: normalised,
    isValid: reason === undefined,
    reason,
    suggestion: body.did_you_mean || undefined,
    details,
    source: 'api',
  }
}

// User-safe copy per rejection reason. No leaking of mailboxlayer internals.
export function friendlyMessage(reason?: EmailRejectionReason): string {
  switch (reason) {
    case 'invalid_format':
      return 'Please enter a valid email address.'
    case 'no_mx_record':
      return 'That email domain does not appear to accept mail. Please double-check it.'
    case 'disposable_provider':
      return 'Please use a permanent email address rather than a disposable one.'
    case 'low_confidence_score':
      return 'We could not confidently verify that email address. Please double-check it.'
    default:
      return 'Please enter a valid email address.'
  }
}

export async function verifyEmail(email: string): Promise<EmailVerdict> {
  const normalised = email.trim().toLowerCase()
  const config = getConfig()

  if (!config.apiKey) {
    verifyLogger.warn('Email verification disabled (MAILBOXLAYER_API_KEY unset)', { email: normalised })
    return failOpenVerdict(normalised, 'disabled')
  }

  const cached = cacheGet(normalised)
  if (cached) {
    return { ...cached, source: 'cache' }
  }

  const url =
    `${config.apiUrl}?access_key=${encodeURIComponent(config.apiKey)}` +
    `&email=${encodeURIComponent(normalised)}&smtp=0&format=1`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      verifyLogger.warn('Email verification HTTP non-2xx', { email: normalised, status: res.status })
      return failOpenVerdict(normalised, 'error')
    }
    const body = (await res.json()) as MailboxlayerSuccess | MailboxlayerError
    if ('success' in body && body.success === false) {
      verifyLogger.warn('Email verification API error', {
        email: normalised,
        code: body.error?.code,
        type: body.error?.type,
      })
      return failOpenVerdict(normalised, 'error')
    }
    const verdict = verdictFromApi(body as MailboxlayerSuccess, config.minScore, normalised)
    cacheSet(normalised, verdict, config.cacheTtlMs)
    return verdict
  } catch (err) {
    verifyLogger.warn(
      'Email verification request failed',
      { email: normalised },
      err as Error
    )
    return failOpenVerdict(normalised, 'error')
  } finally {
    clearTimeout(timer)
  }
}
