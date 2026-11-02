// Two gates, both pure, and deliberately independent of one another.
//
// Claim gate: may this page tell a visitor they can go there? Only when a
// human, or an evidence edge standing in for one, has confirmed the venue is
// one you can buy from. Because venueType defaults to unknown across every
// existing row, shipping this silences every unverified page immediately.
//
// Index gate: is this a directory entry a reader could actually use? It asks
// one thing only, whether the page can say where the business is.
//
// The index gate used to begin `if (!canClaimVisitable(f)) return false`, so an
// unverified page was not merely silenced but withdrawn from Google. Measured
// against Search Console on 1 Nov 2026 that would have cost 373 of the site's
// 431 clicks: 210 of the 211 pages earning anything would have gone noindex,
// and none of those can be verified, since 151 of the 166 holding an FSA record
// are registered Farmers/growers, which never admits. Telling the truth about a
// page is not a reason to hide it, so the gates were separated. Google is left
// to judge thinness itself, which it is already doing at roughly 150 pages a
// week.

/**
 * Venue types that may make a visitability claim. Exported so the verification
 * importer validates against the same set the gate reads: a row given an
 * unadmitted type would get a venueVerifiedAt that canClaimVisitable still
 * refuses, which is a verification that silently does nothing.
 */
export const ADMITTED_VENUE_TYPES: ReadonlySet<string> = new Set(['shop', 'pyo', 'market_stall'])

/**
 * The two fields the claim gate actually reads. A list surface that holds only
 * a row can gate on this without assembling a full ClaimInput. Both are
 * optional so a FarmShop (where they are optional) satisfies it directly.
 */
export interface VenueVerification {
  venueType?: string | null
  venueVerifiedAt?: Date | string | null
}

/** Everything both gates read: the verification, plus where the business is. */
export interface ClaimInput extends VenueVerification {
  postcode: string | null
  address: string | null
  county: string | null
}

/**
 * The only sentence an unverified surface may say about visitability: the
 * business is on a food register, and public access is unconfirmed. Lives here
 * rather than in a page so every surface makes the identical statement.
 */
export function unverifiedDescription(county: string): string {
  return `A registered food producer in ${county || 'the UK'}. We have not confirmed whether it is open to visitors.`
}

/** True when the page may state the visitor can go there and buy something. */
export function canClaimVisitable(f: VenueVerification): boolean {
  if (!f.venueType || !ADMITTED_VENUE_TYPES.has(f.venueType)) return false
  return f.venueVerifiedAt != null
}

// Outward code, inward district. Deliberately strict: 254 active rows store the
// literal string "UK" in the postcode column and 9 more hold other junk, all of
// which would otherwise read as a location.
const UK_POSTCODE = /^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/

function present(v: string | null | undefined): boolean {
  return (v ?? '').trim().length > 0
}

/** True when the page can tell a reader where to go and look for the business. */
function hasFindablePlace(f: ClaimInput): boolean {
  const postcode = (f.postcode ?? '').trim().toUpperCase().replace(/\s+/g, ' ')
  // A space is optional in the stored value but required by the pattern, so
  // insert one before the inward code when it is missing.
  const spaced = postcode.includes(' ') ? postcode : postcode.replace(/(.{3})$/, ' $1')
  if (UK_POSTCODE.test(spaced)) return true
  return present(f.address) && present(f.county)
}

/** True when the page is a directory entry worth offering to a search engine. */
export function isIndexable(f: ClaimInput): boolean {
  return hasFindablePlace(f)
}
