import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { withKvTimeout, KvTimeoutError } from './kv'

describe('withKvTimeout', () => {
  test('resolves when underlying promise resolves before timeout', async () => {
    const result = await withKvTimeout(Promise.resolve('ok'), 'fast-op', 200)
    assert.equal(result, 'ok')
  })

  test('rejects with KvTimeoutError when underlying promise hangs', async () => {
    const hangingPromise = new Promise(() => {
      // never resolves, never rejects — simulates @upstash/redis fetch
      // against a dead endpoint
    })
    const start = Date.now()
    await assert.rejects(
      withKvTimeout(hangingPromise, 'hanging-op', 100),
      (err: unknown) => {
        assert.ok(err instanceof KvTimeoutError, 'expected KvTimeoutError')
        assert.equal(err.operation, 'hanging-op')
        assert.equal(err.timeoutMs, 100)
        assert.match(err.message, /hanging-op/)
        assert.match(err.message, /100ms/)
        return true
      },
    )
    const elapsed = Date.now() - start
    // Allow generous upper bound to avoid CI flakiness; lower bound proves
    // we waited for the timeout and did not reject prematurely.
    assert.ok(
      elapsed >= 90 && elapsed < 500,
      `expected ~100ms timeout window, got ${elapsed}ms`,
    )
  })

  test('propagates original rejection when underlying promise rejects', async () => {
    const original = new Error('underlying failure')
    await assert.rejects(
      withKvTimeout(Promise.reject(original), 'reject-op', 200),
      (err: unknown) => err === original,
    )
  })

  test('clears timer on fast resolution so process can exit', async () => {
    // If timers leak, this loop would keep the event loop busy and Node's
    // test runner would hang. Completing this loop is the assertion.
    for (let i = 0; i < 5; i++) {
      const result = await withKvTimeout(Promise.resolve(i), 'cleanup-op', 5000)
      assert.equal(result, i)
    }
  })

  test('KvTimeoutError preserves operation name and timeout value', () => {
    const err = new KvTimeoutError('setex', 250)
    assert.equal(err.operation, 'setex')
    assert.equal(err.timeoutMs, 250)
    assert.equal(err.name, 'KvTimeoutError')
    assert.match(err.message, /setex/)
    assert.match(err.message, /250ms/)
    assert.ok(err instanceof Error)
    assert.ok(err instanceof KvTimeoutError)
  })
})
