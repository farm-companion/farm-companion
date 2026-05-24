// Stage 01: run discovery sources, merge raw candidates, write artifact.
// Network calls happen here only; parsers are unit-tested separately.
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import { fetchOverpass, UK_BBOXES } from '../sources/overpass'
import { fetchFsaPage } from '../sources/fsa'
import type { RawFarmCandidate } from '../types'

/** Collapse exact duplicate candidates by source + sourceId (first wins). */
export function dedupeBySourceId(candidates: RawFarmCandidate[]): RawFarmCandidate[] {
  const seen = new Map<string, RawFarmCandidate>()
  for (const c of candidates) {
    const key = `${c.source}:${c.sourceId}`
    if (!seen.has(key)) seen.set(key, c)
  }
  return [...seen.values()]
}

const FSA_MAX_PAGES = 50 // safety ceiling; the empty-page break ends a short run earlier

export async function discover(opts: { limit?: number } = {}): Promise<RawFarmCandidate[]> {
  const started = Date.now()
  const candidates: RawFarmCandidate[] = []

  // Each source is best-effort: a failure (e.g. a provider outage or block) is
  // logged and tolerated so one source cannot abort the whole run. OSM is the
  // primary discovery source; FSA corroborates.
  try {
    for (const bbox of UK_BBOXES) {
      const batch = await fetchOverpass(bbox)
      candidates.push(...batch)
      log('info', 'overpass region done', { stage: '01', source: 'osm', count: batch.length })
      if (opts.limit && candidates.length >= opts.limit) break
    }
  } catch (e) {
    log('error', 'overpass discovery failed; continuing with other sources', { stage: '01', source: 'osm', error: e instanceof Error ? e.message : String(e) })
  }

  try {
    for (let page = 1; page <= FSA_MAX_PAGES; page++) {
      const batch = await fetchFsaPage(page)
      if (batch.length === 0) break
      if (page === FSA_MAX_PAGES) log('warn', 'fsa page ceiling hit; results may be truncated', { stage: '01', source: 'fsa', page })
      candidates.push(...batch)
      log('info', 'fsa page done', { stage: '01', source: 'fsa', count: batch.length, page })
      if (opts.limit && candidates.length >= opts.limit) break
    }
  } catch (e) {
    log('error', 'fsa discovery failed; continuing', { stage: '01', source: 'fsa', error: e instanceof Error ? e.message : String(e) })
  }

  const unique = dedupeBySourceId(candidates)
  const result = opts.limit ? unique.slice(0, opts.limit) : unique
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, '01-discover.json'), JSON.stringify(result, null, 2))
  log('info', 'discover complete', { stage: '01', count: result.length, durationMs: Date.now() - started })
  return result
}
