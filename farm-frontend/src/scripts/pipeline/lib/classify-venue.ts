// Decide what a listing physically is, from typed evidence rather than from
// whichever source happened to arrive last.
//
// The governing invariant, refined 2026-10-31: no path to an admitted venueType
// may consist solely of the FSA PRODUCER category. businessTypeId 7838
// "Farmers/growers" proves the business grows things and says nothing about
// whether the public can visit; the FSA even files commercial fishing vessels
// under it. That has not changed and E3 still never admits.
//
// What changed is that the FSA also publishes PUBLIC-FACING categories, and
// those are a different claim about the same business. "Retailers - other" or
// "Restaurant/Cafe/Canteen", with an inspection date, says an inspector visited
// a premises that serves the public and found it trading. Measured nationally:
// 16 establishments named "farm shop" sit under 7838 against 1,143 under the
// public-facing categories.
//
// E8 therefore admits, but never alone: it must agree with the business's own
// name (E4). Two independent signals, a regulator's classification and what the
// business calls itself, because this entire area of work exists because ONE
// mis-filed category was treated as proof.
//
// Tiers are discrete rather than weighted because weights are unfalsifiable and
// tiers are testable.
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
  /**
   * E8: the FSA registers this premises in a public-facing retail or catering
   * category AND inspected it recently. Distinct from E3, which is the producer
   * category. Admits only together with E4.
   */
  fsaRetailRecent: boolean
}

/**
 * FSA business types that describe premises serving the public, as opposed to
 * 7838 "Farmers/growers" and 7839 "Manufacturers/packers", which describe
 * production. Canonical here because it is classification policy, and imported
 * by the FSA source rather than duplicated.
 */
export const FSA_PUBLIC_RETAIL_TYPES: ReadonlySet<string> = new Set([
  'Retailers - other',
  'Retailers - supermarkets/hypermarkets',
  'Restaurant/Cafe/Canteen',
  'Takeaway/sandwich shop',
  'Other catering premises',
])

/**
 * How recent an inspection has to be to count as evidence the premises is still
 * trading. FSA inspection intervals run from 6 months for the highest-risk
 * category to 3 years for the lowest, so two years means at least one interval
 * has passed for most premises without a revisit. A 2017 date, which the
 * register does contain, is not evidence about today.
 */
export const FSA_RECENT_INSPECTION_MONTHS = 24

/** True when an FSA record is a public-facing premises inspected recently. */
export function isFsaRetailRecent(
  businessType: string | undefined,
  ratingDate: string | undefined,
  now: Date = new Date(),
): boolean {
  if (!businessType || !FSA_PUBLIC_RETAIL_TYPES.has(businessType)) return false
  if (!ratingDate) return false
  const inspected = new Date(ratingDate)
  if (Number.isNaN(inspected.getTime())) return false
  // A future date is bad data, not fresh evidence.
  if (inspected.getTime() > now.getTime()) return false
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - FSA_RECENT_INSPECTION_MONTHS)
  return inspected.getTime() >= cutoff.getTime()
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
  // E8 + E4. A regulator says public-facing premises, inspected recently; the
  // business's own name says retail. Neither admits alone.
  if (e.fsaRetailRecent && e.retailLexeme) {
    return { tier: 'A', venueType: 'shop' }
  }
  if (
    e.osmShopFarm ||
    e.fsaRetailRecent ||
    (e.retailLexeme && (e.websiteRetailSignal || e.placesRetailWithHours))
  ) {
    return { tier: 'B', venueType: 'unknown' }
  }
  return { tier: 'C', venueType: 'unknown' }
}
