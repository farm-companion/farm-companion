import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { ImageCandidate } from '../types'
import { rankImages, attachableImages, decideImages, combineImages } from './05-images'

const cc = (over: Partial<ImageCandidate> = {}): ImageCandidate => ({
  url: 'https://x/img.jpg', source: 'geograph', license: 'CC-BY-SA-2.0',
  attribution: 'Jane Doe', sourceUrl: 'https://geograph/123', score: 0, ...over,
})

test('ranking prefers higher score', () => {
  const ranked = rankImages([cc({ score: 1 }), cc({ score: 5 }), cc({ score: 3 })])
  assert.deepEqual(ranked.map((i) => i.score), [5, 3, 1])
})

test('image with missing attribution is NOT attachable', () => {
  const ok = cc()
  const out = attachableImages([ok, cc({ attribution: '' })])
  assert.equal(out.length, 1)
  assert.equal(out[0], ok)
})

test('image with missing license is NOT attachable', () => {
  assert.equal(attachableImages([cc({ license: '' })]).length, 0)
})

test('no attachable CC images -> aiFallbackEligible true, images empty', () => {
  const r = decideImages([cc({ attribution: '' })])
  assert.equal(r.aiFallbackEligible, true)
  assert.equal(r.images.length, 0)
})

test('attachable CC images present -> aiFallbackEligible false, highest score first', () => {
  const r = decideImages([cc({ score: 2 }), cc({ score: 9 })])
  assert.equal(r.aiFallbackEligible, false)
  assert.equal(r.images[0].score, 9)
})

test('combineImages concatenates existing + fetched and dedupes by url (existing wins)', () => {
  const existing = [cc({ url: 'https://a', source: 'wikimedia', score: 1 })]
  const fetched = [cc({ url: 'https://a', source: 'geograph', score: 9 }), cc({ url: 'https://b', source: 'geograph', score: 5 })]
  const out = combineImages(existing, fetched)
  assert.equal(out.length, 2)
  // existing 'https://a' is kept (not replaced by the fetched duplicate)
  assert.equal(out.find((i) => i.url === 'https://a')?.source, 'wikimedia')
  assert.ok(out.find((i) => i.url === 'https://b'))
})
