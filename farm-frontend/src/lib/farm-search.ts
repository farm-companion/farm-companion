// The map's free-text search, extracted from the useMemo in map/page.tsx so
// it can be tested.
//
// It read four fields as strings and called .toLowerCase() on each. Three of
// them are nullable in the database, and /api/farms passes them through raw,
// so /map?q=<anything> threw on the first sparse row it reached and the page
// rendered nothing. The nulls are correct: commit 9497627 made address,
// postcode and county optional in the pipeline because "FSA data legitimately
// has sparse rows", 1,381 creates lacking an address. The type was the lie.

export interface SearchableFarm {
  name: string
  location: {
    address: string | null
    county: string | null
    postcode: string | null
  }
  offerings?: string[]
}

/**
 * True when any field a visitor would search contains the query. A missing
 * field is simply not searchable, which is different from matching nothing:
 * a farm with no address still matches on its name.
 */
export function matchesQuery(farm: SearchableFarm, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const fields: ReadonlyArray<unknown> = [
    farm.name,
    farm.location.address,
    farm.location.county,
    farm.location.postcode,
    ...(farm.offerings ?? []),
  ]

  return fields.some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
}
