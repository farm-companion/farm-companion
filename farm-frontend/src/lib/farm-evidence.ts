// Admission by evidence, and only ever admission.
//
// The directory holds 3,504 rows because three ingestions each asked a
// question that was not "is this a farm": Google Places asked for anything of
// type=food matching "farm shop" within 50km of 57 points, the FSA register
// asked for self-declared BusinessTypeID 7838, and OSM asked for tags. APNA
// Local, a convenience shop on Gunnersbury Lane in Acton, satisfies the first
// two. See docs/assistant/directory-admission-audit.md.
//
// Every removal rule tested on 2026-11-02 failed in at least one direction:
//
//   farmland within 250m   rejected three Scottish crofts, which are farms
//   farmland within 1km    admitted APNA Local (11 features: Acton has parks)
//   Companies House SIC    matched 5.8% of rows; Forest Farm Shop and Model
//                          Farm Shop Ltd register retail codes, correctly,
//                          because a shop is retail
//   first-party text       scored Barleylands, a real Essex farm, at -1
//
// So this module never removes. A row with no evidence keeps exactly the
// behaviour it has today, including the honest "we have not confirmed whether
// it is open to visitors" sentence its page already shows. The verified set
// grows upward from zero instead of the directory shrinking by guesswork.

/**
 * Machine signals. Each must come from a genuinely different observation of
 * the world, because the rule's only defence against a false positive is that
 * two unrelated sources agree.
 */
export const INDEPENDENT_KINDS = [
  'osm-landuse',
  'companies-house-sic',
  'first-party-text',
  'fsa-inspection',
] as const

export type EvidenceKind = (typeof INDEPENDENT_KINDS)[number] | 'human-confirmed'

export interface Evidence {
  kind: EvidenceKind
  /** The specific thing observed: an OSM way id, a company number, a URL. */
  source: string
  observedAt: Date
  /** A person's name or a script identifier. Who is answerable for this. */
  observedBy: string
}

/**
 * How long an observation counts for. Two years matches the FSA inspection
 * window already used by the venue work, and means a farm seen once in 2019
 * is not treated as evidenced today.
 */
export const FRESHNESS_DAYS = 730

function isFresh(e: Evidence, now: Date): boolean {
  const age = (now.getTime() - e.observedAt.getTime()) / 86_400_000
  return age >= 0 && age <= FRESHNESS_DAYS
}

/**
 * Whether the evidence supports calling this row a farm.
 *
 * Two independent machine signals, or one human who confirmed it. A human
 * admits alone because a human is the only kind of evidence where someone has
 * put their name to the claim; that is exactly what Cornwall never got, where
 * all 63 rows carry machine proposals and an empty `verified_by` column.
 *
 * This answers "is this a farm". It does NOT answer "is this open to
 * visitors", which is a different claim governed by canClaimVisitable in
 * farm-claims.ts. Do not wire this into that gate.
 */
export function admitsAsFarm(evidence: readonly Evidence[], now: Date = new Date()): boolean {
  const fresh = evidence.filter((e) => isFresh(e, now))
  if (fresh.some((e) => e.kind === 'human-confirmed')) return true
  // A set, so several OSM polygons from one query stay one observation.
  const kinds = new Set(fresh.filter((e) => e.kind !== 'human-confirmed').map((e) => e.kind))
  return kinds.size >= 2
}

/** Which signals a row holds, for reporting and for the admin view. */
export function evidenceSummary(
  evidence: readonly Evidence[],
  now: Date = new Date(),
): { kinds: EvidenceKind[]; admitted: boolean; stale: number } {
  const fresh = evidence.filter((e) => isFresh(e, now))
  return {
    kinds: [...new Set(fresh.map((e) => e.kind))].sort(),
    admitted: admitsAsFarm(evidence, now),
    stale: evidence.length - fresh.length,
  }
}
