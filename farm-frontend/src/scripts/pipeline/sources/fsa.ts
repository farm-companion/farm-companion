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

/** Pure parser - tested against fixtures. */
export function parseFsa(res: FsaResponse): RawFarmCandidate[] {
  const out: RawFarmCandidate[] = []
  for (const e of res.establishments ?? []) {
    // FSA is a corroborating source; require a known farm-relevant type so
    // records with a missing/unknown type do not leak in as candidates.
    if (!e.BusinessType || !FARM_RELEVANT_TYPES.has(e.BusinessType)) continue
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

export async function fetchFsaPage(
  pageNumber: number,
  opts: { fetcher?: typeof fetch } = {},
): Promise<RawFarmCandidate[]> {
  const { endpoint, apiVersion, pageSize } = PIPELINE_CONFIG.fsa
  const url = `${endpoint}/Establishments?pageNumber=${pageNumber}&pageSize=${pageSize}`
  const res = await fetchWithRetry<FsaResponse>(
    url,
    { headers: { 'x-api-version': apiVersion, accept: 'application/json' } },
    { fetcher: opts.fetcher, minDelayMs: 1000 },
  )
  return parseFsa(res)
}
