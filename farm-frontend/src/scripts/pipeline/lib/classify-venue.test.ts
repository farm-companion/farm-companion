import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyVenue,
  hasRetailLexeme,
  isFsaRetailRecent,
  FSA_RECENT_INSPECTION_MONTHS,
  type VenueEvidence,
} from './classify-venue'

const ev = (o: Partial<VenueEvidence> = {}): VenueEvidence => ({
  osmShopFarm: false, osmOpeningHours: false, fsaFarmType: false,
  retailLexeme: false, websiteRetailSignal: false, placesRetailWithHours: false,
  fsaRetailRecent: false,
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

test('INVARIANT: every admission rests on OSM hours or on FSA-retail plus the name', () => {
  // Refined 2026-10-31 when E8 was added. The rule is not "no admission from
  // FSA": it is that the PRODUCER category never admits, and that the
  // public-facing category never admits alone either. Every admitted
  // combination must satisfy one of exactly two paths.
  let iterations = 0
  let admitted = 0
  for (const osmShopFarm of [true, false]) {
    for (const osmOpeningHours of [true, false]) {
      for (const fsaFarmType of [true, false]) {
        for (const retailLexeme of [true, false]) {
          for (const websiteRetailSignal of [true, false]) {
            for (const placesRetailWithHours of [true, false]) {
              for (const fsaRetailRecent of [true, false]) {
                iterations++
                const e = { osmShopFarm, osmOpeningHours, fsaFarmType, retailLexeme, websiteRetailSignal, placesRetailWithHours, fsaRetailRecent }
                const r = classifyVenue(ev(e))
                if (r.venueType !== 'unknown') {
                  admitted++
                  assert(
                    (osmShopFarm && (osmOpeningHours || placesRetailWithHours)) ||
                      (fsaRetailRecent && retailLexeme),
                    `admission gated incorrectly: ${JSON.stringify(e)}`,
                  )
                }
              }
            }
          }
        }
      }
    }
  }
  assert.equal(iterations, 128, `expected 128 combinations, got ${iterations}`)
  assert.ok(admitted > 0, 'the sweep must actually exercise admission, or it proves nothing')
})

test('INVARIANT: the FSA producer category still never admits, alone or with the name', () => {
  // E3 is businessTypeId 7838 "Farmers/growers". The FSA files commercial
  // fishing vessels under it. Widening the source must not have widened this.
  for (const e of [
    ev({ fsaFarmType: true }),
    ev({ fsaFarmType: true, retailLexeme: true }),
    ev({ fsaFarmType: true, retailLexeme: true, websiteRetailSignal: true }),
  ]) {
    assert.equal(classifyVenue(e).venueType, 'unknown', JSON.stringify(e))
  }
})

test('E8 admits with the name, and never without it', () => {
  // A regulator calling it public-facing, plus the business calling itself a
  // shop. Two independent signals.
  const both = classifyVenue(ev({ fsaRetailRecent: true, retailLexeme: true }))
  assert.equal(both.tier, 'A')
  assert.equal(both.venueType, 'shop')

  // Either one alone is a review candidate, not an admission.
  const regulatorOnly = classifyVenue(ev({ fsaRetailRecent: true }))
  assert.equal(regulatorOnly.tier, 'B')
  assert.equal(regulatorOnly.venueType, 'unknown')

  const nameOnly = classifyVenue(ev({ retailLexeme: true }))
  assert.equal(nameOnly.venueType, 'unknown')
})

test('isFsaRetailRecent requires a public-facing category', () => {
  const recent = new Date('2026-06-01').toISOString()
  const now = new Date('2026-10-31')
  for (const t of ['Retailers - other', 'Restaurant/Cafe/Canteen', 'Takeaway/sandwich shop']) {
    assert.equal(isFsaRetailRecent(t, recent, now), true, t)
  }
  // The producer and production categories are exactly what E8 is not.
  for (const t of ['Farmers/growers', 'Manufacturers/packers', 'Distributors/Transporters']) {
    assert.equal(isFsaRetailRecent(t, recent, now), false, t)
  }
  assert.equal(isFsaRetailRecent(undefined, recent, now), false)
})

test('isFsaRetailRecent requires a recent, real, past inspection', () => {
  const now = new Date('2026-10-31')
  const T = 'Retailers - other'
  assert.equal(isFsaRetailRecent(T, '2026-10-01', now), true)
  // The register really does contain dates this old; they are not evidence
  // about today.
  assert.equal(isFsaRetailRecent(T, '2017-11-06', now), false)
  assert.equal(isFsaRetailRecent(T, undefined, now), false)
  assert.equal(isFsaRetailRecent(T, 'not a date', now), false)
  // A future date is bad data, not fresh evidence.
  assert.equal(isFsaRetailRecent(T, '2027-01-01', now), false)
  // The boundary, both sides.
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - FSA_RECENT_INSPECTION_MONTHS)
  assert.equal(isFsaRetailRecent(T, cutoff.toISOString(), now), true, 'exactly at the cutoff counts')
  const justBefore = new Date(cutoff.getTime() - 86400000)
  assert.equal(isFsaRetailRecent(T, justBefore.toISOString(), now), false, 'a day older does not')
})

test('the FSA full timestamp format the register actually returns parses', () => {
  // The live API returns "2025-07-07T00:00:00", not a bare date.
  assert.equal(isFsaRetailRecent('Retailers - other', '2025-07-07T00:00:00', new Date('2026-10-31')), true)
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
