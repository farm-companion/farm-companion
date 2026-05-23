// PURE merge policy. No IO, no DB, no clock - `now` is injected.
// This is the single source of truth for "who wins" when assembling a farm.

import {
  CURATED_SOURCES,
  SOURCE_PRECEDENCE,
  type DbFarm,
  type FarmChange,
  type FarmFieldName,
  type FieldDiff,
  type FieldProvenance,
  type NormalizedCandidate,
  type Provenance,
  type SourceName,
  type TaggedValue,
} from '../types'
import { calculateDistance } from '../../../shared/lib/geo'
import { nameSimilarity } from '../lib/similarity'

const FUZZY_MAX_KM = 0.15 // 150 m (operator decision 2026-05-23)
const FUZZY_MIN_SIMILARITY = 0.85

const CURATED_BY_DEFAULT: ReadonlySet<FarmFieldName> = new Set(['status', 'verified'])
const COORDINATE_FIELDS: ReadonlySet<FarmFieldName> = new Set(['latitude', 'longitude'])

function precedence(source: SourceName): number {
  return SOURCE_PRECEDENCE[source]
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

function decideField(
  field: FarmFieldName,
  existingValue: unknown,
  existingProv: FieldProvenance | undefined,
  incoming: TaggedValue,
  isUpdate: boolean,
): string | null {
  if (isEmpty(incoming.value)) return null
  if (!isEmpty(existingValue) && existingValue === incoming.value) return null
  // status/verified are curated-by-default: machine sources may set them on
  // create but never on update; curated sources may still update them.
  if (isUpdate && CURATED_BY_DEFAULT.has(field) && !CURATED_SOURCES.has(incoming.source)) return null
  if (isEmpty(existingValue)) return `fill empty ${field} from ${incoming.source}`

  const existingSource = existingProv?.source
  if (existingSource && CURATED_SOURCES.has(existingSource) && !CURATED_SOURCES.has(incoming.source)) {
    return null
  }
  // Only relevant when the existing source is non-curated; a curated existing
  // value is already protected by the rule above.
  if (COORDINATE_FIELDS.has(field) && incoming.source === 'derived') return null

  // No recorded provenance (e.g. legacy rows imported before provenance
  // tracking) is treated as precedence 0, so machine sources may overwrite it.
  // The load stage dry-run surfaces any mass overwrite before it is applied.
  const existingPrec = existingSource ? precedence(existingSource) : 0
  if (precedence(incoming.source) >= existingPrec) {
    return `overwrite ${field}: ${incoming.source}(${precedence(incoming.source)}) >= ${existingSource ?? 'none'}(${existingPrec})`
  }
  return null
}

export function mergeFarm(
  existing: DbFarm | null,
  incoming: NormalizedCandidate,
  now: string,
): FarmChange {
  const isUpdate = existing !== null
  const provenanceNext: Provenance = { ...(existing?.provenance ?? {}) }
  const fields: FieldDiff[] = []

  for (const key of Object.keys(incoming.fields) as FarmFieldName[]) {
    const incomingValue = incoming.fields[key]
    if (!incomingValue) continue
    const existingValue = existing?.fields[key] ?? null
    const reason = decideField(key, existingValue, provenanceNext[key], incomingValue, isUpdate)
    if (reason) {
      fields.push({ field: key, from: existingValue, to: incomingValue.value, reason })
      provenanceNext[key] = { source: incomingValue.source, at: now }
    }
  }

  const action: FarmChange['action'] = !isUpdate ? 'create' : fields.length > 0 ? 'update' : 'noop'
  return {
    action,
    matchKey: existing ? existing.slug : null,
    slug: incoming.slug ?? existing?.slug,
    fields,
    provenanceNext,
  }
}

export interface MatchResult {
  match: DbFarm | null
  matchKey: string | null
}

export function matchExisting(incoming: NormalizedCandidate, rows: DbFarm[]): MatchResult {
  if (incoming.osmId) {
    const m = rows.find((r) => r.osmId === incoming.osmId)
    if (m) return { match: m, matchKey: 'osmId' }
  }
  if (incoming.fsaId) {
    const m = rows.find((r) => r.fsaId === incoming.fsaId)
    if (m) return { match: m, matchKey: 'fsaId' }
  }
  if (incoming.googlePlaceId) {
    const m = rows.find((r) => r.googlePlaceId === incoming.googlePlaceId)
    if (m) return { match: m, matchKey: 'googlePlaceId' }
  }
  if (incoming.slug) {
    const m = rows.find((r) => r.slug === incoming.slug)
    if (m) return { match: m, matchKey: 'slug' }
  }
  const incName = incoming.fields.name?.value
  if (typeof incName === 'string' && incoming.latitude != null && incoming.longitude != null && incoming.postcode) {
    for (const r of rows) {
      if (r.postcode !== incoming.postcode) continue
      if (r.latitude == null || r.longitude == null) continue
      const existingName = r.fields.name
      if (typeof existingName !== 'string') continue
      const km = calculateDistance(incoming.latitude, incoming.longitude, r.latitude, r.longitude)
      if (km < FUZZY_MAX_KM && nameSimilarity(incName, existingName) >= FUZZY_MIN_SIMILARITY) {
        return { match: r, matchKey: 'fuzzy' }
      }
    }
  }
  return { match: null, matchKey: null }
}
