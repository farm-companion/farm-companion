import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyVenue, hasRetailLexeme, type VenueEvidence } from './classify-venue'

const ev = (o: Partial<VenueEvidence> = {}): VenueEvidence => ({
  osmShopFarm: false, osmOpeningHours: false, fsaFarmType: false,
  retailLexeme: false, websiteRetailSignal: false, placesRetailWithHours: false,
  ...o,
})

test('Tier A needs a retail tag plus evidence of public opening', () => {
  assert.deepEqual(classifyVenue(ev({ osmShopFarm: true, osmOpeningHours: true })),
    { tier: 'A', venueType: 'shop' })
  assert.deepEqual(classifyVenue(ev({ osmShopFarm: true, placesRetailWithHours: true })),
    { tier: 'A', venueType: 'shop' })
})

test('Tier B is a review candidate, never an admitted type', () => {
  assert.deepEqual(classifyVenue(ev({ osmShopFarm: true })),
    { tier: 'B', venueType: 'unknown' })
  assert.deepEqual(classifyVenue(ev({ retailLexeme: true, websiteRetailSignal: true })),
    { tier: 'B', venueType: 'unknown' })
})

test('a retail lexeme alone is not enough for Tier B', () => {
  assert.equal(classifyVenue(ev({ retailLexeme: true })).tier, 'C')
})

// --- THE INVARIANT. This test is the trust rule made executable. ---
test('INVARIANT: FSA evidence alone never admits a listing', () => {
  const combos: VenueEvidence[] = [
    ev({ fsaFarmType: true }),
    ev({ fsaFarmType: true, retailLexeme: true }),
  ]
  for (const e of combos) {
    const r = classifyVenue(e)
    assert.equal(r.venueType, 'unknown', `FSA-only combo admitted: ${JSON.stringify(e)}`)
    assert.equal(r.tier, 'C')
  }
})

test('INVARIANT holds across every evidence combination without OSM or Places', () => {
  for (const fsaFarmType of [true, false]) {
    for (const retailLexeme of [true, false]) {
      for (const websiteRetailSignal of [true, false]) {
        const r = classifyVenue(ev({ fsaFarmType, retailLexeme, websiteRetailSignal }))
        assert.equal(
          r.venueType, 'unknown',
          `admitted without OSM/Places: ${JSON.stringify({ fsaFarmType, retailLexeme, websiteRetailSignal })}`,
        )
      }
    }
  }
})

test('retail lexeme detection is case-insensitive and word-bounded', () => {
  assert.equal(hasRetailLexeme('Berry Hill Farm Shop'), true)
  assert.equal(hasRetailLexeme("Lathy's Farmshop"), true)
  assert.equal(hasRetailLexeme('Longridge Farm Produce'), true)
  assert.equal(hasRetailLexeme('Mr D & Mrs H Harries'), false)
  assert.equal(hasRetailLexeme('Ardenlodge Poultry'), false)
  assert.equal(hasRetailLexeme('Ben Heath'), false)
  assert.equal(hasRetailLexeme(undefined), false)
})
