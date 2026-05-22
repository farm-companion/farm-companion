// Pure unit tests for the county Pitti manifest + URL resolver.
// Run via: pnpm test:unit
//
// Slice: 1.6 (covers Slice 1.1.3d-2's manifest + resolver).

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { PITTI_COUNTY_IMAGES, pittiCountyImageUrl } from './pitti-counties'

test('PITTI_COUNTY_IMAGES manifest starts empty post-Slice 1.1.3d-2', () => {
  // The manifest is intentionally seeded empty at slice merge so user-visible
  // behaviour matches pre-slice. Any addition is a content slice (1.1.3d-2-content-N)
  // and must ride with the corresponding .webp asset in public/images/pitti/.
  assert.equal(PITTI_COUNTY_IMAGES.size, 0)
})

test('pittiCountyImageUrl returns null for slugs not in manifest', () => {
  assert.equal(pittiCountyImageUrl('devon'), null)
  assert.equal(pittiCountyImageUrl('cornwall'), null)
  assert.equal(pittiCountyImageUrl('greater-london'), null)
  assert.equal(pittiCountyImageUrl(''), null)
})

test('pittiCountyImageUrl returns the public-path URL when slug is enrolled', () => {
  const set = PITTI_COUNTY_IMAGES as Set<string>
  set.add('test-county')
  try {
    assert.equal(
      pittiCountyImageUrl('test-county'),
      '/images/pitti/county-test-county.webp',
    )
  } finally {
    set.delete('test-county')
  }
})

test('pittiCountyImageUrl respects exact-slug membership (no fuzzy match)', () => {
  const set = PITTI_COUNTY_IMAGES as Set<string>
  set.add('devon')
  try {
    assert.equal(pittiCountyImageUrl('devon'), '/images/pitti/county-devon.webp')
    // Prefix/suffix matches must not leak through.
    assert.equal(pittiCountyImageUrl('devonshire'), null)
    assert.equal(pittiCountyImageUrl('north-devon'), null)
    assert.equal(pittiCountyImageUrl('DEVON'), null)
  } finally {
    set.delete('devon')
  }
})
