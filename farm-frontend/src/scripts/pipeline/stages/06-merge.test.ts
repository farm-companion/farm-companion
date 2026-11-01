import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { DbFarm, NormalizedCandidate } from '../types'
import { buildChangeSet, loadDbSnapshot } from './06-merge'

const cand = (o: Partial<NormalizedCandidate>): NormalizedCandidate => ({
  fields: {}, categories: [], images: [], aiFallbackEligible: false, ...o,
})

test('new candidate with no DB match yields a create', () => {
  const cs = buildChangeSet(
    [cand({ osmId: 'node:1', slug: 'a', fields: { name: { value: 'A Farm', source: 'osm' } } })],
    [], '2026-05-23T00:00:00.000Z',
  )
  assert.equal(cs.length, 1)
  assert.equal(cs[0].action, 'create')
})

test('matched candidate with identical data yields a noop', () => {
  const rows: DbFarm[] = [{
    id: 'x', slug: 'a', osmId: 'node:1', fsaId: null, googlePlaceId: null,
    postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7,
    provenance: { name: { source: 'osm', at: 'x' } }, fields: { name: 'A Farm' },
  }]
  const cs = buildChangeSet([cand({ osmId: 'node:1', fields: { name: { value: 'A Farm', source: 'osm' } } })], rows, 'now')
  assert.equal(cs[0].action, 'noop')
})

test('matched candidate with a higher-source field change yields an update', () => {
  const rows: DbFarm[] = [{
    id: 'x', slug: 'a', osmId: null, fsaId: '999', googlePlaceId: null,
    postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7,
    provenance: { address: { source: 'osm', at: 'x' } }, fields: { address: 'Old' },
  }]
  const cs = buildChangeSet([cand({ fsaId: '999', fields: { address: { value: 'New Barn', source: 'fsa' } } })], rows, 'now')
  assert.equal(cs[0].action, 'update')
  assert.equal(cs[0].fields[0].to, 'New Barn')
})

test('fuzzy match sets matchKey to "fuzzy"', () => {
  const rows: DbFarm[] = [{
    id: 'x', slug: 'riverford-farm-shop', osmId: null, fsaId: null, googlePlaceId: null,
    postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7,
    provenance: {}, fields: { name: 'Riverford Farm Shop' },
  }]
  const cs = buildChangeSet([cand({ postcode: 'TQ11 0JU', latitude: 50.5008, longitude: -3.7, fields: { name: { value: 'Riverford Farmshop', source: 'osm' } } })], rows, 'now')
  assert.equal(cs[0].matchKey, 'fuzzy')
  assert.equal(cs[0].slug, 'riverford-farm-shop')
})

test('merge assigns venueType shop when OSM tag and hours agree', () => {
  const cs = buildChangeSet(
    [cand({
      osmId: 'node:1', slug: 'a',
      fields: {
        name: { value: 'A Farm Shop', source: 'osm' },
        openingHours: { value: [{ day: 'Monday', open: '09:00', close: '17:00' }], source: 'osm' },
      },
    })],
    [], '2026-08-15T00:00:00.000Z',
  )
  const venue = cs[0].fields.find((f) => f.field === 'venueType')
  assert.equal(venue?.to, 'shop')
})

test('merge leaves venueType unknown for an FSA-only candidate', () => {
  const cs = buildChangeSet(
    [cand({ fsaId: '123', slug: 'b', fields: { name: { value: 'Mr D & Mrs H Harries', source: 'fsa' } } })],
    [], '2026-08-15T00:00:00.000Z',
  )
  const venue = cs[0].fields.find((f) => f.field === 'venueType')
  assert.equal(venue, undefined)
})

test('matched row: venueType-only change promotes noop to update (curated hours protected)', () => {
  const rows: DbFarm[] = [{
    id: 'x', slug: 'a', osmId: 'node:1', fsaId: null, googlePlaceId: null,
    postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7,
    provenance: {
      name: { source: 'osm', at: '2026-01-01T00:00:00Z' },
      openingHours: { source: 'admin', at: '2026-01-01T00:00:00Z' },
    },
    fields: { name: 'A Farm Shop', openingHours: [{ day: 'Monday', open: '09:00', close: '17:00' }] },
  }]
  const cs = buildChangeSet(
    [cand({
      osmId: 'node:1', slug: 'a',
      fields: {
        name: { value: 'A Farm Shop', source: 'osm' },
        openingHours: { value: [{ day: 'Monday', open: '09:00', close: '17:00' }], source: 'osm' },
      },
    })],
    rows, '2026-08-15T00:00:00.000Z',
  )
  const venue = cs[0].fields.find((f) => f.field === 'venueType')
  assert.equal(venue?.to, 'shop', 'venueType should be classified as shop')
  assert.equal(cs[0].action, 'update', 'action should be promoted to update from noop by venueType-only change')
  assert.equal(cs[0].fields.length, 1, 'venueType should be the only field diff')
})

