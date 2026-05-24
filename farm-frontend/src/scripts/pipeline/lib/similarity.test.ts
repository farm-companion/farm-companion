import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nameSimilarity } from './similarity'

test('identical names score 1', () => {
  assert.equal(nameSimilarity('Riverford Farm Shop', 'Riverford Farm Shop'), 1)
})

test('similarity is case- and whitespace-insensitive', () => {
  assert.equal(nameSimilarity('  Riverford   FARM shop ', 'riverford farm shop'), 1)
})

test('near-duplicate clears the 0.85 gate', () => {
  assert.ok(nameSimilarity('Riverford Farm Shop', 'Riverford Farmshop') >= 0.85)
})

test('different farms fall below 0.85', () => {
  assert.ok(nameSimilarity('Riverford Farm Shop', 'Daylesford Organic') < 0.85)
})

test('empty inputs score 0', () => {
  assert.equal(nameSimilarity('', 'anything'), 0)
  assert.equal(nameSimilarity('anything', ''), 0)
})
