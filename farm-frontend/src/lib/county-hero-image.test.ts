// Pure unit tests for the /counties/[slug] hero-image picker.
// Run via: pnpm test:unit
//
// Reuses existing farm imagery so every county page has a hero, with no
// new image generation. Precedence: real photo > Apothecary > Pitti.
// Pitti is on nearly every farm, so any county with farms gets a hero.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  pickCountyHeroImage,
  type CountyHeroImageInput,
} from './county-hero-image'

function img(overrides: Partial<CountyHeroImageInput> = {}): CountyHeroImageInput {
  return {
    url: 'https://example.com/photo.jpg',
    uploadedBy: 'ai_pitti',
    isHero: true,
    displayOrder: 0,
    ...overrides,
  }
}

test('returns null for empty input', () => {
  assert.equal(pickCountyHeroImage([]), null)
})

test('ignores ai_generator/unknown sources (returns null)', () => {
  assert.equal(
    pickCountyHeroImage([
      img({ url: '/legacy.jpg', uploadedBy: 'ai_generator' }),
      img({ url: '/weird.jpg', uploadedBy: 'something-else' }),
    ]),
    null,
  )
})

test('real photo wins over apothecary and pitti', () => {
  const url = pickCountyHeroImage([
    img({ url: '/pitti.webp', uploadedBy: 'ai_pitti' }),
    img({ url: '/apo.webp', uploadedBy: 'ai_apothecary' }),
    img({ url: '/owner.jpg', uploadedBy: 'owner' }),
  ])
  assert.equal(url, '/owner.jpg')
})

test('apothecary wins over pitti when no real photo', () => {
  const url = pickCountyHeroImage([
    img({ url: '/pitti.webp', uploadedBy: 'ai_pitti' }),
    img({ url: '/apo.webp', uploadedBy: 'ai_apothecary' }),
  ])
  assert.equal(url, '/apo.webp')
})

test('pitti is returned when it is the only source (coverage guarantee)', () => {
  const url = pickCountyHeroImage([img({ url: '/pitti.webp', uploadedBy: 'ai_pitti' })])
  assert.equal(url, '/pitti.webp')
})

test('admin and user provenance both count as real photos', () => {
  assert.equal(
    pickCountyHeroImage([
      img({ url: '/pitti.webp', uploadedBy: 'ai_pitti' }),
      img({ url: '/admin.jpg', uploadedBy: 'admin' }),
    ]),
    '/admin.jpg',
  )
  assert.equal(
    pickCountyHeroImage([
      img({ url: '/pitti.webp', uploadedBy: 'ai_pitti' }),
      img({ url: '/user.jpg', uploadedBy: 'user' }),
    ]),
    '/user.jpg',
  )
})

test('within the same source, isHero then displayOrder breaks ties', () => {
  const url = pickCountyHeroImage([
    img({ url: '/b.webp', uploadedBy: 'ai_pitti', isHero: true, displayOrder: 2 }),
    img({ url: '/a.webp', uploadedBy: 'ai_pitti', isHero: true, displayOrder: 1 }),
    img({ url: '/c.webp', uploadedBy: 'ai_pitti', isHero: false, displayOrder: 0 }),
  ])
  assert.equal(url, '/a.webp')
})
