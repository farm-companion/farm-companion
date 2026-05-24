import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseBulkPostcodes } from './postcodes'

const fixture = JSON.parse(readFileSync(resolve(__dirname, '../__fixtures__/postcodes-sample.json'), 'utf8'))

test('maps valid postcode to coords + county/district', () => {
  const map = parseBulkPostcodes(fixture)
  const hit = map.get('TQ11 0JU')
  assert.equal(hit?.latitude, 50.5008)
  assert.equal(hit?.county, 'Devon')
  assert.equal(hit?.city, 'South Hams')
})

test('invalid postcode maps to undefined (not present)', () => {
  const map = parseBulkPostcodes(fixture)
  assert.equal(map.get('ZZ99 9ZZ'), undefined)
})

import { geocode } from '../stages/03-geocode'
import type { NormalizedCandidate } from '../types'

function makeCandidate(partial: Partial<NormalizedCandidate>): NormalizedCandidate {
  return { fields: {}, categories: [], images: [], aiFallbackEligible: false, ...partial }
}

test('geocode fills missing coords as derived, preserves existing coords and existing county', async () => {
  const fetcher = async () => new Response(JSON.stringify(fixture), { status: 200 })
  const opts = { fetcher: fetcher as unknown as typeof fetch, minDelayMs: 0 }
  const missing = makeCandidate({ postcode: 'TQ11 0JU' })
  const hasCoords = makeCandidate({ postcode: 'TQ11 0JU', latitude: 11.11, longitude: 22.22, fields: { latitude: { value: 11.11, source: 'osm' } } })
  const hasCounty = makeCandidate({ postcode: 'TQ11 0JU', fields: { county: { value: 'Existing County', source: 'fsa' } } })
  const out = await geocode([missing, hasCoords, hasCounty], opts)
  // missing: derived coords + county + city
  assert.equal(out[0].latitude, 50.5008)
  assert.equal(out[0].fields.latitude?.source, 'derived')
  assert.equal(out[0].fields.longitude?.source, 'derived')
  assert.equal(out[0].fields.county?.value, 'Devon')
  // existing coords preserved
  assert.equal(out[1].latitude, 11.11)
  assert.equal(out[1].fields.latitude?.source, 'osm')
  // existing county preserved, not overwritten by derived
  assert.equal(out[2].fields.county?.value, 'Existing County')
  assert.equal(out[2].fields.county?.source, 'fsa')
})
