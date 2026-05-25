// Unit tests for the per-farm Pitti URL resolver.
// Run via: pnpm test:unit
//
// Illustrations live on Hetzner blob (generate-pitti-batch.ts); the resolver
// returns that URL for any slug and consumers fall back gracefully on 404.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { pittiFarmImageUrl } from './pitti-farms'

const HETZNER = 'https://farm-companion-blob-prod.hel1.your-objectstorage.com/pitti-farm-images'

test('pittiFarmImageUrl returns the Hetzner blob URL for a slug', () => {
  assert.equal(pittiFarmImageUrl('cumbria-farmers'), `${HETZNER}/cumbria-farmers/main.webp`)
})

test('pittiFarmImageUrl URL-encodes slug characters that need it', () => {
  assert.equal(pittiFarmImageUrl('farm with space'), `${HETZNER}/farm%20with%20space/main.webp`)
})

test('pittiFarmImageUrl points at the whitelisted Hetzner host', () => {
  const url = pittiFarmImageUrl('any-slug')
  assert.ok(url.startsWith('https://farm-companion-blob-prod.hel1.your-objectstorage.com/'))
  assert.ok(url.endsWith('/any-slug/main.webp'))
})
