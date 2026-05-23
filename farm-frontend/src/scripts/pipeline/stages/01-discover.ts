// Stage 01: run discovery sources, merge raw candidates, write artifact.
// Network calls happen here only; parsers are unit-tested separately.
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import { fetchOverpass, UK_BBOXES } from '../sources/overpass'
import { fetchFsaPage } from '../sources/fsa'
import type { RawFarmCandidate } from '../types'

export async function discover(opts: { limit?: number } = {}): Promise<RawFarmCandidate[]> {
  const started = Date.now()
  const candidates: RawFarmCandidate[] = []

  for (const bbox of UK_BBOXES) {
    const batch = await fetchOverpass(bbox)
    candidates.push(...batch)
    log('info', 'overpass region done', { stage: '01', source: 'osm', count: batch.length })
    if (opts.limit && candidates.length >= opts.limit) break
  }

  for (let page = 1; page <= 3; page++) {
    const batch = await fetchFsaPage(page)
    if (batch.length === 0) break
    candidates.push(...batch)
    log('info', 'fsa page done', { stage: '01', source: 'fsa', count: batch.length, page })
    if (opts.limit && candidates.length >= opts.limit) break
  }

  const result = opts.limit ? candidates.slice(0, opts.limit) : candidates
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, '01-discover.json'), JSON.stringify(result, null, 2))
  log('info', 'discover complete', { stage: '01', count: result.length, durationMs: Date.now() - started })
  return result
}
