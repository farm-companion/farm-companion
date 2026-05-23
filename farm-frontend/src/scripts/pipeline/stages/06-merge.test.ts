import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { DbFarm, NormalizedCandidate } from '../types'
import { buildChangeSet } from './06-merge'

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
