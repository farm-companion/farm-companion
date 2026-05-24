// Stage 03: fill/validate coords + county/city via postcodes.io.
// Geocoded values are tagged 'derived' so the merge policy never lets them
// overwrite valid existing coordinates (merge-policy Rule 5).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { bulkGeocode } from '../sources/postcodes'
import { log } from '../lib/log'
import type { NormalizedCandidate } from '../types'

export async function geocode(
  candidates: NormalizedCandidate[],
  opts: { fetcher?: typeof fetch; minDelayMs?: number } = {},
): Promise<NormalizedCandidate[]> {
  const postcodes = [...new Set(candidates.map((c) => c.postcode).filter((p): p is string => !!p))]
  const geo = await bulkGeocode(postcodes, opts)

  for (const c of candidates) {
    if (!c.postcode) continue
    const g = geo.get(c.postcode)
    if (!g) continue
    if (c.latitude == null) { c.latitude = g.latitude; c.fields.latitude = { value: g.latitude, source: 'derived' } }
    if (c.longitude == null) { c.longitude = g.longitude; c.fields.longitude = { value: g.longitude, source: 'derived' } }
    if (!c.fields.county && g.county) c.fields.county = { value: g.county, source: 'derived' }
    if (!c.fields.city && g.city) c.fields.city = { value: g.city, source: 'derived' }
  }
  log('info', 'geocode complete', { stage: '03', count: candidates.length })
  return candidates
}

export async function runGeocode(): Promise<NormalizedCandidate[]> {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const input = JSON.parse(readFileSync(resolve(dir, '02-normalize.json'), 'utf8')) as NormalizedCandidate[]
  const out = await geocode(input)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, '03-geocode.json'), JSON.stringify(out, null, 2))
  return out
}
