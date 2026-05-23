// Pure-string assertions for map ARIA announcement vocabulary.
// Run via: pnpm test:unit

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { ANNOUNCEMENTS, getClusterMarkerLabel } from './accessibility'

test('ANNOUNCEMENTS.clusterExpanded uses singular for one farm', () => {
  assert.equal(ANNOUNCEMENTS.clusterExpanded(1), 'Showing 1 farm in this area.')
})

test('ANNOUNCEMENTS.clusterExpanded uses plural for multiple farms', () => {
  assert.equal(ANNOUNCEMENTS.clusterExpanded(8), 'Showing 8 farms in this area.')
})

test('ANNOUNCEMENTS.clusterExpanded treats zero as plural', () => {
  assert.equal(ANNOUNCEMENTS.clusterExpanded(0), 'Showing 0 farms in this area.')
})

test('getClusterMarkerLabel pluralizes consistently with clusterExpanded', () => {
  assert.equal(getClusterMarkerLabel(1), 'Cluster of 1 farm. Press Enter to expand.')
  assert.equal(getClusterMarkerLabel(3), 'Cluster of 3 farms. Press Enter to expand.')
})

test('ANNOUNCEMENTS.markerSelected includes county when present', () => {
  assert.equal(
    ANNOUNCEMENTS.markerSelected('Daylesford Organic', 'Gloucestershire'),
    'Selected: Daylesford Organic in Gloucestershire'
  )
})

test('ANNOUNCEMENTS.markerSelected omits county when empty or missing', () => {
  assert.equal(ANNOUNCEMENTS.markerSelected('Daylesford Organic', ''), 'Selected: Daylesford Organic')
  assert.equal(ANNOUNCEMENTS.markerSelected('Daylesford Organic'), 'Selected: Daylesford Organic')
})

test('ANNOUNCEMENTS.markerSelected omits county when whitespace only', () => {
  assert.equal(ANNOUNCEMENTS.markerSelected('Daylesford Organic', '   '), 'Selected: Daylesford Organic')
})

test('ANNOUNCEMENTS.markerSelected trims surrounding whitespace from county', () => {
  assert.equal(ANNOUNCEMENTS.markerSelected('Riverford', '  Devon  '), 'Selected: Riverford in Devon')
})
