// A county index for /shop, so the directory root can list what it holds
// without inlining it.
//
// /shop rendered a FarmCard for all 3,504 farms in one document: 15.59 MB, of
// which 12.00 MB was markup at 3,424 bytes a card and 3.56 MB was the RSC
// payload carrying every farm a second time. There was no search and no
// filter on the page; the `filteredFarms` state existed but its setter was
// never called, so the whole array was shipped to the client for nothing. The
// page has zero Search Console impressions.
//
// Every farm stays reachable in two clicks: /shop names the county,
// /counties/[slug] lists its farms. No URL changes.
import type { FarmShop } from '@/types/farm'
import { slugifyCounty } from './county-slug'

export interface CountySummary {
  county: string
  slug: string
  count: number
}

export interface DirectoryIndex {
  counties: CountySummary[]
  /**
   * Farms with no county recorded. They get no row, because
   * /counties/unknown-county 404s and a row would be a link to nothing, but
   * they must still be accounted for: there are 519 of them against 2,985
   * with a county, and a page that indexes 2,985 while its own stat line
   * says 3,504 is lying to the reader. All 519 carry coordinates, so the map
   * is where they can be found.
   */
  withoutCounty: number
}

/**
 * Farms grouped into one row per county, sorted by county name, plus a count
 * of the ones no county row can hold.
 *
 * The two numbers always sum to the input length. That invariant is the point:
 * it is what surfaced the 519.
 */
export function summariseByCounty(farms: readonly FarmShop[]): DirectoryIndex {
  const counts = new Map<string, number>()
  let withoutCounty = 0
  for (const farm of farms) {
    const county = farm.location?.county?.trim()
    if (!county) { withoutCounty += 1; continue }
    counts.set(county, (counts.get(county) ?? 0) + 1)
  }
  const counties = [...counts]
    .map(([county, count]) => ({ county, slug: slugifyCounty(county), count }))
    .sort((a, b) => a.county.localeCompare(b.county))
  return { counties, withoutCounty }
}
