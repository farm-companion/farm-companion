import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summariseByCounty } from './county-summary'
import type { FarmShop } from '@/types/farm'

/** Only the fields the summary reads; the rest of FarmShop is irrelevant here. */
function farm(name: string, county: string | null): FarmShop {
  return {
    id: name, name, slug: name.toLowerCase().replace(/\s+/g, '-'),
    location: { lat: 0, lng: 0, address: null, county, postcode: null },
  } as FarmShop
}

test('counts farms per county and sorts by name', () => {
  const { counties } = summariseByCounty([
    farm('B', 'Devon'), farm('A', 'Cornwall'), farm('C', 'Devon'),
  ])
  assert.deepEqual(counties, [
    { county: 'Cornwall', slug: 'cornwall', count: 1 },
    { county: 'Devon', slug: 'devon', count: 2 },
  ])
})

/**
 * `/counties/unknown-county` 404s, so a farm with no county must not produce a
 * link. The counties page already drops these; this keeps the two in step.
 */
test('gives no row to a farm with no usable county, but still counts it', () => {
  const { counties, withoutCounty } = summariseByCounty([
    farm('A', null), farm('B', ''), farm('C', '   '), farm('D', 'Kent'),
  ])
  assert.deepEqual(counties, [{ county: 'Kent', slug: 'kent', count: 1 }])
  assert.equal(withoutCounty, 3)
})

/**
 * The invariant that matters. Live data: 2,985 farms carry a county and 519
 * do not, against a stat line on the page that says 3,504. Without this, the
 * index silently indexed 85% of the directory while claiming all of it.
 */
test('every farm is accounted for, in a county row or in withoutCounty', () => {
  const farms = [
    farm('A', 'Devon'), farm('B', null), farm('C', 'Devon'),
    farm('D', '  '), farm('E', 'Kent'), farm('F', null),
  ]
  const { counties, withoutCounty } = summariseByCounty(farms)
  const inRows = counties.reduce((n, c) => n + c.count, 0)
  assert.equal(inRows + withoutCounty, farms.length)
  assert.equal(withoutCounty, 3)
})

/**
 * The slug must come from slugifyCounty, not a local rule. Five counties carry
 * punctuation and 404'd when a call site grew its own whitespace-only rule.
 *
 * The expected values below are what the live route serves, checked rather
 * than guessed: /counties/king-s-lynn-and-west-norfolk returns 200 and
 * /counties/kings-lynn-and-west-norfolk returns 404. An apostrophe is a
 * non-alphanumeric like any other, so it becomes its own dash. Writing the
 * prettier `kings-` here would have been the exact bug this test exists to
 * catch.
 */
test('punctuated county names get the shared slug', () => {
  const summary = summariseByCounty([
    farm('A', 'Newry, Mourne and Down'),
    farm('B', "King's Lynn and West Norfolk"),
    farm('C', 'Comhairle nan Eilean Siar (Western Isles)'),
  ])
  assert.deepEqual(summary.counties.map((c) => c.slug), [
    'comhairle-nan-eilean-siar-western-isles',
    'king-s-lynn-and-west-norfolk',
    'newry-mourne-and-down',
  ])
})

test('trims surrounding whitespace so one county is not counted twice', () => {
  const { counties } = summariseByCounty([farm('A', 'Devon'), farm('B', ' Devon ')])
  assert.deepEqual(counties, [{ county: 'Devon', slug: 'devon', count: 2 }])
})

test('empty input gives an empty summary', () => {
  assert.deepEqual(summariseByCounty([]), { counties: [], withoutCounty: 0 })
})
