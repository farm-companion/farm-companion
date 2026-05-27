// Pure unit tests for the /shop/[slug] hero-image selector.
// Run via: pnpm test:unit
//
// Slice: 1.6 (covers Slice 1.1.3b's selectFarmHeroImage precedence chain).
// The selector gates the rendering of ~1300 /shop/[slug] hero blocks;
// regressions here silently break editorial hero presentation site-wide.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  selectFarmHeroImage,
  type FarmHeroImageInput,
} from './farm-hero-image'

function img(overrides: Partial<FarmHeroImageInput> = {}): FarmHeroImageInput {
  return {
    url: 'https://example.com/photo.jpg',
    altText: null,
    isHero: false,
    displayOrder: 0,
    uploadedBy: 'admin',
    ...overrides,
  }
}

test('returns null for empty input', () => {
  assert.equal(selectFarmHeroImage([], 'Test Farm'), null)
})

test('admin photo wins over apothecary illustration', () => {
  const result = selectFarmHeroImage(
    [
      img({ url: '/apo.webp', uploadedBy: 'ai_apothecary' }),
      img({ url: '/admin.jpg', uploadedBy: 'admin' }),
    ],
    'Test Farm',
  )
  assert.equal(result?.url, '/admin.jpg')
  assert.equal(result?.style, 'photo')
})

test('owner provenance counts as admin photo (style=photo)', () => {
  const result = selectFarmHeroImage(
    [img({ url: '/owner.jpg', uploadedBy: 'owner' })],
    'Test Farm',
  )
  assert.equal(result?.url, '/owner.jpg')
  assert.equal(result?.style, 'photo')
})

test('user provenance counts as admin photo (style=photo)', () => {
  const result = selectFarmHeroImage(
    [img({ url: '/user.jpg', uploadedBy: 'user' })],
    'Test Farm',
  )
  assert.equal(result?.url, '/user.jpg')
  assert.equal(result?.style, 'photo')
})

test('apothecary illustration does NOT hero a farm (AI is never documentary)', () => {
  // design-law-reconciliation 2026-05-27: an AI illustration at hero size
  // implies "this is what this farm looks like". A farm with ONLY an
  // Apothecary row must render the typographic hero (null).
  const result = selectFarmHeroImage(
    [img({ url: '/apo.webp', uploadedBy: 'ai_apothecary' })],
    'Test Farm',
  )
  assert.equal(result, null)
})

test('ai_pitti is ignored on /shop hero (reserved for hero/county/popover)', () => {
  // Council assignment 2026-05-21: Pitti is PLACE; /shop is PRODUCT.
  // A farm with ONLY a Pitti row must render the typography-led hero (null).
  const result = selectFarmHeroImage(
    [img({ url: '/pitti.webp', uploadedBy: 'ai_pitti' })],
    'Test Farm',
  )
  assert.equal(result, null)
})

test('ai_generator legacy fake-photo rows are ignored', () => {
  // Slice 1.1.3c suppresses ai_generator on the gallery and listings;
  // the hero selector mirrors that policy.
  const result = selectFarmHeroImage(
    [img({ url: '/fake.jpg', uploadedBy: 'ai_generator' })],
    'Test Farm',
  )
  assert.equal(result, null)
})

test('Pitti + Apothecary present, no real photo → null (both are AI)', () => {
  const result = selectFarmHeroImage(
    [
      img({ url: '/pitti.webp', uploadedBy: 'ai_pitti' }),
      img({ url: '/apo.webp', uploadedBy: 'ai_apothecary' }),
    ],
    'Test Farm',
  )
  assert.equal(result, null)
})

test('isHero=true wins among admin photos', () => {
  const result = selectFarmHeroImage(
    [
      img({ url: '/not-hero.jpg', uploadedBy: 'admin', isHero: false, displayOrder: 0 }),
      img({ url: '/is-hero.jpg', uploadedBy: 'admin', isHero: true, displayOrder: 9 }),
    ],
    'Test Farm',
  )
  assert.equal(result?.url, '/is-hero.jpg')
})

test('lower displayOrder wins when isHero ties', () => {
  const result = selectFarmHeroImage(
    [
      img({ url: '/order-5.jpg', uploadedBy: 'admin', isHero: false, displayOrder: 5 }),
      img({ url: '/order-0.jpg', uploadedBy: 'admin', isHero: false, displayOrder: 0 }),
    ],
    'Test Farm',
  )
  assert.equal(result?.url, '/order-0.jpg')
})

test('newer createdAt wins when isHero and displayOrder tie', () => {
  const result = selectFarmHeroImage(
    [
      img({ url: '/older.jpg', uploadedBy: 'admin', createdAt: new Date('2024-01-01T00:00:00Z') }),
      img({ url: '/newer.jpg', uploadedBy: 'admin', createdAt: new Date('2025-06-01T00:00:00Z') }),
    ],
    'Test Farm',
  )
  assert.equal(result?.url, '/newer.jpg')
})

test('missing createdAt is treated as epoch 0 (dated row wins)', () => {
  const result = selectFarmHeroImage(
    [
      img({ url: '/dated.jpg', uploadedBy: 'admin', createdAt: new Date('2024-01-01T00:00:00Z') }),
      img({ url: '/undated.jpg', uploadedBy: 'admin' /* no createdAt */ }),
    ],
    'Test Farm',
  )
  assert.equal(result?.url, '/dated.jpg')
})

test('explicit altText is preserved in the output', () => {
  const result = selectFarmHeroImage(
    [img({ uploadedBy: 'admin', altText: 'Custom alt text' })],
    'Test Farm',
  )
  assert.equal(result?.alt, 'Custom alt text')
})

test('falls back to "{farm} farm shop" alt for photo with no altText', () => {
  const result = selectFarmHeroImage(
    [img({ uploadedBy: 'admin', altText: null })],
    'Cherry Hinton',
  )
  assert.equal(result?.alt, 'Cherry Hinton farm shop')
})

test('apothecary returns null even with altText (AI never heroes a farm)', () => {
  const result = selectFarmHeroImage(
    [img({ uploadedBy: 'ai_apothecary', altText: 'Custom apothecary alt' })],
    'Cherry Hinton',
  )
  assert.equal(result, null)
})

test('input array is not mutated by the sort', () => {
  // Selector receives a ReadonlyArray and must respect that contract;
  // mutating Prisma findMany results in the caller would corrupt page state.
  const input = [
    img({ url: '/a.jpg', uploadedBy: 'admin', displayOrder: 5 }),
    img({ url: '/b.jpg', uploadedBy: 'admin', displayOrder: 0 }),
  ]
  const snapshot = input.map(i => i.url)
  selectFarmHeroImage(input, 'Test Farm')
  assert.deepEqual(
    input.map(i => i.url),
    snapshot,
  )
})

test('unknown uploadedBy values are ignored (forward-compatible)', () => {
  // If a new style label (e.g. ai_future_style) ships before this selector
  // knows about it, the safe default is "no hero" rather than rendering an
  // unvetted illustration.
  const result = selectFarmHeroImage(
    [img({ url: '/unknown.webp', uploadedBy: 'ai_future_style' })],
    'Test Farm',
  )
  assert.equal(result, null)
})
