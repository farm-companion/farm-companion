// fetch wrapper with throttle, exponential backoff + jitter, Retry-After
// support, and a capped attempt count. Retries only idempotent failures
// (429 + 5xx). `fetcher` is injectable for tests.
import { log } from './log'

export interface FetchOptions {
  fetcher?: typeof fetch
  minDelayMs?: number
  maxAttempts?: number
  backoffBaseMs?: number
}

const RETRYABLE = new Set([429, 500, 502, 503, 504])
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Identify the client. Some providers reject the default Node/undici
// User-Agent (Overpass WAF returns 406 for curl/node/empty UAs; Wikimedia
// requires an identifying UA with contact). Override via PIPELINE_USER_AGENT.
const USER_AGENT =
  process.env.PIPELINE_USER_AGENT ??
  'FarmCompanion-Pipeline/1.0 (+https://www.farmcompanion.co.uk; contact info@eazyaccess.org)'

export async function fetchWithRetry<T = unknown>(
  url: string,
  init: RequestInit = {},
  opts: FetchOptions = {},
): Promise<T> {
  const fetcher = opts.fetcher ?? fetch
  const minDelayMs = opts.minDelayMs ?? 0
  const maxAttempts = opts.maxAttempts ?? 4
  const backoffBaseMs = opts.backoffBaseMs ?? 500

  // Ensure every request identifies itself; preserve a caller-set UA.
  const headers = new Headers(init.headers)
  if (!headers.has('user-agent')) headers.set('user-agent', USER_AGENT)
  const requestInit: RequestInit = { ...init, headers }

  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (minDelayMs > 0 && attempt === 1) await sleep(minDelayMs)
    const res = await fetcher(url, requestInit)
    if (res.ok) return (await res.json()) as T

    if (!RETRYABLE.has(res.status) || attempt === maxAttempts) {
      throw new Error(`HTTP ${res.status} for ${url}`)
    }
    const retryAfter = Number(res.headers.get('retry-after'))
    const base = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter, 60) * 1000 // cap server-asked delay at 60s
      : backoffBaseMs * 2 ** (attempt - 1) + Math.random() * backoffBaseMs
    const wait = Math.max(base, minDelayMs) // honour the polite inter-request minimum on retries too
    log('warn', 'http retry', { url, status: res.status, attempt, waitMs: Math.round(wait) })
    lastErr = new Error(`HTTP ${res.status}`)
    await sleep(wait)
  }
  throw lastErr instanceof Error ? lastErr : new Error('fetchWithRetry exhausted')
}
