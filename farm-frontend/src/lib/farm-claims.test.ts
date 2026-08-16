import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canClaimVisitable, isIndexable, type ClaimInput } from './farm-claims'

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
