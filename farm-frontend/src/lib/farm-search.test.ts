import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchesQuery, type SearchableFarm } from './farm-search'

// /map?q=<anything> threw "Cannot read properties of null (reading
// 'toLowerCase')" for every visitor. The filter read four fields as strings;
// the live /api/farms?limit=2000 returns 287 null address, 457 null county and
// 316 null postcode out of 2,000 rows, so the first null reached ended the
// render. The nulls are deliberate: commit 9497627 made address, postcode and
// county optional in the pipeline because "FSA data legitimately has sparse
// rows" (1,381 creates lacked an address). The data was right and the type
// was wrong.

const farm = (o: Partial<SearchableFarm> = {}): SearchableFarm => ({
  name: 'Morfa Farm Shop',
  location: { address: null, county: null, postcode: null },
  ...o,
})

test('a farm with no address, county or postcode does not end the render', () => {
  // The crash, stated as a test. Every field the filter reads is null.
  //
  // The query must NOT match the name: `||` short-circuits, so asserting on
  // "morfa" here passes against the broken code without ever reaching a null.
  // That is the same vacuous-test trap this branch has hit before.
  assert.doesNotThrow(() => matchesQuery(farm(), 'pembrey'))
  assert.equal(matchesQuery(farm(), 'pembrey'), false)
  // And it still matches its own name.
  assert.equal(matchesQuery(farm(), 'morfa'), true)
})

test('a sparse farm still fails a query it does not match', () => {
  assert.equal(matchesQuery(farm(), 'penzance'), false)
})

test('each field is searchable when it is present', () => {
  const full = farm({
    location: { address: 'Pembrey', county: 'Carmarthenshire', postcode: 'SA16 0JD' },
    offerings: ['Raw milk'],
  })
  assert.equal(matchesQuery(full, 'pembrey'), true, 'address')
  assert.equal(matchesQuery(full, 'carmarthen'), true, 'county')
  assert.equal(matchesQuery(full, 'sa16'), true, 'postcode')
  assert.equal(matchesQuery(full, 'raw milk'), true, 'offering')
  assert.equal(matchesQuery(full, 'morfa'), true, 'name')
})

test('a null offerings entry does not end the render either', () => {
  // offerings came through as string[], but it is built from a join and the
  // same reasoning applies: nothing here may assume a string.
  const f = farm({ offerings: [null as unknown as string, 'Eggs'] })
  assert.doesNotThrow(() => matchesQuery(f, 'eggs'))
  assert.equal(matchesQuery(f, 'eggs'), true)
})

test('matching ignores case and surrounding space', () => {
  const f = farm({ location: { address: 'Pembrey', county: null, postcode: null } })
  assert.equal(matchesQuery(f, '  PEMBREY  '), true)
})

test('an empty query matches everything, so the map is not emptied', () => {
  assert.equal(matchesQuery(farm(), ''), true)
  assert.equal(matchesQuery(farm(), '   '), true)
})
