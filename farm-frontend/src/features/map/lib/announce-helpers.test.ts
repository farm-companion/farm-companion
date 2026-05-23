// Pure helpers for map screen-reader announcements. Run via: pnpm test:unit

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildSelectionAnnouncement } from './announce-helpers'

test('buildSelectionAnnouncement includes name and county when both present', () => {
  assert.equal(
    buildSelectionAnnouncement({ name: 'Daylesford Organic', location: { county: 'Gloucestershire' } }),
    'Selected: Daylesford Organic in Gloucestershire'
  )
})

test('buildSelectionAnnouncement omits county when empty', () => {
  assert.equal(
    buildSelectionAnnouncement({ name: 'Daylesford Organic', location: { county: '' } }),
    'Selected: Daylesford Organic'
  )
})

test('buildSelectionAnnouncement omits county when whitespace only', () => {
  assert.equal(
    buildSelectionAnnouncement({ name: 'Daylesford Organic', location: { county: '   ' } }),
    'Selected: Daylesford Organic'
  )
})

test('buildSelectionAnnouncement trims surrounding whitespace from county', () => {
  assert.equal(
    buildSelectionAnnouncement({ name: 'Riverford', location: { county: '  Devon  ' } }),
    'Selected: Riverford in Devon'
  )
})
