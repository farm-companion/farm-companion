import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { NormalizedCandidate } from '../types'
import { tagsToCategories, enrich } from './04-enrich'
import { maybeFetchHours } from '../sources/google-hours'

test('OSM produce/organic tags map to category slugs incl. farm-shops', () => {
  const slugs = tagsToCategories({ shop: 'farm', organic: 'yes', produce: 'vegetables;eggs' })
  assert.ok(slugs.includes('farm-shops'))
  assert.ok(slugs.includes('organic'))
  assert.ok(slugs.includes('vegetables'))
  assert.ok(slugs.includes('eggs'))
})

test('every farm gets the farm-shops category even with no extra tags', () => {
  assert.deepEqual(tagsToCategories({ shop: 'farm' }), ['farm-shops'])
})

test('enrich attaches categories without removing existing ones', () => {
  const cands: NormalizedCandidate[] = [{
    osmId: 'node:1', fields: {}, categories: ['pre-existing'], images: [], aiFallbackEligible: false,
    tags: { shop: 'farm', organic: 'yes' },
  }]
  const out = enrich(cands)
  assert.ok(out[0].categories.includes('pre-existing'))
  assert.ok(out[0].categories.includes('farm-shops'))
  assert.ok(out[0].categories.includes('organic'))
})

test('google hours seam is OFF by default and returns null without fetching', async () => {
  let called = false
  const result = await maybeFetchHours('Some Farm', { fetcher: async () => { called = true; return new Response('{}') } })
  assert.equal(result, null)
  assert.equal(called, false)
})
