// Tests for email-verification. Run via: pnpm test:unit
//
// 12 cases per spec §7 (docs/assistant/email-verification-plan.md).
// Fetch is stubbed via globalThis.fetch — no real mailboxlayer calls.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  verifyEmail,
  friendlyMessage,
  __resetCacheForTests,
  type EmailVerdict,
} from './email-verification'

interface MailboxlayerBody {
  email?: string
  did_you_mean?: string
  format_valid?: boolean
  mx_found?: boolean
  role?: boolean
  disposable?: boolean
  score?: number
  success?: false
  error?: { code: number; type?: string }
}

const GOOD: MailboxlayerBody = {
  email: 'user@example.com',
  format_valid: true,
  mx_found: true,
  disposable: false,
  role: false,
  score: 0.9,
}

function stubFetch(body: MailboxlayerBody, ok = true): { calls: number } {
  const tracker = { calls: 0 }
  ;(globalThis as unknown as { fetch: typeof fetch }).fetch = async () => {
    tracker.calls += 1
    return new Response(JSON.stringify(body), {
      status: ok ? 200 : 500,
      headers: { 'content-type': 'application/json' },
    })
  }
  return tracker
}

function stubFetchThrows(err: Error): { calls: number } {
  const tracker = { calls: 0 }
  ;(globalThis as unknown as { fetch: typeof fetch }).fetch = async () => {
    tracker.calls += 1
    throw err
  }
  return tracker
}

async function withEnv<T>(env: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const prev: Record<string, string | undefined> = {}
  const realFetch = globalThis.fetch
  for (const [k, v] of Object.entries(env)) {
    prev[k] = process.env[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  __resetCacheForTests()
  try {
    return await fn()
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    __resetCacheForTests()
    globalThis.fetch = realFetch
  }
}

test('1. valid mailbox, score 0.9 → isValid:true, source:api', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    stubFetch(GOOD)
    const v = await verifyEmail('user@example.com')
    assert.equal(v.isValid, true)
    assert.equal(v.source, 'api')
    assert.equal(v.details.score, 0.9)
  })
})

test('2. format invalid → isValid:false, reason:invalid_format', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    stubFetch({ ...GOOD, format_valid: false })
    const v = await verifyEmail('not-an-email')
    assert.equal(v.isValid, false)
    assert.equal(v.reason, 'invalid_format')
  })
})

test('3. mx_found false → isValid:false, reason:no_mx_record', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    stubFetch({ ...GOOD, mx_found: false })
    const v = await verifyEmail('x@bogus.invalid')
    assert.equal(v.isValid, false)
    assert.equal(v.reason, 'no_mx_record')
  })
})

test('4. disposable true → isValid:false, reason:disposable_provider', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    stubFetch({ ...GOOD, disposable: true })
    const v = await verifyEmail('x@mailinator.com')
    assert.equal(v.isValid, false)
    assert.equal(v.reason, 'disposable_provider')
  })
})

test('5. score below threshold → isValid:false, reason:low_confidence_score', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    stubFetch({ ...GOOD, score: 0.4 })
    const v = await verifyEmail('user@example.com')
    assert.equal(v.isValid, false)
    assert.equal(v.reason, 'low_confidence_score')
  })
})

test('6. did_you_mean present → suggestion populated', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    stubFetch({ ...GOOD, format_valid: false, did_you_mean: 'user@gmail.com' })
    const v = await verifyEmail('user@gmial.com')
    assert.equal(v.isValid, false)
    assert.equal(v.suggestion, 'user@gmail.com')
  })
})

test('7. role true, otherwise good → isValid:true (role is not a reject)', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    stubFetch({ ...GOOD, role: true })
    const v = await verifyEmail('info@farm.example')
    assert.equal(v.isValid, true)
    assert.equal(v.details.role, true)
  })
})

test('8. API key unset → isValid:true, source:disabled (fail-open)', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: undefined }, async () => {
    const tracker = stubFetch(GOOD)
    const v = await verifyEmail('user@example.com')
    assert.equal(v.isValid, true)
    assert.equal(v.source, 'disabled')
    assert.equal(tracker.calls, 0)
  })
})

test('9. fetch throws → isValid:true, source:error (fail-open)', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    stubFetchThrows(new Error('connection refused'))
    const v = await verifyEmail('user@example.com')
    assert.equal(v.isValid, true)
    assert.equal(v.source, 'error')
  })
})

test('10. timeout exceeded → isValid:true, source:error (fail-open)', async () => {
  await withEnv(
    { MAILBOXLAYER_API_KEY: 'test-key', MAILBOXLAYER_TIMEOUT_MS: '20' },
    async () => {
      ;(globalThis as unknown as { fetch: typeof fetch }).fetch = ((
        _url: unknown,
        init?: { signal?: AbortSignal }
      ): Promise<Response> =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError'))
          )
        })) as unknown as typeof fetch
      const v = await verifyEmail('slow@example.com')
      assert.equal(v.isValid, true)
      assert.equal(v.source, 'error')
    }
  )
})

test('11. quota error 104 → isValid:true, source:error (fail-open)', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    stubFetch({ success: false, error: { code: 104, type: 'usage_limit_reached' } })
    const v = await verifyEmail('user@example.com')
    assert.equal(v.isValid, true)
    assert.equal(v.source, 'error')
  })
})

test('12. second call same email → source:cache, no extra fetch invocation', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: 'test-key' }, async () => {
    const tracker = stubFetch(GOOD)
    const first = await verifyEmail('user@example.com')
    const second = await verifyEmail('USER@example.com')
    assert.equal(first.source, 'api')
    assert.equal(second.source, 'cache')
    assert.equal(second.isValid, true)
    assert.equal(tracker.calls, 1)
  })
})

test('friendlyMessage returns user-safe copy per reason', () => {
  assert.match(friendlyMessage('invalid_format'), /valid email/)
  assert.match(friendlyMessage('no_mx_record'), /does not appear to accept mail/)
  assert.match(friendlyMessage('disposable_provider'), /disposable/)
  assert.match(friendlyMessage('low_confidence_score'), /confidently/)
  assert.match(friendlyMessage(undefined), /valid email/)
})

test('EmailVerdict shape is preserved across paths', async () => {
  await withEnv({ MAILBOXLAYER_API_KEY: undefined }, async () => {
    const v: EmailVerdict = await verifyEmail('check@shape.example')
    assert.ok('email' in v && 'isValid' in v && 'details' in v && 'source' in v)
    assert.ok('formatValid' in v.details && 'score' in v.details)
  })
})
