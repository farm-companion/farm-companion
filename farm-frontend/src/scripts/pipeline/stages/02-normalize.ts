// Stage 02: raw candidates -> normalized, deduped candidates.
// Dedupe is pure and tested; the IO wrapper (runNormalize) is thin.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { calculateDistance } from '../../../shared/lib/geo'
import { nameSimilarity } from '../lib/similarity'
import {
  SOURCE_PRECEDENCE,
  type FarmFieldName,
  type NormalizedCandidate,
  type RawFarmCandidate,
  type SourceName,
  type TaggedValue,
} from '../types'

export function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/['‘’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const DEDUPE_MAX_KM = 0.15
const DEDUPE_MIN_SIM = 0.85

function tag(value: unknown, source: SourceName): TaggedValue | undefined {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return undefined
  return { value, source }
}

function toNormalized(raw: RawFarmCandidate): NormalizedCandidate {
  const source = raw.source as SourceName
  const fields: Partial<Record<FarmFieldName, TaggedValue>> = {}
  const set = (f: FarmFieldName, v: unknown) => { const t = tag(v, source); if (t) fields[f] = t }
  set('name', raw.name)
  set('address', raw.address)
  set('postcode', raw.postcode)
  set('city', raw.city)
  set('county', raw.county)
  set('latitude', raw.latitude)
  set('longitude', raw.longitude)
  set('phone', raw.phone)
  set('website', raw.website)
  return {
    osmId: raw.source === 'osm' ? raw.sourceId : undefined,
    fsaId: raw.source === 'fsa' ? raw.sourceId : undefined,
    slug: raw.name ? slugify(raw.name) : undefined,
    postcode: raw.postcode,
    latitude: raw.latitude,
    longitude: raw.longitude,
    fields,
    categories: [],
    images: [],
    aiFallbackEligible: false,
    tags: raw.tags,
  }
}

// Merge `b` into `a` (b's higher-precedence fields win; ids accumulate).
function mergeInto(a: NormalizedCandidate, b: NormalizedCandidate): void {
  a.osmId = a.osmId ?? b.osmId
  a.fsaId = a.fsaId ?? b.fsaId
  for (const key of Object.keys(b.fields) as FarmFieldName[]) {
    const incoming = b.fields[key]
    if (!incoming) continue
    const existing = a.fields[key]
    if (!existing || SOURCE_PRECEDENCE[incoming.source] > SOURCE_PRECEDENCE[existing.source]) {
      a.fields[key] = incoming
    }
  }
  a.latitude = a.latitude ?? b.latitude
  a.longitude = a.longitude ?? b.longitude
  a.slug = a.slug ?? b.slug
  a.tags = { ...(b.tags ?? {}), ...(a.tags ?? {}) }
  a.mergedFrom = [...(a.mergedFrom ?? []), b.osmId ?? b.fsaId ?? 'unknown']
}

function isSameFarm(a: NormalizedCandidate, b: NormalizedCandidate): boolean {
  const an = a.fields.name?.value, bn = b.fields.name?.value
  if (typeof an !== 'string' || typeof bn !== 'string') return false
  if (a.postcode && b.postcode && a.postcode !== b.postcode) return false
  if (a.latitude != null && a.longitude != null && b.latitude != null && b.longitude != null) {
    if (calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude) >= DEDUPE_MAX_KM) return false
  }
  return nameSimilarity(an, bn) >= DEDUPE_MIN_SIM
}

/** Pure normalize + dedupe - tested against in-memory arrays. */
export function normalize(raw: RawFarmCandidate[]): NormalizedCandidate[] {
  const result: NormalizedCandidate[] = []
  for (const r of raw) {
    const cand = toNormalized(r)
    const existing = result.find((c) => isSameFarm(c, cand))
    if (existing) mergeInto(existing, cand)
    else result.push(cand)
  }
  return result
}

export function runNormalize(): NormalizedCandidate[] {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const raw = JSON.parse(readFileSync(resolve(dir, '01-discover.json'), 'utf8')) as RawFarmCandidate[]
  const out = normalize(raw)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, '02-normalize.json'), JSON.stringify(out, null, 2))
  return out
}
