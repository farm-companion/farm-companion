import type { RawFarmCandidate } from '../types'
import { fetchWithRetry } from '../lib/http'
import { PIPELINE_CONFIG } from '../config'
import { isNonFarmChain } from './non-farm-chains'

interface FsaEstablishment {
  FHRSID: number
  BusinessName?: string
  /** e.g. "Retailers - other", "Restaurant/Cafe/Canteen", "Farmers/growers". */
  BusinessType?: string
  /** ISO date of the last hygiene inspection: evidence of when it last traded. */
  RatingDate?: string
  RatingValue?: string
  AddressLine1?: string
  AddressLine2?: string
  AddressLine3?: string
  PostCode?: string
  LocalAuthorityName?: string
  geocode?: { latitude?: string; longitude?: string }
}
interface FsaResponse { establishments: FsaEstablishment[] }

// Inherently farm-related: a record is a candidate on its type alone. Both are
// small nationally (3,009 and 12,234), so the type is a real filter.
const FARM_TYPES = new Set([
  'Farmers/growers',
  'Manufacturers/packers',
])

// Public-facing food premises, and the reason this source is worth querying at
// all: these categories hold the farm shops that 7838 does not. They also hold
// the entire high street, 120,983 "Retailers - other" and 141,317 restaurants
// nationally, so a record here is a candidate only when its NAME carries a farm
// signal. The queries below are name-filtered too; this is the second gate, so
// that an accidentally broad query cannot flood the directory.
const PUBLIC_TYPES = new Set([
  'Retailers - other',
  'Retailers - supermarkets/hypermarkets',
  'Restaurant/Cafe/Canteen',
  'Takeaway/sandwich shop',
  'Other catering premises',
])

const FARM_NAME_SIGNAL = /\bfarm/i

function num(s: string | undefined): number | undefined {
  if (s == null) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

// The FSA files commercial fishing vessels under "Farmers/growers" (id 7838),
// so they pass the business-type gate. They are not farms. Exclude by name:
// port-registration suffix (e.g. "SR2", "NN 748"), FV/MFV prefix, an explicit
// "(Vessel)"/"Fishing Vessel" tag, or "X Fishing"/"Fishing Ltd".
const VESSEL_NAME_PATTERNS: RegExp[] = [
  /\b[A-Z]{1,3}\s?\d{1,4}$/, // PLN port letters + number at end
  /^m?fv\b/i, // FV / MFV prefix
  /\(\s*(fishing\s+)?vessel\s*\)/i, // "(Vessel)" / "(Fishing Vessel)"
  /\bfishing\s+vessel\b/i,
  /\bfishing\s+(ltd|limited)\b/i,
  /\bfishing$/i, // name ending in "Fishing"
]

/** True when an FSA business name is a fishing vessel rather than a farm. */
export function isVesselName(name: string | undefined): boolean {
  if (!name) return false
  const n = name.trim()
  return VESSEL_NAME_PATTERNS.some((re) => re.test(n))
}

/** Pure parser - tested against fixtures. */
export function parseFsa(res: FsaResponse): RawFarmCandidate[] {
  const out: RawFarmCandidate[] = []
  for (const e of res.establishments ?? []) {
    // Require a known type so records with a missing or unknown type cannot
    // leak in, then require a farm name signal for the broad public types.
    const type = e.BusinessType
    if (!type) continue
    if (!FARM_TYPES.has(type)) {
      if (!PUBLIC_TYPES.has(type)) continue
      if (!FARM_NAME_SIGNAL.test(e.BusinessName ?? '')) continue
    }
    // Drop fishing vessels mis-filed under a farm business type.
    if (isVesselName(e.BusinessName)) continue
    // Drop national retail chains mis-filed under a farm business type.
    if (isNonFarmChain({ name: e.BusinessName })) continue
    const addr = [e.AddressLine1, e.AddressLine2, e.AddressLine3].filter(Boolean).join(', ')
    out.push({
      source: 'fsa',
      sourceId: String(e.FHRSID),
      name: e.BusinessName,
      address: addr || undefined,
      postcode: e.PostCode,
      county: e.LocalAuthorityName,
      latitude: num(e.geocode?.latitude),
      longitude: num(e.geocode?.longitude),
      raw: e,
    })
  }
  return out
}

// FSA "Farmers/growers". An UNFILTERED /Establishments query is rejected with
// HTTP 403 ("This is a CPU intensive query: please use one of the documented
// filters"), so every query below carries a businessTypeId.
export const FARM_BUSINESS_TYPE_ID = 7838

export interface FsaQuery {
  /** Short label for logs. */
  label: string
  businessTypeId: number
  /** Substring the FSA matches against BusinessName. */
  name?: string
}

/**
 * The queries that actually find farm shops.
 *
 * 7838 "Farmers/growers" is a PRODUCER category: it certifies that a business
 * grows things and says nothing about public access, which is the root cause
 * this whole area exists to fix. Measured 2026-10-31, it holds 16
 * establishments named "farm shop" nationally. The public-facing categories
 * hold 1,143 of them: 946 under "Retailers - other", 188 restaurants/cafes and
 * 9 takeaways. Each record also carries a BusinessType and a RatingDate, which
 * is direct evidence of a public-facing food premises and of when it was last
 * inspected.
 *
 * 7838 is kept unfiltered so existing discovery is unchanged. A broader
 * `name=farm` yields 3,523 across these types and is a deliberate follow-up:
 * it needs the non-farm-chain filter widened first.
 */
export const FSA_QUERIES: readonly FsaQuery[] = [
  { label: 'farmers-growers', businessTypeId: FARM_BUSINESS_TYPE_ID },
  { label: 'retail/farm shop', businessTypeId: 4613, name: 'farm shop' },
  { label: 'retail/farmshop', businessTypeId: 4613, name: 'farmshop' },
  { label: 'cafe/farm shop', businessTypeId: 1, name: 'farm shop' },
  { label: 'takeaway/farm shop', businessTypeId: 7844, name: 'farm shop' },
  { label: 'catering/farm shop', businessTypeId: 7841, name: 'farm shop' },
  { label: 'supermarket/farm shop', businessTypeId: 7840, name: 'farm shop' },
]

export async function fetchFsaPage(
  pageNumber: number,
  opts: { fetcher?: typeof fetch; minDelayMs?: number; query?: FsaQuery } = {},
): Promise<RawFarmCandidate[]> {
  const { endpoint, apiVersion, pageSize } = PIPELINE_CONFIG.fsa
  const query = opts.query ?? FSA_QUERIES[0]
  const nameParam = query.name ? `&name=${encodeURIComponent(query.name)}` : ''
  const url = `${endpoint}/Establishments?businessTypeId=${query.businessTypeId}${nameParam}&pageNumber=${pageNumber}&pageSize=${pageSize}`
  const res = await fetchWithRetry<FsaResponse>(
    url,
    { headers: { 'x-api-version': apiVersion, accept: 'application/json' } },
    // Several queries back to back trip the FSA rate limiter with a 403,
    // which is indistinguishable from the CPU-intensive-query refusal.
    { fetcher: opts.fetcher, minDelayMs: opts.minDelayMs ?? 1500 },
  )
  return parseFsa(res)
}
