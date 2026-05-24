import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchWithRetry } from './http'

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers })
}

test('returns parsed JSON on first success', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return jsonResponse({ ok: true }) }
  const result = await fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 3, backoffBaseMs: 1 })
  assert.deepEqual(result, { ok: true })
  assert.equal(calls, 1)
})

test('retries on 429 then succeeds', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return calls < 3 ? jsonResponse({}, 429) : jsonResponse({ ok: true }) }
  const result = await fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 5, backoffBaseMs: 1 })
  assert.deepEqual(result, { ok: true })
  assert.equal(calls, 3)
})

test('throws after exhausting attempts on persistent 503', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return jsonResponse({}, 503) }
  await assert.rejects(fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 3, backoffBaseMs: 1 }), /503/)
  assert.equal(calls, 3)
})

test('does not retry on 400 (client error)', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return jsonResponse({}, 400) }
  await assert.rejects(fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 3, backoffBaseMs: 1 }), /400/)
  assert.equal(calls, 1)
})

test('injects a descriptive User-Agent when caller provides none', async () => {
  let seen: Headers | undefined
  const fetcher = (async (_url: unknown, init?: RequestInit) => {
    seen = new Headers(init?.headers)
    return jsonResponse({ ok: true })
  }) as unknown as typeof fetch
  await fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0 })
  assert.match(seen?.get('user-agent') ?? '', /FarmCompanion/i)
})

test('preserves a caller-provided User-Agent', async () => {
  let seen: Headers | undefined
  const fetcher = (async (_url: unknown, init?: RequestInit) => {
    seen = new Headers(init?.headers)
    return jsonResponse({ ok: true })
  }) as unknown as typeof fetch
  await fetchWithRetry('https://x', { headers: { 'User-Agent': 'custom/9' } }, { fetcher, minDelayMs: 0 })
  assert.equal(seen?.get('user-agent'), 'custom/9')
})

test('preserves caller Content-Type while adding the default User-Agent', async () => {
  let seen: Headers | undefined
  const fetcher = (async (_url: unknown, init?: RequestInit) => {
    seen = new Headers(init?.headers)
    return jsonResponse({ ok: true })
  }) as unknown as typeof fetch
  await fetchWithRetry('https://x', { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, { fetcher, minDelayMs: 0 })
  assert.equal(seen?.get('content-type'), 'application/x-www-form-urlencoded')
  assert.match(seen?.get('user-agent') ?? '', /FarmCompanion/i)
})

// A fetcher that never resolves unless its request is aborted, simulating a
// stalled socket. Rejects with the abort reason so the timeout path is exercised.
function stallUntilAborted(onCall?: () => void): typeof fetch {
  return ((_url: unknown, init?: RequestInit) => {
    onCall?.()
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal
      signal?.addEventListener('abort', () => reject(signal.reason ?? new Error('aborted')))
    })
  }) as unknown as typeof fetch
}

test('passes an abort signal to the fetcher', async () => {
  let seenSignal: unknown
  const fetcher = (async (_url: unknown, init?: RequestInit) => {
    seenSignal = init?.signal
    return jsonResponse({ ok: true })
  }) as unknown as typeof fetch
  await fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, timeoutMs: 1000 })
  assert.ok(seenSignal instanceof AbortSignal)
})

test('aborts a stalled request via timeout, then retries and succeeds', { timeout: 2000 }, async () => {
  let calls = 0
  const fetcher = ((_url: unknown, init?: RequestInit) => {
    calls++
    if (calls >= 2) return Promise.resolve(jsonResponse({ ok: true }))
    return stallUntilAborted()(_url as string, init)
  }) as unknown as typeof fetch
  const result = await fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 3, backoffBaseMs: 1, timeoutMs: 10 })
  assert.deepEqual(result, { ok: true })
  assert.equal(calls, 2)
})

test('throws after exhausting attempts when every request times out', { timeout: 2000 }, async () => {
  let calls = 0
  const fetcher = stallUntilAborted(() => { calls++ })
  await assert.rejects(
    fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 2, backoffBaseMs: 1, timeoutMs: 10 }),
    /timeout|abort/i,
  )
  assert.equal(calls, 2)
})
