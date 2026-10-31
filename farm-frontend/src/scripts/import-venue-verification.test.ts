import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseVerification } from './import-venue-verification'

const row = (o: Partial<Record<string, string>> = {}): Record<string, string> => ({
  slug: 'argal-farm-shop', name: 'Argal Farm Shop',
  venue_type: '', verified: '', verified_by: '', basis: '', notes: '', ...o,
})

const pass = (o: Partial<Record<string, string>> = {}) =>
  row({ venue_type: 'shop', verified: 'y', verified_by: 'Abu Aaliyah', basis: 'phoned, open Tue-Sat', ...o })

test('a complete row is a pass', () => {
  const { passes, declined, errors } = parseVerification([pass()])
  assert.deepEqual(errors, [])
  assert.deepEqual(declined, [])
  assert.equal(passes.length, 1)
  assert.deepEqual(passes[0], {
    slug: 'argal-farm-shop', venueType: 'shop',
    verifiedBy: 'Abu Aaliyah', basis: 'phoned, open Tue-Sat',
  })
})

test('all three admitted types are accepted and nothing else is', () => {
  for (const t of ['shop', 'pyo', 'market_stall']) {
    assert.equal(parseVerification([pass({ venue_type: t })]).passes.length, 1, t)
  }
  // 'cafe' would set venueVerifiedAt on a row the gate still refuses: a
  // verification that silently does nothing.
  for (const t of ['cafe', 'farm', 'unknown', 'Shop ']) {
    const { passes, errors } = parseVerification([pass({ venue_type: t })])
    if (t === 'Shop ') {
      assert.equal(passes.length, 1, 'case and whitespace are normalised')
    } else {
      assert.equal(passes.length, 0, t)
      assert.match(errors[0], /venue_type must be one of/)
    }
  }
})

test('a blank row is a decline, not an error', () => {
  const { passes, declined, errors } = parseVerification([row()])
  assert.deepEqual(errors, [])
  assert.deepEqual(declined, ['argal-farm-shop'])
  assert.equal(passes.length, 0)
})

test('a venue_type with no signature is an unsigned proposal, and writes nothing', () => {
  // The enrichment script pre-fills venue_type from the farm's own website.
  // Unsigned it must do nothing, and be counted so a part-done file is obvious.
  const { passes, unsigned, declined, errors } = parseVerification([row({ venue_type: 'shop' })])
  assert.deepEqual(errors, [])
  assert.equal(passes.length, 0)
  assert.deepEqual(unsigned, ['argal-farm-shop'])
  assert.deepEqual(declined, [])
})

test('a name or basis without the flag is a row someone abandoned, so it errors', () => {
  const byOnly = parseVerification([row({ venue_type: 'shop', verified_by: 'Abu Aaliyah' })])
  assert.equal(byOnly.unsigned.length, 0)
  assert.match(byOnly.errors[0], /verified_by or basis is filled but verified is blank/)

  const basisOnly = parseVerification([row({ basis: 'phoned' })])
  assert.match(basisOnly.errors[0], /verified_by or basis is filled but verified is blank/)
})

test('an unsigned verification is refused', () => {
  const noBy = parseVerification([pass({ verified_by: '' })])
  assert.equal(noBy.passes.length, 0)
  assert.match(noBy.errors[0], /verified_by is required/)

  const noBasis = parseVerification([pass({ basis: '' })])
  assert.equal(noBasis.passes.length, 0)
  assert.match(noBasis.errors[0], /basis is required/)
})

test('a garbled verified column is refused rather than guessed', () => {
  const { passes, errors } = parseVerification([pass({ verified: 'maybe' })])
  assert.equal(passes.length, 0)
  assert.match(errors[0], /verified must be y or blank/)
})

test('y, yes, true and 1 all mean verified', () => {
  for (const v of ['y', 'Y', 'yes', 'TRUE', '1']) {
    assert.equal(parseVerification([pass({ verified: v })]).passes.length, 1, v)
  }
  for (const v of ['', 'n', 'NO', 'false', '0']) {
    assert.equal(parseVerification([row({ verified: v })]).declined.length, 1, v)
  }
})

test('a missing slug and a duplicate slug are both errors', () => {
  assert.match(parseVerification([row({ slug: '' })]).errors[0], /no slug/)
  const dup = parseVerification([pass(), pass()])
  assert.equal(dup.passes.length, 1)
  assert.match(dup.errors[0], /duplicate slug/)
})

test('errors name the spreadsheet line, counting the header as line 1', () => {
  const { errors } = parseVerification([pass(), pass({ slug: 'b', verified: 'maybe' })])
  assert.match(errors[0], /line 3 \(b\)/)
})

test('one bad row does not let the good ones through', () => {
  // The caller refuses to import when errors is non-empty; this asserts the
  // parse still reports both, so the operator sees the whole picture at once.
  const { passes, errors } = parseVerification([
    pass({ slug: 'a' }),
    pass({ slug: 'b', venue_type: 'cafe' }),
    pass({ slug: 'c' }),
  ])
  assert.equal(passes.length, 2)
  assert.equal(errors.length, 1)
})
