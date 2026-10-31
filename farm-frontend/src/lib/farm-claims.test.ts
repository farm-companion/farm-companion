import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canClaimVisitable, isIndexable, unverifiedDescription, type ClaimInput } from './farm-claims'

const base = (o: Partial<ClaimInput> = {}): ClaimInput => ({
  venueType: null, venueVerifiedAt: null, openingHours: null,
  phone: null, website: null, description: null, offerings: [],
  hasRealImage: false, ...o,
})

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

test('indexable requires the claim gate first', () => {
  assert.equal(isIndexable(base({ phone: '01803 000000', website: 'https://x.co.uk' })), false)
})

test('a verified listing with hours is indexable', () => {
  assert.equal(isIndexable(base({
    venueType: 'shop', venueVerifiedAt: new Date(),
    openingHours: [{ day: 'Monday', open: '09:00', close: '17:00' }],
  })), true)
})

test('a verified listing needs two substantive fields without hours', () => {
  const verified = { venueType: 'shop', venueVerifiedAt: new Date() }
  assert.equal(isIndexable(base({ ...verified, phone: '01803 000000' })), false)
  assert.equal(isIndexable(base({ ...verified, phone: '01803 000000', website: 'https://x.co.uk' })), true)
})

test('template description alone does not count as substance', () => {
  const verified = { venueType: 'shop', venueVerifiedAt: new Date() }
  assert.equal(isIndexable(base({
    ...verified,
    phone: '01803 000000',
    description: 'Hallgate Farm is a farm shop in Lincolnshire.',
  })), false)
})

test('default offering alone does not count as substance', () => {
  const verified = { venueType: 'shop', venueVerifiedAt: new Date() }
  assert.equal(isIndexable(base({
    ...verified,
    phone: '01803 000000',
    offerings: ['Farm Shops'],
  })), false)
})

test('whitespace-only description is ignored', () => {
  const verified = { venueType: 'shop', venueVerifiedAt: new Date() }
  assert.equal(isIndexable(base({
    ...verified,
    phone: '01803 000000',
    description: '   ',
  })), false)
})

test('unknown venue type cannot claim visitability', () => {
  assert.equal(canClaimVisitable(base({
    venueType: 'unknown', venueVerifiedAt: new Date(),
  })), false)
})

test('empty opening hours array is not treated as parsed hours', () => {
  const verified = { venueType: 'shop', venueVerifiedAt: new Date() }
  assert.equal(isIndexable(base({
    ...verified,
    openingHours: [],
    phone: '01803 000000',
  })), false)
})

test('real image alone is not enough substance', () => {
  const verified = { venueType: 'shop', venueVerifiedAt: new Date() }
  assert.equal(isIndexable(base({
    ...verified,
    hasRealImage: true,
  })), false)
})

test('the template description and the default offering do not count as substance', () => {
  const verified = { venueType: 'shop', venueVerifiedAt: new Date() }
  assert.equal(isIndexable(base({
    ...verified,
    description: 'Hallgate Farm is a farm shop in Lincolnshire.',
    offerings: ['Farm Shops'],
  })), false)
  assert.equal(isIndexable(base({
    ...verified,
    description: 'A family-run holding selling day-picked veg and raw milk.',
    offerings: ['Farm Shops', 'PYO'],
  })), true)
})

// The gate now takes a verification-only shape so list surfaces can call it
// without assembling a full ClaimInput. These three cases exist because
// getFarmData shipped without mapping the venue fields at all, so every list
// surface was passing undefined for both.

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
