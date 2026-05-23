// Stage 05: rank + gate CC image candidates; flag AI fallback when none clear.
// Overall hero ranking (owner > user > CC > AI) is enforced at merge/render
// time; this stage handles only the CC tier + the AI-fallback flag.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import type { ImageCandidate, NormalizedCandidate } from '../types'

export function rankImages(images: ImageCandidate[]): ImageCandidate[] {
  return [...images].sort((a, b) => b.score - a.score)
}

/** CC image is attachable only with non-empty license + attribution + sourceUrl. */
export function attachableImages(images: ImageCandidate[]): ImageCandidate[] {
  return images.filter((i) => i.license.trim() && i.attribution.trim() && i.sourceUrl.trim())
}

export function decideImages(images: ImageCandidate[]): { images: ImageCandidate[]; aiFallbackEligible: boolean } {
  const usable = rankImages(attachableImages(images))
  return { images: usable, aiFallbackEligible: usable.length === 0 }
}

export function runImages(): NormalizedCandidate[] {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const input = JSON.parse(readFileSync(resolve(dir, '04-enrich.json'), 'utf8')) as NormalizedCandidate[]
  for (const c of input) {
    const decided = decideImages(c.images ?? [])
    c.images = decided.images
    c.aiFallbackEligible = decided.aiFallbackEligible
  }
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, '05-images.json'), JSON.stringify(input, null, 2))
  log('info', 'images complete', { stage: '05', count: input.length })
  return input
}
