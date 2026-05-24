// fetch wrapper with throttle, exponential backoff + jitter, Retry-After
// support, a per-request timeout, and a capped attempt count. Retries
// idempotent failures (429 + 5xx) and transient network/timeout errors.
// `fetcher` is injectable for tests.
import { log } from './log'

export interface FetchOptions {
  fetcher?: typeof fetch
  minDelayMs?: number
  maxAttempts?: number
  backoffBaseMs?: number
  // Abort a single attempt that produces no response within this window.
  // Default sits above Overpass's server-side [timeout:120] so a legitimate
  // long query is never aborted. Set 0 to disable.
  timeoutMs?: number
}

const RETRYABLE = new Set([429, 500, 502, 503, 504])
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// One attempt with an abort-based timeout. Callers do not pass their own
// signal, so overwriting init.signal here is safe.
async function fetchOnce(
  fetcher: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  if (timeoutMs <= 0) return fetcher(url, init)
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new DOMException(`request timeout after ${timeoutMs}ms for ${url}`, 'TimeoutError')),
    timeoutMs,
  )
  try {
    return await fetcher(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

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
  const timeoutMs = opts.timeoutMs ?? 180_000 // > Overpass [timeout:120] + transfer headroom

  // Ensure every request identifies itself; preserve a caller-set UA.
  const headers = new Headers(init.headers)
  if (!headers.has('user-agent')) headers.set('user-agent', USER_AGENT)
  const requestInit: RequestInit = { ...init, headers }

  const backoff = (attempt: number) =>
    Math.max(backoffBaseMs * 2 ** (attempt - 1) + Math.random() * backoffBaseMs, minDelayMs)

  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (minDelayMs > 0 && attempt === 1) await sleep(minDelayMs)
    let res: Response
    try {
      res = await fetchOnce(fetcher, url, requestInit, timeoutMs)
    } catch (err) {
      // Timeout abort or transient network error: retry if attempts remain.
      if (attempt === maxAttempts) throw err instanceof Error ? err : new Error(`fetch failed for ${url}`)
      const wait = backoff(attempt)
      log('warn', 'http retry (network)', { url, error: err instanceof Error ? err.message : String(err), attempt, waitMs: Math.round(wait) })
      lastErr = err
      await sleep(wait)
      continue
    }
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
