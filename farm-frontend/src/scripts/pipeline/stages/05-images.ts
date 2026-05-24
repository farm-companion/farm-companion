// Stage 05: rank + gate CC image candidates; flag AI fallback when none clear.
// Overall hero ranking (owner > user > CC > AI) is enforced at merge/render
// time; this stage handles only the CC tier + the AI-fallback flag.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import { fetchGeograph } from '../sources/geograph'
import { fetchWikimedia } from '../sources/wikimedia'
import type { ImageCandidate, NormalizedCandidate } from '../types'

export function rankImages(images: ImageCandidate[]): ImageCandidate[] {
  return [...images].sort((a, b) => b.score - a.score)
}

/** Merge already-attached images with freshly fetched ones, dedupe by url (existing wins). */
export function combineImages(existing: ImageCandidate[], fetched: ImageCandidate[]): ImageCandidate[] {
  const byUrl = new Map<string, ImageCandidate>()
  for (const img of fetched) byUrl.set(img.url, img)
  for (const img of existing) byUrl.set(img.url, img) // existing overrides fetched on url clash
  return [...byUrl.values()]
}

/** Fetch CC image candidates from both sources for a coordinate. A failure in one source does not abort the other. */
export async function fetchImagesFor(
  lat: number,
  lng: number,
  opts: { fetcher?: typeof fetch } = {},
): Promise<ImageCandidate[]> {
  const out: ImageCandidate[] = []
  for (const fn of [fetchGeograph, fetchWikimedia]) {
    try {
      out.push(...(await fn(lat, lng, opts)))
    } catch (e) {
      log('warn', 'image source failed', { stage: '05', error: e instanceof Error ? e.message : String(e) })
    }
  }
  return out
}

/** CC image is attachable only with non-empty license + attribution + sourceUrl. */
export function attachableImages(images: ImageCandidate[]): ImageCandidate[] {
  return images.filter((i) => i.license.trim() && i.attribution.trim() && i.sourceUrl.trim())
}

export function decideImages(images: ImageCandidate[]): { images: ImageCandidate[]; aiFallbackEligible: boolean } {
  const usable = rankImages(attachableImages(images))
  return { images: usable, aiFallbackEligible: usable.length === 0 }
}

export async function runImages(): Promise<NormalizedCandidate[]> {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const input = JSON.parse(readFileSync(resolve(dir, '04-enrich.json'), 'utf8')) as NormalizedCandidate[]
  let done = 0
  for (const c of input) {
    const fetched = (c.latitude != null && c.longitude != null)
      ? await fetchImagesFor(c.latitude, c.longitude)
      : []
    const decided = decideImages(combineImages(c.images ?? [], fetched))
    c.images = decided.images
    c.aiFallbackEligible = decided.aiFallbackEligible
    done++
    // Per-candidate network fetches make this the slowest stage; emit progress
    // so a long run is visibly working rather than appearing to hang.
    if (done % 10 === 0 || done === input.length) {
      log('info', 'images progress', { stage: '05', done, total: input.length })
    }
  }
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, '05-images.json'), JSON.stringify(input, null, 2))
  log('info', 'images complete', { stage: '05', count: input.length })
  return input
}
