import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { DbFarm, NormalizedCandidate } from '../types'
import { mergeFarm, matchExisting } from './merge-policy'

const ISO = '2026-05-23T00:00:00.000Z'

function candidate(partial: Partial<NormalizedCandidate> = {}): NormalizedCandidate {
  return { fields: {}, categories: [], images: [], aiFallbackEligible: false, ...partial }
}

function dbFarm(partial: Partial<DbFarm> = {}): DbFarm {
  return {
    id: 'f1', slug: 'riverford-farm-shop', osmId: null, fsaId: null, googlePlaceId: null,
    postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7, provenance: null, fields: {},
    ...partial,
  }
}

test('create: no existing row yields action=create with provenance for every field', () => {
  const inc = candidate({ osmId: 'node:1', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } })
  const change = mergeFarm(null, inc, ISO)
  assert.equal(change.action, 'create')
  assert.equal(change.fields.find((f) => f.field === 'name')?.to, 'Riverford Farm Shop')
  assert.equal(change.provenanceNext.name?.source, 'osm')
  assert.equal(change.provenanceNext.name?.at, ISO)
})

test('never-clobber: owner-curated name is not overwritten by osm', () => {
  const existing = dbFarm({ fields: { name: 'Riverford (Owner Edited)' }, provenance: { name: { source: 'owner', at: '2026-01-01T00:00:00.000Z' } } })
  const inc = candidate({ osmId: 'node:1', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'name'), undefined)
  assert.equal(change.provenanceNext.name?.source, 'owner')
})

