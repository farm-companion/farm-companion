import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { prefixedNamespace } from './cache-manager'

describe('prefixedNamespace', () => {
  test('returns namespace unchanged when no prefix provided', () => {
    assert.equal(prefixedNamespace('farms'), 'farms')
    assert.equal(prefixedNamespace('rate_limit'), 'rate_limit')
  })

  test('returns namespace unchanged when prefix is empty string', () => {
    assert.equal(prefixedNamespace('farms', ''), 'farms')
  })

  test('returns namespace unchanged when prefix is undefined', () => {
    assert.equal(prefixedNamespace('farms', undefined), 'farms')
  })

  test('returns namespace unchanged when prefix is whitespace only', () => {
    assert.equal(prefixedNamespace('farms', '   '), 'farms')
    assert.equal(prefixedNamespace('farms', '\t'), 'farms')
  })

  test('prepends prefix with colon separator when configured', () => {
    assert.equal(prefixedNamespace('farms', 'fc'), 'fc:farms')
    assert.equal(prefixedNamespace('rate_limit', 'farm-companion'), 'farm-companion:rate_limit')
  })

  test('trims surrounding whitespace from prefix', () => {
    assert.equal(prefixedNamespace('farms', '  fc  '), 'fc:farms')
    assert.equal(prefixedNamespace('farms', '\tfc\n'), 'fc:farms')
  })

  test('preserves colons inside prefix (allows multi-level prefixes)', () => {
    assert.equal(prefixedNamespace('farms', 'fc:prod'), 'fc:prod:farms')
  })

  test('handles all CACHE_NAMESPACES values uniformly', () => {
    const namespaces = ['farms', 'produce', 'images', 'api', 'sessions', 'search', 'static', 'computed', 'rate_limit']
    for (const ns of namespaces) {
      assert.equal(prefixedNamespace(ns), ns, `no-prefix path for ${ns}`)
      assert.equal(prefixedNamespace(ns, 'fc'), `fc:${ns}`, `prefix path for ${ns}`)
    }
  })
})
