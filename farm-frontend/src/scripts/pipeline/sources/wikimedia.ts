// Wikimedia Commons geosearch. Licence varies per file; reject anything
// without a commercial+derivatives-friendly licence. Parser exported for tests.
import { fetchWithRetry } from '../lib/http'
import type { ImageCandidate } from '../types'

const ALLOWED_LICENSES = /^(CC0|CC[- ]BY(?:[- ]SA)?(?:[- ]\d(?:\.\d)?)?\s*$|Public[- ]domain|PD)/i

interface CommonsPage { title?: string; imageinfo?: { url?: string; extmetadata?: { LicenseShortName?: { value?: string }; Artist?: { value?: string } } }[] }
interface CommonsResponse { query?: { pages?: Record<string, CommonsPage> } }

function stripHtml(s: string | undefined): string {
  return (s ?? '').replace(/<[^>]+>/g, '').trim()
}

export function parseWikimedia(res: CommonsResponse): ImageCandidate[] {
  const pages = res.query?.pages ?? {}
  const out: ImageCandidate[] = []
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0]
    const license = stripHtml(info?.extmetadata?.LicenseShortName?.value)
    if (!info?.url || !ALLOWED_LICENSES.test(license)) continue
    out.push({
      url: info.url,
      source: 'wikimedia',
      license,
      attribution: stripHtml(info.extmetadata?.Artist?.value) || 'Wikimedia contributor',
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURI(page.title ?? '')}`,
      score: 400,
    })
  }
  return out
}

export async function fetchWikimedia(
  lat: number, lng: number,
  opts: { fetcher?: typeof fetch } = {},
): Promise<ImageCandidate[]> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lng}&ggsradius=1000&ggslimit=10&prop=imageinfo&iiprop=url|extmetadata&format=json`
  const res = await fetchWithRetry<CommonsResponse>(url, {}, { fetcher: opts.fetcher, minDelayMs: 1000 })
  return parseWikimedia(res)
}
