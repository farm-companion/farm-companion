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
