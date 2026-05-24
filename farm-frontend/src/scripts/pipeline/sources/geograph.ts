// Geograph CC photo search via the keyless syndicator feed. The /api/0.1
// methods require an API key and reject anonymous calls with HTTP 400
// ("Unknown method"); syndicator.php is the public JSON feed. All Geograph
// imagery is CC BY-SA 2.0. Photos are "near" the coordinate, not guaranteed
// to be OF the farm, so results are tightly proximity-filtered and attach as
// pending review candidates (see 07-load).
import { fetchWithRetry } from '../lib/http'
import { calculateDistance } from '../../../shared/lib/geo'
import type { ImageCandidate } from '../types'

const MAX_KM = 0.5 // only keep photos very close to the farm coordinate
const MAX_RESULTS = 5

interface SyndicatorItem {
  guid?: string
  title?: string
  link?: string
  author?: string
  lat?: string
  long?: string
  thumb?: string
}
interface SyndicatorResponse { items?: SyndicatorItem[] }

/** Pure parser: keep CC photos within MAX_KM of the farm, ranked by proximity. */
export function parseGeograph(res: SyndicatorResponse, lat: number, lng: number): ImageCandidate[] {
  const scored: { cand: ImageCandidate; km: number }[] = []
  for (const item of res.items ?? []) {
    if (!item.thumb || !item.link) continue
    const ilat = Number(item.lat)
    const ilng = Number(item.long)
    if (!Number.isFinite(ilat) || !Number.isFinite(ilng)) continue
    const km = calculateDistance(lat, lng, ilat, ilng)
    if (km > MAX_KM) continue
    scored.push({
      km,
      cand: {
        url: item.thumb,
        source: 'geograph',
        license: 'CC-BY-SA-2.0',
        attribution: item.author ?? 'Geograph contributor',
        sourceUrl: item.link,
        score: Math.max(0, 1000 - Math.round(km * 1000)), // closer ranks higher
      },
    })
  }
  return scored
    .sort((a, b) => b.cand.score - a.cand.score)
    .slice(0, MAX_RESULTS)
    .map((x) => x.cand)
}

export async function fetchGeograph(
  lat: number, lng: number,
  opts: { fetcher?: typeof fetch; minDelayMs?: number } = {},
): Promise<ImageCandidate[]> {
  const url = `https://api.geograph.org.uk/syndicator.php?format=JSON&q=${lat},${lng}&perpage=20`
  const res = await fetchWithRetry<SyndicatorResponse>(url, {}, { fetcher: opts.fetcher, minDelayMs: opts.minDelayMs ?? 250 })
  return parseGeograph(res, lat, lng)
}
