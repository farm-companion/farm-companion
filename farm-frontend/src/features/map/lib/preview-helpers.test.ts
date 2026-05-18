// Pure helpers for FarmPreviewCard. Run via: pnpm test:unit

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  truncateHook,
  getOpeningTone,
  buildDirectionsUrl,
  buildShopUrl,
} from './preview-helpers'

test('truncateHook returns undefined for empty/whitespace input', () => {
  assert.equal(truncateHook(undefined), undefined)
  assert.equal(truncateHook(''), undefined)
  assert.equal(truncateHook('   '), undefined)
})

test('truncateHook returns short descriptions unchanged', () => {
  const short = 'Family farm shop in the Cotswolds.'
  assert.equal(truncateHook(short), short)
})

test('truncateHook caps at 120 chars by default', () => {
  const long = 'a'.repeat(200)
  const out = truncateHook(long)
  assert.equal(out?.length, 120)
})

test('truncateHook respects custom max', () => {
  const long = 'a'.repeat(80)
  assert.equal(truncateHook(long, 50)?.length, 50)
})

test('getOpeningTone returns "open" for isOpen=true', () => {
  assert.equal(getOpeningTone(true), 'open')
})

test('getOpeningTone returns "closed" for isOpen=false', () => {
  assert.equal(getOpeningTone(false), 'closed')
})

test('getOpeningTone returns "unknown" for null/undefined', () => {
  assert.equal(getOpeningTone(null), 'unknown')
  assert.equal(getOpeningTone(undefined), 'unknown')
})

test('buildDirectionsUrl produces a google maps dir URL', () => {
  const url = buildDirectionsUrl(51.5074, -0.1278)
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1/)
  assert.match(url, /destination=51\.5074,-0\.1278/)
})

test('buildShopUrl uses origin + slug', () => {
  assert.equal(
    buildShopUrl('https://example.com', 'priory-farm'),
    'https://example.com/shop/priory-farm',
  )
})

test('buildShopUrl strips trailing slash from origin', () => {
  assert.equal(
    buildShopUrl('https://example.com/', 'priory-farm'),
    'https://example.com/shop/priory-farm',
  )
})
