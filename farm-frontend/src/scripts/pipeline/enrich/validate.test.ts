import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateDescription,
  buildFallback,
  INVENTION_MARKERS,
  type FactSheet,
  type GroundingContext,
} from './validate'

function factSheet(partial: Partial<FactSheet> = {}): FactSheet {
  return { name: 'Riverford Farm Shop', categories: ['farm-shops'], ...partial }
}

function ground(corpusText = '', fs: Partial<FactSheet> = {}): GroundingContext {
  return { corpusText, factSheet: factSheet(fs) }
}

function failCode(candidate: string, g: GroundingContext): string | true {
  const r = validateDescription(candidate, g)
  return r.ok ? true : r.code
}

// --- Invention markers (rejected even if in corpus) ---
test('rejects "family-run" even when the corpus contains it', () => {
  const g = ground('we are a proud family-run farm shop in devon')
  assert.equal(failCode('Riverford Farm Shop is a family-run farm shop in Devon.', g), 'invention_marker')
})

test('rejects "established" / heritage language', () => {
  const g = ground('riverford farm shop devon', { county: 'Devon' })
  assert.equal(failCode('Riverford Farm Shop, established with traditional values in Devon.', g), 'invention_marker')
})

test('rejects an award claim', () => {
  const g = ground('riverford farm shop devon', { county: 'Devon' })
  assert.equal(failCode('Riverford Farm Shop is an award-winning shop in Devon.', g), 'invention_marker')
})

test('rejects a year not present in the corpus', () => {
  const g = ground('riverford farm shop in devon', { county: 'Devon' })
  assert.equal(failCode('Riverford Farm Shop in Devon dates to 2018.', g), 'invention_marker')
})

test('accepts a year present verbatim in the corpus', () => {
  const g = ground('riverford farm shop in devon opened 2018 selling vegetables', { county: 'Devon', categories: ['farm-shops', 'vegetables'] })
  assert.equal(failCode('Riverford Farm Shop in Devon, selling vegetables, opened 2018.', g), true)
})

// --- Facility / product grounding ---
test('rejects a facility noun absent from corpus and categories', () => {
  const g = ground('riverford farm shop in devon', { county: 'Devon' })
  assert.equal(failCode('Riverford Farm Shop in Devon has a cafe.', g), 'ungrounded_facility')
})

test('accepts a facility noun present in corpus', () => {
  const g = ground('riverford farm shop in devon with an on-site cafe serving lunch', { county: 'Devon' })
  assert.equal(failCode('Riverford Farm Shop in Devon has a cafe.', g), true)
})

test('accepts a product grounded by a category slug', () => {
  const g = ground('', { county: 'Devon', categories: ['farm-shops', 'dairy'] })
  assert.equal(failCode('Riverford Farm Shop in Devon sells dairy.', g), true)
})

// --- Place grounding ---
test('rejects a place name not in the fact sheet or corpus', () => {
  const g = ground('riverford farm shop', { county: 'Devon' })
  assert.equal(failCode('Riverford Farm Shop in Cornwall sells produce.', g), 'ungrounded_place')
})

test('accepts the county from the fact sheet', () => {
  const g = ground('', { county: 'Devon' })
  assert.equal(failCode('Riverford Farm Shop is a farm shop in Devon.', g), true)
})

// --- General claim grounding ---
test('rejects an ungrounded descriptive claim', () => {
  const g = ground('', { county: 'Devon' })
  assert.equal(failCode('Riverford Farm Shop in Devon offers homemade chutney workshops.', g), 'ungrounded_claim')
})

// --- Shape guards ---
test('rejects an empty candidate', () => {
  assert.equal(failCode('   ', ground('', { county: 'Devon' })), 'empty')
})

test('rejects markup / links', () => {
  const g = ground('riverford farm shop devon', { county: 'Devon' })
  assert.equal(failCode('Riverford Farm Shop in Devon. Visit https://riverford.co.uk', g), 'markup')
})

test('rejects a candidate that is just the farm name', () => {
  assert.equal(failCode('Riverford Farm Shop', ground('', { county: 'Devon' })), 'name_only')
})

test('rejects an over-long candidate for thin facts', () => {
  const g = ground('', { county: 'Devon' })
  const longText = 'Riverford Farm Shop in Devon sells produce. ' + 'It is a shop in Devon. '.repeat(40)
  assert.equal(failCode(longText, g), 'too_long')
})

// --- Fallback always validates ---
test('buildFallback produces a string that passes validation', () => {
  const fs = factSheet({ county: 'Devon', categories: ['farm-shops', 'dairy'] })
  const fb = buildFallback(fs)
  assert.equal(validateDescription(fb, { corpusText: '', factSheet: fs }).ok, true)
})

test('buildFallback works with only a name (no location)', () => {
  const fs = factSheet({ name: 'Connal Ritchie', categories: ['farm-shops'] })
  const fb = buildFallback(fs)
  assert.ok(fb.length > 0)
  assert.equal(validateDescription(fb, { corpusText: '', factSheet: fs }).ok, true)
})

test('INVENTION_MARKERS is non-empty and all entries are RegExp', () => {
  assert.ok(INVENTION_MARKERS.length > 0)
  for (const m of INVENTION_MARKERS) assert.ok(m instanceof RegExp)
})
