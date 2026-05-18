import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { buildLimiterPrefix, submitLimiter } from './rate-limit'

describe('buildLimiterPrefix', () => {
  test('returns library default when no prefix provided', () => {
    assert.equal(buildLimiterPrefix(), '@upstash/ratelimit')
  })

  test('returns library default when prefix is undefined', () => {
    assert.equal(buildLimiterPrefix(undefined), '@upstash/ratelimit')
  })

  test('returns library default when prefix is empty string', () => {
    assert.equal(buildLimiterPrefix(''), '@upstash/ratelimit')
  })

  test('returns library default when prefix is whitespace only', () => {
    assert.equal(buildLimiterPrefix('   '), '@upstash/ratelimit')
    assert.equal(buildLimiterPrefix('\t'), '@upstash/ratelimit')
  })

  test('prepends prefix with :ratelimit suffix when configured', () => {
    assert.equal(buildLimiterPrefix('fc'), 'fc:ratelimit')
    assert.equal(buildLimiterPrefix('farm-companion'), 'farm-companion:ratelimit')
  })

  test('trims surrounding whitespace from prefix', () => {
    assert.equal(buildLimiterPrefix('  fc  '), 'fc:ratelimit')
    assert.equal(buildLimiterPrefix('\tfc\n'), 'fc:ratelimit')
  })

  test('preserves embedded colons in multi-level prefix', () => {
    assert.equal(buildLimiterPrefix('app:env'), 'app:env:ratelimit')
  })
})

describe('submitLimiter', () => {
  test('exposes the Ratelimit limit() method', () => {
    assert.equal(typeof submitLimiter.limit, 'function')
  })

  test('exposes blockUntilReady, resetUsedTokens, getRemaining helpers', () => {
    assert.equal(typeof submitLimiter.blockUntilReady, 'function')
    assert.equal(typeof submitLimiter.resetUsedTokens, 'function')
    assert.equal(typeof submitLimiter.getRemaining, 'function')
  })
})
