import { fetchWithRetry } from '../lib/http'
import { PIPELINE_CONFIG } from '../config'

export interface GeoResult {
  latitude: number
  longitude: number
  county?: string
  city?: string
  postcode: string
}

interface BulkItem {
  query: string
  result: { postcode: string; latitude: number; longitude: number; admin_county?: string | null; admin_district?: string | null } | null
}
interface BulkResponse { status: number; result: BulkItem[] }

/** Pure parser - tested against fixtures. */
export function parseBulkPostcodes(res: BulkResponse): Map<string, GeoResult> {
  const map = new Map<string, GeoResult>()
  for (const item of res.result ?? []) {
    if (!item.result) continue
    map.set(item.query, {
      postcode: item.result.postcode,
      latitude: item.result.latitude,
      longitude: item.result.longitude,
      county: item.result.admin_county ?? undefined,
      city: item.result.admin_district ?? undefined,
    })
  }
  return map
}

export async function bulkGeocode(
  postcodes: string[],
  opts: { fetcher?: typeof fetch; minDelayMs?: number } = {},
): Promise<Map<string, GeoResult>> {
  const { endpoint, bulkSize } = PIPELINE_CONFIG.postcodes
  const merged = new Map<string, GeoResult>()
  for (let i = 0; i < postcodes.length; i += bulkSize) {
    const batch = postcodes.slice(i, i + bulkSize)
    const res = await fetchWithRetry<BulkResponse>(
      `${endpoint}/postcodes`,
      { method: 'POST', body: JSON.stringify({ postcodes: batch }), headers: { 'Content-Type': 'application/json' } },
      { fetcher: opts.fetcher, minDelayMs: opts.minDelayMs ?? 200 },
    )
    for (const [k, v] of parseBulkPostcodes(res)) merged.set(k, v)
  }
  return merged
}
