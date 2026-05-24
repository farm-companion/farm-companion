import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dedupeBySourceId } from './01-discover'
import type { RawFarmCandidate } from '../types'

const c = (source: 'osm' | 'fsa', sourceId: string): RawFarmCandidate => ({ source, sourceId, raw: {} })

test('collapses exact duplicate source+sourceId, first wins', () => {
  const out = dedupeBySourceId([c('osm', 'node:1'), c('osm', 'node:1'), c('osm', 'node:2')])
  assert.equal(out.length, 2)
  assert.deepEqual(out.map((x) => x.sourceId), ['node:1', 'node:2'])
})

test('same sourceId across different sources is NOT collapsed', () => {
  const out = dedupeBySourceId([c('osm', '12345'), c('fsa', '12345')])
  assert.equal(out.length, 2)
})
