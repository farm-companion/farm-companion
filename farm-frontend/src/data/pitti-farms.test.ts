// Pure unit tests for the per-farm Pitti manifest + URL resolver.
// Run via: pnpm test:unit
//
// Slice: 1.6 (covers Slice 1.1.3d-3's manifest + resolver).

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { PITTI_FARM_IMAGES, pittiFarmImageUrl } from './pitti-farms'

const HETZNER_HOST = 'https://farm-companion-blob-prod.hel1.your-objectstorage.com'

test('PITTI_FARM_IMAGES manifest starts empty post-Slice 1.1.3d-3', () => {
  // Manifest is empty at merge so popover behaviour matches pre-slice.
  // Enrollment is a per-farm content slice (1.1.3d-3-content-N).
  assert.equal(PITTI_FARM_IMAGES.size, 0)
})

test('pittiFarmImageUrl returns null for slugs not in manifest', () => {
  assert.equal(pittiFarmImageUrl('darts-farm'), null)
  assert.equal(pittiFarmImageUrl('lower-loxley'), null)
  assert.equal(pittiFarmImageUrl(''), null)
})

test('pittiFarmImageUrl returns the Hetzner blob URL when slug is enrolled', () => {
  const set = PITTI_FARM_IMAGES as Set<string>
  set.add('test-farm')
  try {
    assert.equal(
      pittiFarmImageUrl('test-farm'),
      `${HETZNER_HOST}/pitti-farm-images/test-farm/main.webp`,
    )
  } finally {
    set.delete('test-farm')
  }
})

test('pittiFarmImageUrl URL-encodes slug characters that need it', () => {
  const set = PITTI_FARM_IMAGES as Set<string>
  // A space-containing slug is contrived (real slugs are kebab-case) but the
  // encoding guard prevents an exotic slug from breaking image-proxy URL parsing.
  set.add('farm with space')
  try {
    const url = pittiFarmImageUrl('farm with space')
    assert.equal(
      url,
      `${HETZNER_HOST}/pitti-farm-images/farm%20with%20space/main.webp`,
    )
  } finally {
    set.delete('farm with space')
  }
})

test('pittiFarmImageUrl URL points at the Hetzner bucket whitelisted in next.config.ts', () => {
  // Sanity-check: any URL returned by this resolver MUST be on the Hetzner
  // host that next.config.ts whitelists via the wildcard `**.your-objectstorage.com`
  // (Slice 1.1.3a-2). If this assertion ever fails, the Next image proxy will
  // 400 every Pitti farm popover URL.
  const set = PITTI_FARM_IMAGES as Set<string>
  set.add('canary-slug')
  try {
    const url = pittiFarmImageUrl('canary-slug')
    assert.ok(url?.startsWith(HETZNER_HOST))
    assert.ok(url?.endsWith('.your-objectstorage.com/pitti-farm-images/canary-slug/main.webp'))
  } finally {
    set.delete('canary-slug')
  }
})

test('pittiFarmImageUrl respects exact-slug membership (no fuzzy match)', () => {
  const set = PITTI_FARM_IMAGES as Set<string>
  set.add('darts-farm')
  try {
    assert.ok(pittiFarmImageUrl('darts-farm'))
    assert.equal(pittiFarmImageUrl('dartsfarm'), null)
    assert.equal(pittiFarmImageUrl('darts-farms'), null)
    assert.equal(pittiFarmImageUrl('Darts-Farm'), null)
  } finally {
    set.delete('darts-farm')
  }
})
