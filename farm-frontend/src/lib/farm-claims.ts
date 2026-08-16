// Two gates, both pure.
//
// Claim gate: may this page tell a visitor they can go there? Only when a human
// has confirmed the venue is one you can buy from. Because venueType defaults to
// unknown across every existing row, shipping this silences every unverified
// page immediately.
//
// Index gate: layered above the claim gate. A page Google should rank has to say
// something, not merely exist.

const ADMITTED = new Set(['shop', 'pyo', 'market_stall'])

/** The LLM fallback sentence, which asserts a farm shop without evidence. */
const TEMPLATE_DESCRIPTION = /^(.+?) is a farm shop in (.+?)\.$/

/** The default offering tag carries no information; 99.3% of rows have it. */
const DEFAULT_OFFERING = 'Farm Shops'

export interface ClaimInput {
  venueType: string | null
  venueVerifiedAt: Date | string | null
  openingHours: unknown
  phone: string | null
  website: string | null
  description: string | null
  offerings: string[]
  hasRealImage: boolean
}

/** True when the page may state the visitor can go there and buy something. */
export function canClaimVisitable(f: ClaimInput): boolean {
  if (!f.venueType || !ADMITTED.has(f.venueType)) return false
  return f.venueVerifiedAt != null
}

function hasParsedHours(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0
}

/** Count of substantive fields, over a closed list. Nothing else qualifies. */
function substanceCount(f: ClaimInput): number {
  let n = 0
  if (f.phone) n++
  if (f.website) n++
  const description = f.description?.trim() ?? ''
  if (description && !TEMPLATE_DESCRIPTION.test(description)) n++
  if (f.offerings.some((o) => o !== DEFAULT_OFFERING)) n++
  if (f.hasRealImage) n++
  return n
}

/** True when the page carries enough to deserve a place in the index. */
export function isIndexable(f: ClaimInput): boolean {
  if (!canClaimVisitable(f)) return false
  if (hasParsedHours(f.openingHours)) return true
  return substanceCount(f) >= 2
}