test('matched row: venueType unchanged when already classified as shop', () => {
  const rows: DbFarm[] = [{
    id: 'x', slug: 'a', osmId: 'node:1', fsaId: null, googlePlaceId: null,
    postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7,
    provenance: { name: { source: 'osm', at: '2026-01-01T00:00:00Z' } },
    fields: { name: 'A Farm Shop', venueType: 'shop' },
  }]
  const cs = buildChangeSet(
    [cand({
      osmId: 'node:1', slug: 'a',
      fields: {
        name: { value: 'A Farm Shop', source: 'osm' },
      },
    })],
    rows, '2026-08-15T00:00:00.000Z',
  )
  const venue = cs[0].fields.find((f) => f.field === 'venueType')
  assert.equal(venue, undefined)
  assert.equal(cs[0].action, 'noop')
})

// Two halves of the same defect, plus a guard against over-gating.
//
// classifyVenue reaches Tier A only on osmShopFarm AND hours, and the only
// admitted type it can return is 'shop'. So the case that matters is a human
// who inspected a row and recorded something else: without the guard the
// pipeline overwrites their 'market_stall' with its own 'shop', and since
// nothing can write venueVerifiedAt yet, that verification is unrecoverable.

const tierACandidate = () => cand({
  osmId: 'node:1',
  fields: {
    name: { value: 'A Farm', source: 'osm' },
    openingHours: { value: [{ day: 'monday', open: '09:00', close: '17:00' }], source: 'osm' },
  },
})

// `by` is who set venueType. It matters: an admin's venueType is protected even
// with no verification timestamp, so a test about UNcurated rows must not
// quietly hand itself admin provenance.
const row = (
  venueType: string | null,
  venueVerifiedAt: string | null,
  by: 'admin' | 'osm' = 'admin',
): DbFarm => ({
  id: 'x', slug: 'a', osmId: 'node:1', fsaId: null, googlePlaceId: null,
  postcode: 'TR11 1AA', latitude: 50.1, longitude: -5.1,
  provenance: { venueType: { source: by, at: 'x' } },
  fields: { name: 'A Farm', venueType, venueVerifiedAt },
})

test('the pipeline does not reclassify a human-verified row', () => {
  const cs = buildChangeSet([tierACandidate()], [row('market_stall', '2026-10-01T00:00:00.000Z')], 'now')
  assert.equal(cs.length, 1)
  assert.deepEqual(
    cs[0].fields.filter((f) => f.field === 'venueType'),
    [],
    'a verified market_stall must not be overwritten with the classifier\'s shop',
  )
})

test('an unverified, machine-classified row is still reclassified', () => {
  const cs = buildChangeSet([tierACandidate()], [row('market_stall', null, 'osm')], 'now')
  const venueDiffs = cs[0].fields.filter((f) => f.field === 'venueType')
  assert.equal(venueDiffs.length, 1, 'the guard must key on verification, not on being matched')
  assert.equal(venueDiffs[0].from, 'market_stall')
  assert.equal(venueDiffs[0].to, 'shop')
  assert.equal(cs[0].action, 'update')
})

test('loadDbSnapshot carries venueVerifiedAt into fields', async () => {
  const fake = {
    farm: {
      findMany: async () => [{
        id: 'x', slug: 'a', osmId: null, fsaId: null, googlePlaceId: null,
        postcode: null, latitude: 50.1, longitude: -5.1, provenance: null,
        name: 'A Farm', venueType: 'shop',
        venueVerifiedAt: '2026-10-01T00:00:00.000Z',
      }],
    },
  }
  const snapshot = await loadDbSnapshot(fake)
  assert.equal(snapshot.length, 1)
  assert.equal(
    snapshot[0].fields.venueVerifiedAt,
    '2026-10-01T00:00:00.000Z',
    'FIELD_NAMES must include venueVerifiedAt or the guard reads undefined forever',
  )
})

