// Pure unit tests for the per-farm Pitti manifest + URL resolver.
// Run via: pnpm test:unit
//
// Probe batch (2026-05-25): Pitti illustrations are committed static assets
// under public/images/pitti/; the resolver returns that local path.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { PITTI_FARM_IMAGES, pittiFarmImageUrl } from './pitti-farms'

test('PITTI_FARM_IMAGES holds the enrolled probe batch', () => {
  assert.ok(PITTI_FARM_IMAGES.size >= 6)
  assert.ok(PITTI_FARM_IMAGES.has('cumbria-farmers'))
})

test('pittiFarmImageUrl returns null for slugs not in the manifest', () => {
  assert.equal(pittiFarmImageUrl('darts-farm'), null)
  assert.equal(pittiFarmImageUrl(''), null)
})

test('pittiFarmImageUrl returns the committed local asset path when enrolled', () => {
  assert.equal(
    pittiFarmImageUrl('cumbria-farmers'),
    '/images/pitti/farm-header-cumbria-farmers.webp',
  )
})

test('every enrolled slug resolves to a /images/pitti/.webp asset', () => {
  for (const slug of PITTI_FARM_IMAGES) {
    const url = pittiFarmImageUrl(slug)
    assert.ok(url?.startsWith('/images/pitti/farm-header-'))
    assert.ok(url?.endsWith('.webp'))
  }
})

test('pittiFarmImageUrl respects exact-slug membership (no fuzzy match)', () => {
  assert.ok(pittiFarmImageUrl('cumbria-farmers'))
  assert.equal(pittiFarmImageUrl('cumbria-farmer'), null)
  assert.equal(pittiFarmImageUrl('Cumbria-Farmers'), null)
})
