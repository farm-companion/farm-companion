import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canClaimVisitable, isIndexable, unverifiedDescription, type ClaimInput } from './farm-claims'

const base = (o: Partial<ClaimInput> = {}): ClaimInput => ({
  venueType: null, venueVerifiedAt: null,
  postcode: null, address: null, county: null, ...o,
})

// ---------------------------------------------------------------------------
// The claim gate. Unchanged: it decides what a page may SAY.
// ---------------------------------------------------------------------------

test('an unverified listing may never claim visitability', () => {
  assert.equal(canClaimVisitable(base()), false)
  assert.equal(canClaimVisitable(base({ venueType: 'shop' })), false)
  assert.equal(canClaimVisitable(base({ venueVerifiedAt: '2026-08-15T00:00:00.000Z' })), false)
})

test('a producer may never claim visitability even when verified', () => {
  assert.equal(canClaimVisitable(base({
    venueType: 'producer_no_public_access', venueVerifiedAt: '2026-08-15T00:00:00.000Z',
  })), false)
})

test('each admitted venue type may claim once verified', () => {
  for (const venueType of ['shop', 'pyo', 'market_stall']) {
    assert.equal(canClaimVisitable(base({ venueType, venueVerifiedAt: new Date() })), true, venueType)
  }
})

test('unknown venue type cannot claim visitability', () => {
  assert.equal(canClaimVisitable(base({ venueType: 'unknown', venueVerifiedAt: new Date() })), false)
})

test('the gate accepts a verification-only object', () => {
  assert.equal(canClaimVisitable({ venueType: 'shop', venueVerifiedAt: new Date() }), true)
  assert.equal(canClaimVisitable({ venueType: 'shop', venueVerifiedAt: null }), false)
})

test('absent venue fields fail closed, not open', () => {
  assert.equal(canClaimVisitable({}), false)
  assert.equal(canClaimVisitable({ venueType: undefined, venueVerifiedAt: undefined }), false)
  assert.equal(canClaimVisitable({ venueType: 'shop' }), false)
  assert.equal(canClaimVisitable({ venueVerifiedAt: new Date() }), false)
})

// ---------------------------------------------------------------------------
// The index gate. Deliberately independent of the claim gate.
//
// It used to begin `if (!canClaimVisitable(f)) return false`, which meant an
// unverified page was not merely silenced but removed from Google. Measured
// against Search Console on 1 Nov 2026 that cost 373 of the site's 431 clicks:
// 210 of the 211 pages earning anything would have gone noindex, and none of
// them can be verified (151 of the 166 with an FSA record are registered
// Farmers/growers, which never admits). Telling the truth about a page does
// not require hiding it, so the two gates are now separate concerns.
// ---------------------------------------------------------------------------

test('an unverified page is still indexable when a reader could find it', () => {
  // The decoupling, stated as a test. This was false before.
  assert.equal(isIndexable(base({ postcode: 'TQ9 6JE' })), true)
  assert.equal(canClaimVisitable(base({ postcode: 'TQ9 6JE' })), false)
})

test('a page with no findable place is not indexable', () => {
  assert.equal(isIndexable(base()), false)
  assert.equal(isIndexable(base({ venueType: 'shop', venueVerifiedAt: new Date() })), false)
})

test('a valid UK postcode is a findable place on its own', () => {
  for (const postcode of ['TQ9 6JE', 'tq9 6je', 'TQ96JE', 'W1A 1AA', 'PL30 5JS']) {
    assert.equal(isIndexable(base({ postcode })), true, postcode)
  }
})

test('an address with a county is a findable place without a postcode', () => {
  assert.equal(isIndexable(base({ address: 'Week Farm, Dartington', county: 'Devon' })), true)
  assert.equal(isIndexable(base({ address: 'Week Farm, Dartington' })), false)
  assert.equal(isIndexable(base({ county: 'Devon' })), false)
})

test('the literal UK is not a postcode', () => {
  // 254 active rows store exactly this. A page that can only say "UK" tells a
  // reader nothing about where to go.
  assert.equal(isIndexable(base({ postcode: 'UK' })), false)
  assert.equal(isIndexable(base({ postcode: ' uk ' })), false)
})

test('a malformed postcode does not pass, and does not rescue a bare address', () => {
  assert.equal(isIndexable(base({ postcode: 'TQ9' })), false)
  assert.equal(isIndexable(base({ postcode: '12345' })), false)
  assert.equal(isIndexable(base({ postcode: 'TQ9', address: 'Week Farm' })), false)
})

test('whitespace is not a place', () => {
  assert.equal(isIndexable(base({ postcode: '   ' })), false)
  assert.equal(isIndexable(base({ address: '  ', county: '  ' })), false)
})

// ---------------------------------------------------------------------------
// The sentence an ungated page says instead.
// ---------------------------------------------------------------------------

test('the unverified sentence makes no visitability claim', () => {
  const sentence = unverifiedDescription('Cornwall')
  assert.match(sentence, /Cornwall/)
  // The whole point of the sentence: it must never reintroduce the claim the
  // gate exists to suppress, in any casing.
  assert.doesNotMatch(sentence, /farm ?shop/i)
  assert.doesNotMatch(sentence, /\bvisit(?!ors)/i)
  assert.match(sentence, /not confirmed/i)
})

test('the unverified sentence degrades without a county', () => {
  assert.equal(
    unverifiedDescription(''),
    'A registered food producer in the UK. We have not confirmed whether it is open to visitors.',
  )
})
