import type { RawFarmCandidate } from '../types'
import { fetchWithRetry } from '../lib/http'
import { PIPELINE_CONFIG } from '../config'

interface FsaEstablishment {
  FHRSID: number
  BusinessName?: string
  BusinessType?: string
  AddressLine1?: string
  AddressLine2?: string
  AddressLine3?: string
  PostCode?: string
  LocalAuthorityName?: string
  geocode?: { latitude?: string; longitude?: string }
}
interface FsaResponse { establishments: FsaEstablishment[] }

// FSA business types that plausibly include farm shops. Coarse by design;
// FSA corroborates OSM rather than standing alone.
const FARM_RELEVANT_TYPES = new Set([
  'Retailers - other',
  'Retailers - supermarkets/hypermarkets',
  'Farmers/growers',
  'Manufacturers/packers',
])

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
    // FSA is a corroborating source; require a known farm-relevant type so
    // records with a missing/unknown type do not leak in as candidates.
    if (!e.BusinessType || !FARM_RELEVANT_TYPES.has(e.BusinessType)) continue
    // Drop fishing vessels mis-filed under a farm business type.
    if (isVesselName(e.BusinessName)) continue
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

// FSA "Farmers/growers" business type. An UNFILTERED /Establishments query is
// rejected with HTTP 403 ("This is a CPU intensive query: please use one of the
// documented filters"); a businessTypeId filter is required. 7838 is the clean
// farm signal (Retailers-other 4613 is large/noisy and is left to a follow-up).
export const FARM_BUSINESS_TYPE_ID = 7838

export async function fetchFsaPage(
  pageNumber: number,
  opts: { fetcher?: typeof fetch; minDelayMs?: number } = {},
): Promise<RawFarmCandidate[]> {
  const { endpoint, apiVersion, pageSize } = PIPELINE_CONFIG.fsa
  const url = `${endpoint}/Establishments?businessTypeId=${FARM_BUSINESS_TYPE_ID}&pageNumber=${pageNumber}&pageSize=${pageSize}`
  const res = await fetchWithRetry<FsaResponse>(
    url,
    { headers: { 'x-api-version': apiVersion, accept: 'application/json' } },
    { fetcher: opts.fetcher, minDelayMs: opts.minDelayMs ?? 1000 },
  )
  return parseFsa(res)
}