test('a merge preserves the admin provenance that makes a verification auditable', () => {
  // The verification importer tags venueType and venueVerifiedAt as source
  // admin. If a merge dropped provenance keys it does not know about, the row
  // would stay verified but lose the record of who verified it, and the audit
  // trail is the entire reason that column is trustworthy.
  const verifiedAt = '2026-10-31T00:00:00.000Z'
  const rows: DbFarm[] = [{
    id: 'x', slug: 'a', osmId: 'node:1', fsaId: null, googlePlaceId: null,
    postcode: 'TR11 1AA', latitude: 50.1, longitude: -5.1,
    provenance: {
      venueType: { source: 'admin', at: verifiedAt },
      venueVerifiedAt: { source: 'admin', at: verifiedAt },
      name: { source: 'osm', at: 'earlier' },
    },
    fields: { name: 'A Farm', venueType: 'shop', venueVerifiedAt: verifiedAt },
  }]
  // A candidate that legitimately updates an unrelated field.
  const cs = buildChangeSet(
    [cand({ osmId: 'node:1', fields: { phone: { value: '01326 000000', source: 'osm' } } })],
    rows, 'now',
  )
  assert.equal(cs[0].action, 'update')
  assert.deepEqual(cs[0].provenanceNext.venueType, { source: 'admin', at: verifiedAt })
  assert.deepEqual(cs[0].provenanceNext.venueVerifiedAt, { source: 'admin', at: verifiedAt })
  // And the verification itself is untouched by the unrelated update.
  assert.deepEqual(cs[0].fields.filter((f) => f.field === 'venueType'), [])
})

test('E8 reaches the merge stage: an FSA retail record with a retail name admits', () => {
  // End to end through buildChangeSet, not just the pure classifier. Before E8
  // this row had no admitting path at all: no osmId, so no OSM hours either.
  const recent = new Date()
  recent.setMonth(recent.getMonth() - 3)
  const cs = buildChangeSet(
    [cand({
      fsaId: '12345',
      fsaBusinessType: 'Retailers - other',
      fsaRatingDate: recent.toISOString(),
      fields: { name: { value: 'Lobbs Farm Shop', source: 'fsa' } },
    })],
    [], 'now',
  )
  assert.equal(cs.length, 1)
  const venue = cs[0].fields.find((f) => f.field === 'venueType')
  assert.ok(venue, 'expected a venueType diff')
  assert.equal(venue?.to, 'shop')
})

test('E8 does not admit on a stale inspection, nor on a name without retail', () => {
  const stale = cand({
    fsaId: '1', fsaBusinessType: 'Retailers - other', fsaRatingDate: '2017-11-06',
    fields: { name: { value: 'Lobbs Farm Shop', source: 'fsa' } },
  })
  assert.deepEqual(
    buildChangeSet([stale], [], 'now')[0].fields.filter((f) => f.field === 'venueType'), [],
    'a 2017 inspection is not evidence about today',
  )

  const recent = new Date(); recent.setMonth(recent.getMonth() - 3)
  const noRetailName = cand({
    fsaId: '2', fsaBusinessType: 'Retailers - other', fsaRatingDate: recent.toISOString(),
    fields: { name: { value: 'Higher Barn', source: 'fsa' } },
  })
  assert.deepEqual(
    buildChangeSet([noRetailName], [], 'now')[0].fields.filter((f) => f.field === 'venueType'), [],
    'the regulator alone must not admit',
  )

  const producer = cand({
    fsaId: '3', fsaBusinessType: 'Farmers/growers', fsaRatingDate: recent.toISOString(),
    fields: { name: { value: 'Lobbs Farm Shop', source: 'fsa' } },
  })
  assert.deepEqual(
    buildChangeSet([producer], [], 'now')[0].fields.filter((f) => f.field === 'venueType'), [],
    'the producer category must still never admit, however fresh',
  )
})

// The FSA inspection as a verification event, 2026-11-01. This is the switch
// that lets a page actually claim, so each guard around it is tested.

const recentIso = () => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString() }

const fsaCand = (o: Partial<Record<string, unknown>> = {}) => cand({
  fsaId: '900',
  fsaBusinessType: 'Retailers - other',
  fsaRatingDate: recentIso(),
  fields: { name: { value: 'Lobbs Farm Shop', source: 'fsa' } },
  ...o,
})

