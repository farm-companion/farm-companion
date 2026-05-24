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
