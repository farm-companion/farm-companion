// Shared contracts for the farm-data pipeline.
// Every stage reads/writes these shapes via .pipeline/*.json artifacts.

/** Who set a field value. Precedence is defined by SOURCE_PRECEDENCE. */
export type SourceName =
  | 'owner' | 'admin' | 'user'   // curated (human)
  | 'fsa' | 'osm' | 'google'     // machine fetched
  | 'derived'                    // computed (geocode, heuristics)

/** Higher wins. Curated > FSA > OSM > derived > google (hours seam). */
export const SOURCE_PRECEDENCE: Record<SourceName, number> = {
  owner: 100,
  admin: 100,
  user: 90,
  fsa: 80,
  osm: 60,
  derived: 40,
  google: 20,
}

export const CURATED_SOURCES: ReadonlySet<SourceName> = new Set([
  'owner', 'admin', 'user',
])

/**
 * Field-level farm attributes the merge policy reasons about (each carries
 * its own provenance). Row-level markers (osmId, fsaId, dataSource) are NOT
 * here: they identify the row, not a mergeable field, so they are matched on
 * rather than provenance-tracked.
 */
export type FarmFieldName =
  | 'name' | 'description' | 'address' | 'city' | 'county' | 'postcode'
  | 'latitude' | 'longitude' | 'phone' | 'email' | 'website'
  | 'openingHours' | 'status' | 'verified'

export interface FieldProvenance {
  source: SourceName
  at: string // ISO8601
}

/** Per-field provenance map persisted on Farm.provenance (Json). */
export type Provenance = Partial<Record<FarmFieldName, FieldProvenance>>

/** A field value tagged with the source that produced it. */
export interface TaggedValue {
  value: unknown
  source: SourceName
}

/** Raw output of a single discovery source (stage 01). */
export interface RawFarmCandidate {
  source: 'osm' | 'fsa'
  sourceId: string // "node:123" | "way:456" | FHRSID
  name?: string
  address?: string
  postcode?: string
  city?: string
  county?: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  openingHoursRaw?: string // OSM opening_hours string
  tags?: Record<string, string>
  raw: unknown // original payload, for debugging
}

export interface ImageCandidate {
  url: string
  source: 'geograph' | 'wikimedia'
  license: string // "CC-BY-SA-2.0" | "CC0" | ...
  attribution: string // photographer / author
  sourceUrl: string // canonical source page
  score: number // ranking score (higher = better)
}

/** Common shape after normalize (stage 02+). */
export interface NormalizedCandidate {
  osmId?: string
  fsaId?: string
  googlePlaceId?: string
  slug?: string
  postcode?: string
  latitude?: number
  longitude?: number
  fields: Partial<Record<FarmFieldName, TaggedValue>>
  categories: string[] // category slugs from tags
  images: ImageCandidate[]
  aiFallbackEligible: boolean
  tags?: Record<string, string> // OSM tags carried forward for enrich (stage 04)
  /** recorded reasons when duplicates were collapsed (stage 02). */
  mergedFrom?: string[]
}

/** Minimal live-DB view the merge policy needs (stage 06 builds this). */
export interface DbFarm {
  id: string
  slug: string
  osmId: string | null
  fsaId: string | null
  googlePlaceId: string | null
  postcode: string | null
  latitude: number | null
  longitude: number | null
  provenance: Provenance | null
  fields: Partial<Record<FarmFieldName, unknown>>
}

export interface FieldDiff {
  field: FarmFieldName
  from: unknown
  to: unknown
  reason: string
}

export interface FarmChange {
  action: 'create' | 'update' | 'noop'
  matchKey: string | null // diagnostic only (how/whether matched, e.g. existing slug or 'fuzzy'); NOT a reliable row locator - use `slug` to locate the row
  slug?: string
  fields: FieldDiff[]
  provenanceNext: Provenance
}

export type ChangeSet = FarmChange[]

export interface RunReport {
  created: number
  updated: number
  noop: number
  skipped: number
  imagesAttached: number
  categoriesLinked: number
  errors: number
  byField: Record<string, number>
  startedAt: string
  finishedAt: string
}