test('fill-empty: osm fills a null field even though osm is below curated', () => {
  const existing = dbFarm({ fields: { website: null }, provenance: {} })
  const inc = candidate({ fields: { website: { value: 'https://riverford.co.uk', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'website')?.to, 'https://riverford.co.uk')
  assert.equal(change.provenanceNext.website?.source, 'osm')
})

test('higher source overwrites lower: fsa overwrites an osm-set field', () => {
  const existing = dbFarm({ fields: { address: 'Old St' }, provenance: { address: { source: 'osm', at: ISO } } })
  const inc = candidate({ fields: { address: { value: 'Wash Barn, Buckfastleigh', source: 'fsa' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'address')?.to, 'Wash Barn, Buckfastleigh')
  assert.equal(change.provenanceNext.address?.source, 'fsa')
})

test('lower source does NOT overwrite higher: osm cannot overwrite fsa-set field', () => {
  const existing = dbFarm({ fields: { address: 'Wash Barn' }, provenance: { address: { source: 'fsa', at: ISO } } })
  const inc = candidate({ fields: { address: { value: 'Old St', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'address'), undefined)
})

test('empty incoming never erases a populated equal-source field', () => {
  const existing = dbFarm({ fields: { phone: '01234 567890' }, provenance: { phone: { source: 'osm', at: ISO } } })
  const inc = candidate({ fields: { phone: { value: '', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'phone'), undefined)
})

test('coordinates: valid existing coords are never overwritten by derived', () => {
  const existing = dbFarm({ latitude: 50.5, longitude: -3.7, fields: { latitude: 50.5, longitude: -3.7 }, provenance: { latitude: { source: 'osm', at: ISO } } })
  const inc = candidate({ fields: { latitude: { value: 50.123, source: 'derived' }, longitude: { value: -3.999, source: 'derived' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'latitude'), undefined)
})

test('status/verified: machine source cannot flip them on update', () => {
  const existing = dbFarm({ fields: { status: 'active', verified: true }, provenance: { status: { source: 'admin', at: ISO } } })
  const inc = candidate({ fields: { status: { value: 'pending', source: 'osm' }, verified: { value: false, source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'status'), undefined)
  assert.equal(change.fields.find((f) => f.field === 'verified'), undefined)
})

test('noop: identical incoming values produce action=noop with no field diffs', () => {
  const existing = dbFarm({ fields: { name: 'Riverford Farm Shop' }, provenance: { name: { source: 'osm', at: ISO } } })
  const inc = candidate({ osmId: 'node:1', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.action, 'noop')
  assert.equal(change.fields.length, 0)
})

test('match by osmId exact wins first', () => {
  const rows = [dbFarm({ id: 'a', osmId: 'node:1' }), dbFarm({ id: 'b', fsaId: '999' })]
  const inc = candidate({ osmId: 'node:1', fsaId: '999' })
  assert.equal(matchExisting(inc, rows).match?.id, 'a')
})

test('match by fsaId when no osmId match', () => {
  const rows = [dbFarm({ id: 'b', fsaId: '999' })]
  const inc = candidate({ osmId: 'node:404', fsaId: '999' })
  assert.equal(matchExisting(inc, rows).match?.id, 'b')
})

test('fuzzy match: same name within 150m and same postcode matches', () => {
  const rows = [dbFarm({ id: 'c', latitude: 50.5000, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: 'Riverford Farm Shop' } })]
  const inc = candidate({ latitude: 50.5008, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: { value: 'Riverford Farmshop', source: 'osm' } } })
  const result = matchExisting(inc, rows)
  assert.equal(result.match?.id, 'c')
  assert.equal(result.matchKey, 'fuzzy')
})

test('fuzzy match: same name but >150m apart does NOT match', () => {
  const rows = [dbFarm({ id: 'c', latitude: 50.5000, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: 'Riverford Farm Shop' } })]
  const inc = candidate({ latitude: 50.5050, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } })
  assert.equal(matchExisting(inc, rows).match, null)
})

test('fuzzy match: never matches across different postcodes', () => {
  const rows = [dbFarm({ id: 'c', latitude: 50.5000, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: 'Riverford Farm Shop' } })]
  const inc = candidate({ latitude: 50.5008, longitude: -3.7000, postcode: 'EX5 1DX', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } })
  assert.equal(matchExisting(inc, rows).match, null)
})

test('no match yields null (caller will create)', () => {
  const rows = [dbFarm({ id: 'c', latitude: 50.5, longitude: -3.7, postcode: 'TQ11 0JU', fields: { name: 'Riverford Farm Shop' } })]
  const inc = candidate({ latitude: 55, longitude: -1, postcode: 'YO1 7PR', fields: { name: { value: 'Totally Different Farm', source: 'osm' } } })
  assert.equal(matchExisting(inc, rows).match, null)
})

test('status/verified: machine source cannot SET them on update even when existing is empty', () => {
  const existing = dbFarm({ fields: { status: null, verified: null }, provenance: {} })
  const inc = candidate({ fields: { status: { value: 'pending', source: 'osm' }, verified: { value: true, source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'status'), undefined)
  assert.equal(change.fields.find((f) => f.field === 'verified'), undefined)
})

test('status/verified: machine source MAY set them on create', () => {
  const inc = candidate({ slug: 'new-farm', fields: { status: { value: 'active', source: 'osm' }, verified: { value: false, source: 'osm' } } })
  const change = mergeFarm(null, inc, ISO)
  assert.equal(change.action, 'create')
  assert.equal(change.fields.find((f) => f.field === 'status')?.to, 'active')
})

test('status/verified: a curated source CAN update them', () => {
  const existing = dbFarm({ fields: { status: 'active' }, provenance: { status: { source: 'admin', at: ISO } } })
  const inc = candidate({ fields: { status: { value: 'suspended', source: 'admin' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'status')?.to, 'suspended')
})

test('match by googlePlaceId when no osmId/fsaId match', () => {
  const rows = [dbFarm({ id: 'g', googlePlaceId: 'place-123' })]
  const inc = candidate({ googlePlaceId: 'place-123' })
  const result = matchExisting(inc, rows)
  assert.equal(result.match?.id, 'g')
  assert.equal(result.matchKey, 'googlePlaceId')
})

test('match by slug when no id matches', () => {
  const rows = [dbFarm({ id: 's', slug: 'riverford-farm-shop' })]
  const inc = candidate({ slug: 'riverford-farm-shop' })
  const result = matchExisting(inc, rows)
  assert.equal(result.match?.id, 's')
  assert.equal(result.matchKey, 'slug')
})

test('legacy row with no provenance: a machine source MAY overwrite a populated field (precedence 0 baseline)', () => {
  // Documents the intended policy: rows imported before provenance tracking
  // existed have no provenance, so they are treated as precedence 0 and are
  // overwritable by machine sources. (Residual risk of clobbering a
  // pre-provenance owner edit is surfaced at the load dry-run, not here.)
  const existing = dbFarm({ fields: { address: 'Legacy Imported Addr' }, provenance: {} })
  const inc = candidate({ fields: { address: { value: 'Wash Barn', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'address')?.to, 'Wash Barn')
  assert.equal(change.provenanceNext.address?.source, 'osm')
})

test('curated user source CAN update verified on an existing row', () => {
  const existing = dbFarm({ fields: { verified: false }, provenance: { verified: { source: 'user', at: ISO } } })
  const inc = candidate({ fields: { verified: { value: true, source: 'user' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'verified')?.to, true)
})

test('mergeFarm carries targetId (existing id) and match ids for the load stage', () => {
  const existing = dbFarm({ id: 'row-1', osmId: 'node:1', fields: { address: 'Old' }, provenance: { address: { source: 'osm', at: ISO } } })
  const inc = candidate({ osmId: 'node:1', fsaId: '999', fields: { address: { value: 'New Barn', source: 'fsa' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.targetId, 'row-1')
  assert.equal(change.osmId, 'node:1')
  assert.equal(change.fsaId, '999')
})

test('mergeFarm on create has no targetId', () => {
  const change = mergeFarm(null, candidate({ slug: 'new-farm', osmId: 'node:9', fields: { name: { value: 'New', source: 'osm' } } }), ISO)
  assert.equal(change.targetId, undefined)
  assert.equal(change.osmId, 'node:9')
})
