import { test } from 'node:test'
import assert from 'node:assert/strict'
import { admitsAsFarm, type Evidence, INDEPENDENT_KINDS } from './farm-evidence'

const ev = (kind: Evidence['kind'], source = 'test'): Evidence => ({
  kind, source, observedAt: new Date('2026-11-02'), observedBy: 'test',
})

/**
 * The rule only ever admits. Nothing here removes a row, because every
 * removal signal tested on 2026-11-02 failed in at least one direction:
 *
 *  - farmland within 250m rejected three Scottish crofts, which are farms
 *  - farmland within 1km admitted APNA Local, a convenience shop in Acton
 *  - Companies House matched only 5.8% of rows, and real farm shops such as
 *    Forest Farm Shop register retail SIC codes because a shop is retail
 *  - first-party text scored Barleylands, a real Essex farm, at -1
 *
 * See docs/assistant/directory-admission-audit.md.
 */

test('no evidence admits nothing, and that is not a removal', () => {
  assert.equal(admitsAsFarm([]), false)
})

test('one signal is never enough, however strong', () => {
  for (const kind of INDEPENDENT_KINDS) {
    assert.equal(admitsAsFarm([ev(kind)]), false, `${kind} admitted on its own`)
  }
})

test('two independent signals admit', () => {
  assert.equal(admitsAsFarm([ev('osm-landuse'), ev('companies-house-sic')]), true)
  assert.equal(admitsAsFarm([ev('first-party-text'), ev('fsa-inspection')]), true)
})

/**
 * Two rows from the same source are one observation, not two. Without this,
 * a single OSM query returning several polygons would admit a corner shop.
 */
test('the same kind twice is still one signal', () => {
  assert.equal(admitsAsFarm([ev('osm-landuse', 'way/1'), ev('osm-landuse', 'way/2')]), false)
})

/**
 * A person who phoned and confirmed outranks any number of machine signals.
 * This is the only kind that admits alone, because it is the only kind where
 * someone has put their name to the claim.
 */
test('a human confirmation admits on its own', () => {
  assert.equal(admitsAsFarm([ev('human-confirmed')]), true)
})

test('human confirmation is excluded from the machine-signal list', () => {
  assert.ok(!INDEPENDENT_KINDS.includes('human-confirmed' as never))
})

/**
 * Evidence does not expire silently. A farm verified in 2019 and not seen
 * since is not currently evidenced; saying otherwise is how the directory got
 * into this state.
 */
test('evidence older than the freshness window does not count', () => {
  const stale = { ...ev('osm-landuse'), observedAt: new Date('2019-01-01') }
  const fresh = ev('companies-house-sic')
  assert.equal(admitsAsFarm([stale, fresh], new Date('2026-11-02')), false)
})

test('a human confirmation also goes stale', () => {
  const stale = { ...ev('human-confirmed'), observedAt: new Date('2019-01-01') }
  assert.equal(admitsAsFarm([stale], new Date('2026-11-02')), false)
})

/**
 * Being a farm and being open to visitors are different claims. This rule
 * answers only the first. canClaimVisitable in farm-claims.ts still governs
 * whether a page may say "farm shop", and this must never be wired into it.
 */
test('admission is about being a farm, not about being visitable', () => {
  const admitted = admitsAsFarm([ev('osm-landuse'), ev('companies-house-sic')])
  assert.equal(admitted, true)
  // A reminder in test form: nothing here returns a venueType.
  assert.equal(typeof admitted, 'boolean')
})
