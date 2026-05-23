import type { RawFarmCandidate } from '../types'
import { fetchWithRetry } from '../lib/http'
import { PIPELINE_CONFIG } from '../config'

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}
interface OverpassResponse { elements: OverpassElement[] }

/** Pure parser - tested against fixtures. */
export function parseOverpass(res: OverpassResponse): RawFarmCandidate[] {
  const out: RawFarmCandidate[] = []
  for (const el of res.elements ?? []) {
    const tags = el.tags ?? {}
    if (tags.shop !== 'farm') continue
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    const addr = [tags['addr:housename'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ')
    out.push({
      source: 'osm',
      sourceId: `${el.type}:${el.id}`,
      name: tags.name,
      address: addr || undefined,
      postcode: tags['addr:postcode'],
      city: tags['addr:city'],
      latitude: lat,
      longitude: lon,
      phone: tags.phone ?? tags['contact:phone'],
      website: tags.website ?? tags['contact:website'],
      openingHoursRaw: tags.opening_hours,
      tags,
      raw: el,
    })
  }
  return out
}

/** UK region bounding boxes (south,west,north,east) kept small to respect limits. */
export const UK_BBOXES: ReadonlyArray<[number, number, number, number]> = [
  [49.9, -6.5, 55.9, 1.8],
  [54.0, -8.2, 55.4, -5.4],
]

export function overpassQuery(bbox: [number, number, number, number]): string {
  const [s, w, n, e] = bbox
  return `[out:json][timeout:120];(node["shop"="farm"](${s},${w},${n},${e});way["shop"="farm"](${s},${w},${n},${e}););out center tags;`
}

export async function fetchOverpass(
  bbox: [number, number, number, number],
  opts: { fetcher?: typeof fetch } = {},
): Promise<RawFarmCandidate[]> {
  const body = `data=${encodeURIComponent(overpassQuery(bbox))}`
  const res = await fetchWithRetry<OverpassResponse>(
    PIPELINE_CONFIG.overpass.endpoint,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    { fetcher: opts.fetcher, minDelayMs: PIPELINE_CONFIG.overpass.minDelayMs },
  )
  return parseOverpass(res)
}
