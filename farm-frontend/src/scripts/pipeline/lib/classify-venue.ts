// Decide what a listing physically is, from typed evidence rather than from
// whichever source happened to arrive last.
//
// The governing invariant: no path to an admitted venueType may consist solely
// of FSA evidence. FSA businessTypeId 7838 is "Farmers/growers", a producer
// classification, so it proves the business grows things and says nothing about
// whether the public can visit. Tiers are discrete rather than weighted because
// weights are unfalsifiable and tiers are testable.
import type { VenueType } from '../types'

export interface VenueEvidence {
  /** E1: OSM shop=farm. Retail tag. */
  osmShopFarm: boolean
  /** E2: OSM opening_hours present. Public access with stated times. */
  osmOpeningHours: boolean
  /** E3: FSA businessTypeId 7838. Production only. Never admits on its own. */
  fsaFarmType: boolean
  /** E4: name contains a retail lexeme. Weak. */
  retailLexeme: boolean
  /** E5: website mentions visiting, opening times, or a shop. Medium. */
  websiteRetailSignal: boolean
  /** E6: Places retail type AND regular_opening_hours. Strong. */
  placesRetailWithHours: boolean
}

export interface VenueTier {
  /** A: auto-classify. B: review candidate. C: no venue evidence. */
  tier: 'A' | 'B' | 'C'
  venueType: VenueType
}

// Fixed and case-insensitive. Changing this set changes the measured 34.8%
// match rate against live data and requires re-measuring.
const RETAIL_LEXEMES: readonly string[] = [
  'shop', 'farmshop', 'store', 'stores', 'market', 'deli', 'butcher', 'dairy',
  'bakery', 'creamery', 'cafe', 'kitchen', 'pantry', 'larder', 'produce',
  'nursery', 'garden',
]

const LEXEME_RE = new RegExp(`\\b(${RETAIL_LEXEMES.join('|')})\\b`, 'i')

/** True when a business name contains a whole-word retail lexeme. */
export function hasRetailLexeme(name: string | undefined): boolean {
  return name ? LEXEME_RE.test(name) : false
}

/**
 * Classify from evidence.
 *
 * Only Tier A yields an admitted venueType, and even then a human must set
 * venueVerifiedAt before any page may make a visitability claim. Tier B exists
 * solely to order the human review backlog; it never writes an admitted type.
 */
export function classifyVenue(e: VenueEvidence): VenueTier {
  if (e.osmShopFarm && (e.osmOpeningHours || e.placesRetailWithHours)) {
    return { tier: 'A', venueType: 'shop' }
  }
  if (e.osmShopFarm || (e.retailLexeme && (e.websiteRetailSignal || e.placesRetailWithHours))) {
    return { tier: 'B', venueType: 'unknown' }
  }
  return { tier: 'C', venueType: 'unknown' }
}