test('an FSA inspection sets venueVerifiedAt, dated to the inspection itself', () => {
  const date = recentIso()
  const cs = buildChangeSet([fsaCand({ fsaRatingDate: date })], [], 'now')
  const v = cs[0].fields.find((f) => f.field === 'venueVerifiedAt')
  assert.ok(v, 'expected a venueVerifiedAt diff')
  // Not "now": the inspection date, so a 23-month-old check reads as 23 months
  // old rather than as fresh.
  assert.equal(v?.to, date)
  assert.match(String(v?.reason), /fsa Retailers - other inspected/)
  assert.deepEqual(cs[0].provenanceNext.venueVerifiedAt, { source: 'fsa', at: 'now' })
})

test('the OSM Tier A path does not set venueVerifiedAt', () => {
  // An OSM tag is something someone typed. No inspection, no date, no
  // verification event, so it admits a type but cannot verify.
  const cs = buildChangeSet([cand({
    osmId: 'node:1',
    fields: {
      name: { value: 'A Farm', source: 'osm' },
      openingHours: { value: [{ day: 'monday', open: '09:00', close: '17:00' }], source: 'osm' },
    },
  })], [], 'now')
  assert.ok(cs[0].fields.some((f) => f.field === 'venueType'), 'OSM should still admit a type')
  assert.deepEqual(cs[0].fields.filter((f) => f.field === 'venueVerifiedAt'), [])
})

test('a stale inspection admits nothing and verifies nothing', () => {
  const cs = buildChangeSet([fsaCand({ fsaRatingDate: '2017-11-06' })], [], 'now')
  assert.deepEqual(cs[0].fields.filter((f) => f.field === 'venueVerifiedAt'), [])
  assert.deepEqual(cs[0].fields.filter((f) => f.field === 'venueType'), [])
})

test('a human verification is never overwritten, and never re-verified', () => {
  const rows: DbFarm[] = [{
    id: 'x', slug: 'a', osmId: null, fsaId: '900', googlePlaceId: null,
    postcode: 'TR11 1AA', latitude: 50.1, longitude: -5.1,
    provenance: { venueVerifiedAt: { source: 'admin', at: '2026-10-31' }, venueType: { source: 'admin', at: '2026-10-31' } },
    fields: { name: 'Lobbs Farm Shop', venueType: 'market_stall', venueVerifiedAt: '2026-10-31T00:00:00.000Z' },
  }]
  const cs = buildChangeSet([fsaCand()], rows, 'now')
  assert.deepEqual(cs[0].fields.filter((f) => f.field === 'venueType'), [], 'admin venueType must survive')
  assert.deepEqual(cs[0].fields.filter((f) => f.field === 'venueVerifiedAt'), [], 'admin verification must survive')
  assert.deepEqual(cs[0].provenanceNext.venueVerifiedAt, { source: 'admin', at: '2026-10-31' })
})

test('an FSA verification is not mistaken for a human one', () => {
  // The guard keys on provenance, not on the field being present. Keying on
  // presence would freeze every row the pipeline itself verified, and would
  // treat the pipeline's own write as if a person had made it.
  const rows: DbFarm[] = [{
    id: 'x', slug: 'a', osmId: null, fsaId: '900', googlePlaceId: null,
    postcode: 'TR11 1AA', latitude: 50.1, longitude: -5.1,
    provenance: { venueVerifiedAt: { source: 'fsa', at: '2026-01-01' } },
    fields: { name: 'Lobbs Farm Shop', venueType: 'market_stall', venueVerifiedAt: '2025-12-01T00:00:00.000Z' },
  }]
  const cs = buildChangeSet([fsaCand()], rows, 'now')
  const venue = cs[0].fields.find((f) => f.field === 'venueType')
  assert.ok(venue, 'an fsa-verified row must stay reclassifiable')
  assert.equal(venue?.to, 'shop')
})

test("an admin's venueType is protected even with no verification timestamp", () => {
  // Stricter than the guard this replaced. If a person deliberately recorded
  // market_stall, the pipeline does not get to overrule them just because
  // nobody filled in the timestamp as well.
  const cs = buildChangeSet([tierACandidate()], [row('market_stall', null, 'admin')], 'now')
  assert.deepEqual(cs[0].fields.filter((f) => f.field === 'venueType'), [])
})
