import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { RawFarmCandidate } from '../types'
import { normalize, slugify } from './02-normalize'

test('slugify produces url-safe slugs', () => {
  assert.equal(slugify('Riverford Farm Shop'), 'riverford-farm-shop')
  assert.equal(slugify("O'Connor & Sons Farm"), 'oconnor-sons-farm')
})

test('a single OSM candidate becomes one normalized candidate with osm-tagged fields', () => {
  const raw: RawFarmCandidate[] = [{ source: 'osm', sourceId: 'node:1', name: 'Riverford Farm Shop', postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7, raw: {} }]
  const out = normalize(raw)
  assert.equal(out.length, 1)
  assert.equal(out[0].osmId, 'node:1')
  assert.equal(out[0].slug, 'riverford-farm-shop')
  assert.equal(out[0].fields.name?.source, 'osm')
})

test('same farm from OSM + FSA collapses into one candidate carrying both ids', () => {
  const raw: RawFarmCandidate[] = [
    { source: 'osm', sourceId: 'node:1', name: 'Riverford Farm Shop', postcode: 'TQ11 0JU', latitude: 50.5000, longitude: -3.7000, raw: {} },
    { source: 'fsa', sourceId: '12345', name: 'Riverford Farm Shop', postcode: 'TQ11 0JU', latitude: 50.5005, longitude: -3.7000, address: 'Wash Barn', raw: {} },
  ]
  const out = normalize(raw)
  assert.equal(out.length, 1)
  assert.equal(out[0].osmId, 'node:1')
  assert.equal(out[0].fsaId, '12345')
  assert.equal(out[0].fields.address?.source, 'fsa')
  assert.ok(out[0].mergedFrom?.length)
})

test('different farms with same name but different postcodes stay separate', () => {
  const raw: RawFarmCandidate[] = [
    { source: 'osm', sourceId: 'node:1', name: 'Manor Farm Shop', postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7, raw: {} },
    { source: 'osm', sourceId: 'node:2', name: 'Manor Farm Shop', postcode: 'YO1 7PR', latitude: 53.9, longitude: -1.0, raw: {} },
  ]
  assert.equal(normalize(raw).length, 2)
})

test('slugify strips curly apostrophes (real OSM data)', () => {
  assert.equal(slugify('O’Connor Farm'), 'oconnor-farm')
})

test('fsa name wins over osm name when both present', () => {
  const raw: RawFarmCandidate[] = [
    { source: 'osm', sourceId: 'node:1', name: 'Riverford Farm', postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7, raw: {} },
    { source: 'fsa', sourceId: '12345', name: 'Riverford Farm', postcode: 'TQ11 0JU', latitude: 50.5005, longitude: -3.7, raw: {} },
  ]
  const out = normalize(raw)
  assert.equal(out.length, 1)
  assert.equal(out[0].fields.name?.source, 'fsa')
})
