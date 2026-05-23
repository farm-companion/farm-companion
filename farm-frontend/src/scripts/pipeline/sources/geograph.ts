// Geograph CC photo search. Captures photographer/title/source URL at fetch
// time (CC BY-SA 2.0 requires attribution). Parser exported for testing.
import { fetchWithRetry } from '../lib/http'
import type { ImageCandidate } from '../types'

interface GeographItem { id: number; title?: string; realname?: string; imgurl?: string; distance?: number }
interface GeographResponse { items?: GeographItem[] }

export function parseGeograph(res: GeographResponse): ImageCandidate[] {
  return (res.items ?? [])
    .filter((i) => i.imgurl)
    .map((i) => ({
      url: i.imgurl as string,
      source: 'geograph' as const,
      license: 'CC-BY-SA-2.0',
      attribution: i.realname ?? 'Geograph contributor',
      sourceUrl: `https://www.geograph.org.uk/photo/${i.id}`,
      score: i.distance != null ? Math.max(0, 1000 - i.distance) : 500,
    }))
}

export async function fetchGeograph(
  lat: number, lng: number,
  opts: { fetcher?: typeof fetch } = {},
): Promise<ImageCandidate[]> {
  const url = `https://api.geograph.org.uk/api/0.1/geophotos?lat=${lat}&lon=${lng}&distance=1&format=JSON`
  const res = await fetchWithRetry<GeographResponse>(url, {}, { fetcher: opts.fetcher, minDelayMs: 1000 })
  return parseGeograph(res)
}
