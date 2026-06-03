// Tests for lib/farm-imagery. Run via: npm run test:unit
//
// These helpers were born in FarmListCard (M2) and are shared across the map
// surfaces (list card, preview card, cluster preview) so every surface agrees
// on what counts as a real photo and what the branded fallback shows.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  farmMonogram,
  shortSource,
  resolveFarmImagery,
} from './farm-imagery'

// --- farmMonogram -----------------------------------------------------------

const monogramCases: Array<[string, string, string]> = [
  ['two words', 'Willow Farm', 'WF'],
  ['ampersand connector ignored', 'A & A Mulholland', 'AA'],
  ['single word takes two letters', 'Orchard', 'OR'],
  ['leading digit kept', '5 Fifty catering', '5F'],
  ['empty degrades to neutral mark', '', '·'],
  ['whitespace only degrades to neutral mark', '   ', '·'],
  ['lowercase input uppercased', 'home farm shop', 'HF'],
]

for (const [label, input, expected] of monogramCases) {
  test(`farmMonogram: ${label}`, () => {
    assert.equal(farmMonogram(input), expected)
  })
}

// --- shortSource -------------------------------------------------------------

test('shortSource: hostname from sourceUrl, www stripped', () => {
  assert.equal(
    shortSource({ url: 'x', sourceUrl: 'https://www.geograph.org.uk/photo/123' }),
    'geograph.org.uk'
  )
})

test('shortSource: invalid sourceUrl falls back to attribution', () => {
  assert.equal(
    shortSource({ url: 'x', sourceUrl: 'not a url', attribution: 'John Smith, CC BY-SA 2.0' }),
    'John Smith'
  )
})

test('shortSource: attribution truncated at comma or paren', () => {
  assert.equal(shortSource({ url: 'x', attribution: 'Jane (geograph)' }), 'Jane')
})

test('shortSource: no attribution degrades to "source"', () => {
  assert.equal(shortSource({ url: 'x' }), 'source')
})

// --- resolveFarmImagery -------------------------------------------------------

test('resolveFarmImagery: owner photo -> kind owner', () => {
  const r = resolveFarmImagery({ images: [{ url: 'https://img/a.jpg', uploadedBy: 'owner' }] })
  assert.equal(r.kind, 'owner')
  assert.equal(r.url, 'https://img/a.jpg')
})

test('resolveFarmImagery: admin photo -> kind owner', () => {
  const r = resolveFarmImagery({ images: [{ url: 'https://img/a.jpg', uploadedBy: 'admin' }] })
  assert.equal(r.kind, 'owner')
})

test('resolveFarmImagery: CC photo (attribution, pipeline) -> kind cc', () => {
  const r = resolveFarmImagery({
    images: [{ url: 'https://img/cc.jpg', uploadedBy: 'pipeline', attribution: 'J Smith, CC BY 2.0' }],
  })
  assert.equal(r.kind, 'cc')
  assert.equal(r.url, 'https://img/cc.jpg')
  assert.equal(r.image?.attribution, 'J Smith, CC BY 2.0')
})

test('resolveFarmImagery: unattributed pipeline image -> none (fallback tile)', () => {
  const r = resolveFarmImagery({ images: [{ url: 'https://img/x.jpg', uploadedBy: 'pipeline' }] })
  assert.equal(r.kind, 'none')
})

test('resolveFarmImagery: legacy string image (no provenance) -> none', () => {
  const r = resolveFarmImagery({ images: ['https://img/legacy.jpg'] })
  assert.equal(r.kind, 'none')
})

test('resolveFarmImagery: no images -> none', () => {
  assert.equal(resolveFarmImagery({ images: [] }).kind, 'none')
  assert.equal(resolveFarmImagery({}).kind, 'none')
})
