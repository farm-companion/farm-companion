# Farm Data Pipeline Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Google-Places Python crawler with a single TypeScript, open-data-first pipeline (OSM + FSA discovery, postcodes.io geocoding, Geograph/Wikimedia CC images) that carries field-level provenance, never clobbers curated data, and loads dry-run-first.

**Architecture:** A staged pipeline under `farm-frontend/src/scripts/pipeline/`. Each stage reads the prior stage's JSON artifact from `.pipeline/` and writes its own, so every boundary is inspectable and every stage is independently re-runnable. The merge policy is a set of pure, exhaustively-tested functions; all source clients are tested against captured fixtures, never the live network.

**Tech Stack:** TypeScript + `tsx`, `node:test` + `node:assert/strict` (run via `pnpm test:unit`), Prisma 5.22.0 (additive `db push` only — never `migrate dev`), native `fetch`.

**Source of truth:** `docs/superpowers/specs/2026-05-23-farm-data-pipeline-redesign.md`.

**Operator decisions locked (2026-05-23):**
- **Matching (§6.3 rule 5):** fuzzy match requires haversine distance `< 0.15 km` AND name similarity `>= 0.85` (Dice bigram coefficient), and **never** matches across different `postcode`.
- **Attribution (§11 OL-1):** OSM/Geograph/Wikimedia credit surfaces on a new `/data-attributions` page linked from the global footer. The deeper ODbL share-alike question (must we publish the derived dataset) remains a documented open question and does NOT block build/dry-run.

**Conventions every task must follow:**
- Tests: `import { test } from 'node:test'` and `import assert from 'node:assert/strict'`. Test files are `*.test.ts` colocated with source. Run a single file with `pnpm tsx --test src/scripts/pipeline/path/file.test.ts`; run all with `pnpm test:unit`.
- All commands run from `farm-frontend/` unless stated.
- CLAUDE.md work-unit rules apply: ≤ 8 files touched, ≤ 300 changed LOC (excluding deletions/docs), ≤ 1 new dependency per slice. No new dependency is needed anywhere in this plan.
- No `console.log` soup in pipeline code — use `lib/log.ts` (built in Slice C).
- Commit after each task with a `feat(pipeline):` / `test(pipeline):` / `chore(pipeline):` prefix.

---

## File Structure

```
farm-frontend/src/scripts/pipeline/
  types.ts                    # A — shared contracts + SOURCE_PRECEDENCE
  config.ts                   # C — endpoints, rate limits, feature flags
  lib/
    log.ts                    # C — structured JSON logger
    http.ts                   # C — fetch wrapper: retry, backoff, throttle
    similarity.ts             # B — Dice bigram name similarity (pure)
  sources/
    overpass.ts               # C — OSM Overpass client + parser
    fsa.ts                    # C — FSA ratings client + parser
    postcodes.ts              # E — postcodes.io geocode/reverse client + parser
    geograph.ts               # G — Geograph CC photo search + parser
    wikimedia.ts              # G — Wikimedia Commons CC photo search + parser
    google-hours.ts           # F — flag-gated hours seam, default OFF
  policy/
    merge-policy.ts           # B — PURE: precedence, never-clobber, matching, change-set
  stages/
    01-discover.ts            # C
    02-normalize.ts           # D
    03-geocode.ts             # E
    04-enrich.ts              # F
    05-images.ts              # G
    06-merge.ts               # H
    07-load.ts                # I
  run.ts                      # J — orchestrator
  __fixtures__/               # captured API responses for tests (per slice)

farm-frontend/prisma/schema.prisma                  # A — additive Farm/Image columns
farm-frontend/src/scripts/check-image-schema.ts     # A — extend probe
farm-frontend/src/app/data-attributions/page.tsx    # G — attribution page
docs (ledger + spec status)                         # J
```

Test files are colocated (`merge-policy.test.ts`, `overpass.test.ts`, etc.). Every pure module is written test-first.

---

## Slice A — Types + schema + provenance

**Goal:** Lock the shared contracts and add additive, nullable provenance columns to the DB, verified by the read-only probe.

**Files:**
- Create: `src/scripts/pipeline/types.ts`
- Modify: `prisma/schema.prisma` (Farm model lines 20-109, Image model lines 191-245)
- Modify: `src/scripts/check-image-schema.ts`

- [ ] **Step 1: Write the contracts file**

Create `src/scripts/pipeline/types.ts`:

```ts
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

/** Farm fields the merge policy reasons about. */
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
  matchKey: string | null // e.g. "osmId", slug, "fuzzy", or null for create
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
```

- [ ] **Step 2: Add additive columns to the Farm model**

In `prisma/schema.prisma`, inside `model Farm` after the `paymentMethods Json?` line (around line 74, before `// Relationships`), add:

```prisma
  // Provenance & matching (pipeline redesign, 2026-05-23)
  provenance     Json?     // { "<field>": { "source": "...", "at": ISO8601 } }
  osmId          String?   @db.VarChar(40)  // "node:123" | "way:456"
  fsaId          String?   @db.VarChar(40)  // FHRSID
  dataSource     String?   @db.VarChar(20)  // primary discovery source for the row
  lastEnrichedAt DateTime?
```

And add to the Farm `@@index` block (after line 107, before `@@map("farms")`):

```prisma
  @@index([osmId])
  @@index([fsaId])
```

- [ ] **Step 3: Add additive columns to the Image model**

In `model Image`, after the `urlExpiresAt DateTime?` line (227), add:

```prisma
  // CC / open-data provenance (pipeline redesign, 2026-05-23)
  // `source` extended values: 'google' | 'runware' | 'upload' | 'geograph' | 'wikimedia'
  license     String? @db.VarChar(40)  // "CC-BY-SA-2.0" | "OGL" | "CC0"
  sourceUrl   String? @db.VarChar(500) // canonical source page for attribution
  attribution String? @db.VarChar(255) // generalises googleAttribution
```

> Leave `googleAttribution` in place; `attribution` generalises it. Do not change the `source` column type — only widen its documented allowed values (comment in the schema at lines 220-222).

- [ ] **Step 4: Extend the probe to report the new columns**

In `src/scripts/check-image-schema.ts`, replace the `EXPECTED_COLUMNS` constant (lines 29-34) with:

```ts
const EXPECTED_IMAGE_COLUMNS = [
  'source',
  'googlePhotoRef',
  'googleAttribution',
  'urlExpiresAt',
  'license',
  'sourceUrl',
  'attribution',
] as const

const EXPECTED_FARM_COLUMNS = [
  'provenance',
  'osmId',
  'fsaId',
  'dataSource',
  'lastEnrichedAt',
] as const

async function columnsFor(table: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns WHERE table_name = ${table}
  `
  return new Set(rows.map((c) => c.column_name))
}

function report(table: string, present: Set<string>, expected: readonly string[]): boolean {
  let ok = true
  console.log(`${table} columns:`)
  for (const col of expected) {
    const has = present.has(col)
    if (!has) ok = false
    console.log(`  ${has ? 'PRESENT' : 'MISSING'}  ${col}`)
  }
  console.log('')
  return ok
}
```

Then replace the body of `main()` after the host log (lines 52-79) with:

```ts
  const [imageCols, farmCols] = await Promise.all([
    columnsFor('images'),
    columnsFor('farms'),
  ])
  const imagesOk = report('images', imageCols, EXPECTED_IMAGE_COLUMNS)
  const farmsOk = report('farms', farmCols, EXPECTED_FARM_COLUMNS)

  const [farmCount, imageCount] = await Promise.all([
    prisma.farm.count(),
    prisma.image.count(),
  ])
  console.log(`Row counts: farms=${farmCount}, images=${imageCount}`)
  console.log('')
  console.log(
    imagesOk && farmsOk
      ? 'RESULT: schema already synced — no db push needed.'
      : 'RESULT: columns MISSING — run `pnpm prisma db push` to apply additive columns.'
  )
```

- [ ] **Step 5: Verify the schema compiles and types are valid**

Run: `pnpm prisma validate && pnpm tsc --noEmit`
Expected: prisma prints "The schema is valid", tsc exits 0 (no errors on `types.ts` or the probe).

- [ ] **Step 6: OPERATOR STEP — apply the additive columns**

> Touches the live DB; the agent cannot do this. Present as one atomic operator step and wait.

- Step A6 — apply additive provenance columns to the live DB
- Owner: you (operator)
- Action: from `farm-frontend/`, run `pnpm prisma db push` against the DB your `.env.local` points at.
- Verify: run `pnpm tsx src/scripts/check-image-schema.ts` and confirm it prints `RESULT: schema already synced`.
- Reply: paste the probe output.

- [ ] **Step 7: Commit**

```bash
git add src/scripts/pipeline/types.ts prisma/schema.prisma src/scripts/check-image-schema.ts
git commit -m "feat(pipeline): Slice A — pipeline types + additive provenance schema + probe"
```

---

## Slice B — Merge policy (TDD-first, the heart)

**Goal:** Pure, exhaustively-tested functions implementing §6 precedence, never-clobber, matching, and change-set construction. No IO.

**Files:**
- Create: `src/scripts/pipeline/lib/similarity.ts` (+ `similarity.test.ts`)
- Create: `src/scripts/pipeline/policy/merge-policy.ts` (+ `merge-policy.test.ts`)

- [ ] **Step 1: Write the failing similarity test**

Create `src/scripts/pipeline/lib/similarity.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nameSimilarity } from './similarity'

test('identical names score 1', () => {
  assert.equal(nameSimilarity('Riverford Farm Shop', 'Riverford Farm Shop'), 1)
})

test('similarity is case- and whitespace-insensitive', () => {
  assert.equal(nameSimilarity('  Riverford   FARM shop ', 'riverford farm shop'), 1)
})

test('near-duplicate clears the 0.85 gate', () => {
  assert.ok(nameSimilarity('Riverford Farm Shop', 'Riverford Farmshop') >= 0.85)
})

test('different farms fall below 0.85', () => {
  assert.ok(nameSimilarity('Riverford Farm Shop', 'Daylesford Organic') < 0.85)
})

test('empty inputs score 0', () => {
  assert.equal(nameSimilarity('', 'anything'), 0)
  assert.equal(nameSimilarity('anything', ''), 0)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm tsx --test src/scripts/pipeline/lib/similarity.test.ts`
Expected: FAIL — `nameSimilarity` not found / module missing.

- [ ] **Step 3: Implement similarity (Dice bigram coefficient)**

Create `src/scripts/pipeline/lib/similarity.ts`:

```ts
// Pure name-similarity using the Sørensen–Dice coefficient over character
// bigrams. Returns 0..1. Chosen over Levenshtein for stability on word
// reorder and length differences. Used by the fuzzy matcher (§6.3 rule 5).

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function bigrams(s: string): Map<string, number> {
  const map = new Map<string, number>()
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2)
    map.set(bg, (map.get(bg) ?? 0) + 1)
  }
  return map
}

export function nameSimilarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  if (na.length < 2 || nb.length < 2) return 0

  const ba = bigrams(na)
  const bb = bigrams(nb)
  let intersection = 0
  for (const [bg, countA] of ba) {
    const countB = bb.get(bg) ?? 0
    intersection += Math.min(countA, countB)
  }
  const total = (na.length - 1) + (nb.length - 1)
  return (2 * intersection) / total
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm tsx --test src/scripts/pipeline/lib/similarity.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/scripts/pipeline/lib/similarity.ts src/scripts/pipeline/lib/similarity.test.ts
git commit -m "test(pipeline): Slice B.1 — Dice bigram name similarity"
```

- [ ] **Step 6: Write the failing merge-policy test (precedence + never-clobber)**

Create `src/scripts/pipeline/policy/merge-policy.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { DbFarm, NormalizedCandidate } from '../types'
import { mergeFarm, matchExisting } from './merge-policy'

const ISO = '2026-05-23T00:00:00.000Z'

function candidate(partial: Partial<NormalizedCandidate> = {}): NormalizedCandidate {
  return { fields: {}, categories: [], images: [], aiFallbackEligible: false, ...partial }
}

function dbFarm(partial: Partial<DbFarm> = {}): DbFarm {
  return {
    id: 'f1', slug: 'riverford-farm-shop', osmId: null, fsaId: null, googlePlaceId: null,
    postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7, provenance: null, fields: {},
    ...partial,
  }
}

test('create: no existing row yields action=create with provenance for every field', () => {
  const inc = candidate({ osmId: 'node:1', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } })
  const change = mergeFarm(null, inc, ISO)
  assert.equal(change.action, 'create')
  assert.equal(change.fields.find((f) => f.field === 'name')?.to, 'Riverford Farm Shop')
  assert.equal(change.provenanceNext.name?.source, 'osm')
  assert.equal(change.provenanceNext.name?.at, ISO)
})

test('never-clobber: owner-curated name is not overwritten by osm', () => {
  const existing = dbFarm({ fields: { name: 'Riverford (Owner Edited)' }, provenance: { name: { source: 'owner', at: '2026-01-01T00:00:00.000Z' } } })
  const inc = candidate({ osmId: 'node:1', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'name'), undefined)
  assert.equal(change.provenanceNext.name?.source, 'owner')
})

test('fill-empty: osm fills a null field even though osm is below curated', () => {
  const existing = dbFarm({ fields: { website: null }, provenance: {} })
  const inc = candidate({ fields: { website: { value: 'https://riverford.co.uk', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'website')?.to, 'https://riverford.co.uk')
  assert.equal(change.provenanceNext.website?.source, 'osm')
})

test('higher source overwrites lower: fsa overwrites an osm-set field', () => {
  const existing = dbFarm({ fields: { address: 'Old St' }, provenance: { address: { source: 'osm', at: ISO } } })
  const inc = candidate({ fields: { address: { value: 'Wash Barn, Buckfastleigh', source: 'fsa' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'address')?.to, 'Wash Barn, Buckfastleigh')
  assert.equal(change.provenanceNext.address?.source, 'fsa')
})

test('lower source does NOT overwrite higher: osm cannot overwrite fsa-set field', () => {
  const existing = dbFarm({ fields: { address: 'Wash Barn' }, provenance: { address: { source: 'fsa', at: ISO } } })
  const inc = candidate({ fields: { address: { value: 'Old St', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'address'), undefined)
})

test('empty incoming never erases a populated equal-source field', () => {
  const existing = dbFarm({ fields: { phone: '01234 567890' }, provenance: { phone: { source: 'osm', at: ISO } } })
  const inc = candidate({ fields: { phone: { value: '', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'phone'), undefined)
})

test('coordinates: valid existing coords are never overwritten by derived', () => {
  const existing = dbFarm({ latitude: 50.5, longitude: -3.7, fields: { latitude: 50.5, longitude: -3.7 }, provenance: { latitude: { source: 'osm', at: ISO } } })
  const inc = candidate({ fields: { latitude: { value: 50.123, source: 'derived' }, longitude: { value: -3.999, source: 'derived' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'latitude'), undefined)
})

test('status/verified: machine source cannot flip them on update', () => {
  const existing = dbFarm({ fields: { status: 'active', verified: true }, provenance: { status: { source: 'admin', at: ISO } } })
  const inc = candidate({ fields: { status: { value: 'pending', source: 'osm' }, verified: { value: false, source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.fields.find((f) => f.field === 'status'), undefined)
  assert.equal(change.fields.find((f) => f.field === 'verified'), undefined)
})

test('noop: identical incoming values produce action=noop with no field diffs', () => {
  const existing = dbFarm({ fields: { name: 'Riverford Farm Shop' }, provenance: { name: { source: 'osm', at: ISO } } })
  const inc = candidate({ osmId: 'node:1', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } })
  const change = mergeFarm(existing, inc, ISO)
  assert.equal(change.action, 'noop')
  assert.equal(change.fields.length, 0)
})
```

- [ ] **Step 7: Write the failing matching test (§6.3, locked thresholds)**

Append to `src/scripts/pipeline/policy/merge-policy.test.ts`:

```ts
test('match by osmId exact wins first', () => {
  const rows = [dbFarm({ id: 'a', osmId: 'node:1' }), dbFarm({ id: 'b', fsaId: '999' })]
  const inc = candidate({ osmId: 'node:1', fsaId: '999' })
  assert.equal(matchExisting(inc, rows).match?.id, 'a')
})

test('match by fsaId when no osmId match', () => {
  const rows = [dbFarm({ id: 'b', fsaId: '999' })]
  const inc = candidate({ osmId: 'node:404', fsaId: '999' })
  assert.equal(matchExisting(inc, rows).match?.id, 'b')
})

test('fuzzy match: same name within 150m and same postcode matches', () => {
  const rows = [dbFarm({ id: 'c', latitude: 50.5000, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: 'Riverford Farm Shop' } })]
  const inc = candidate({ latitude: 50.5008, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: { value: 'Riverford Farmshop', source: 'osm' } } }) // ~89m
  const result = matchExisting(inc, rows)
  assert.equal(result.match?.id, 'c')
  assert.equal(result.matchKey, 'fuzzy')
})

test('fuzzy match: same name but >150m apart does NOT match', () => {
  const rows = [dbFarm({ id: 'c', latitude: 50.5000, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: 'Riverford Farm Shop' } })]
  const inc = candidate({ latitude: 50.5050, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } }) // ~556m
  assert.equal(matchExisting(inc, rows).match, null)
})

test('fuzzy match: never matches across different postcodes', () => {
  const rows = [dbFarm({ id: 'c', latitude: 50.5000, longitude: -3.7000, postcode: 'TQ11 0JU', fields: { name: 'Riverford Farm Shop' } })]
  const inc = candidate({ latitude: 50.5008, longitude: -3.7000, postcode: 'EX5 1DX', fields: { name: { value: 'Riverford Farm Shop', source: 'osm' } } })
  assert.equal(matchExisting(inc, rows).match, null)
})

test('no match yields null (caller will create)', () => {
  const rows = [dbFarm({ id: 'c', latitude: 50.5, longitude: -3.7, postcode: 'TQ11 0JU', fields: { name: 'Riverford Farm Shop' } })]
  const inc = candidate({ latitude: 55, longitude: -1, postcode: 'YO1 7PR', fields: { name: { value: 'Totally Different Farm', source: 'osm' } } })
  assert.equal(matchExisting(inc, rows).match, null)
})
```

- [ ] **Step 8: Run to verify both test blocks fail**

Run: `pnpm tsx --test src/scripts/pipeline/policy/merge-policy.test.ts`
Expected: FAIL — `mergeFarm` / `matchExisting` not found.

- [ ] **Step 9: Implement the merge policy**

Create `src/scripts/pipeline/policy/merge-policy.ts`:

```ts
// PURE merge policy (§6). No IO, no DB, no clock — `now` is injected.
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

/** Fields where machine sources may set on create but never flip on update. */
const CURATED_BY_DEFAULT: ReadonlySet<FarmFieldName> = new Set(['status', 'verified'])
/** Coordinate fields: never overwrite valid existing with derived. */
const COORDINATE_FIELDS: ReadonlySet<FarmFieldName> = new Set(['latitude', 'longitude'])

function precedence(source: SourceName): number {
  return SOURCE_PRECEDENCE[source]
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

/** Returns a diff reason string if the incoming value should be written, else null. */
function decideField(
  field: FarmFieldName,
  existingValue: unknown,
  existingProv: FieldProvenance | undefined,
  incoming: TaggedValue,
  isUpdate: boolean,
): string | null {
  if (isEmpty(incoming.value)) return null // Rule 3
  if (!isEmpty(existingValue) && existingValue === incoming.value) return null // identical -> noop
  if (isUpdate && CURATED_BY_DEFAULT.has(field) && !isEmpty(existingValue)) return null // Rule 6
  if (isEmpty(existingValue)) return `fill empty ${field} from ${incoming.source}` // Rule 1 (fill)

  const existingSource = existingProv?.source
  if (existingSource && CURATED_SOURCES.has(existingSource) && !CURATED_SOURCES.has(incoming.source)) {
    return null // Rule 2: curated never clobbered by machine
  }
  if (COORDINATE_FIELDS.has(field) && incoming.source === 'derived') return null // Rule 5

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
  matchKey: string | null // "osmId" | "fsaId" | "googlePlaceId" | "slug" | "fuzzy" | null
}

/** §6.3 matching: first hit wins. */
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
  // Fuzzy: name >= 0.85 AND distance < 150m AND same postcode.
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
```

- [ ] **Step 10: Run to verify all merge-policy tests pass**

Run: `pnpm tsx --test src/scripts/pipeline/policy/merge-policy.test.ts`
Expected: PASS (all precedence + matching tests).

- [ ] **Step 11: Commit**

```bash
git add src/scripts/pipeline/policy/merge-policy.ts src/scripts/pipeline/policy/merge-policy.test.ts
git commit -m "feat(pipeline): Slice B — pure merge policy (precedence, never-clobber, matching)"
```

---

## Slice C — Discover: OSM Overpass + FSA + http/log scaffolding

**Goal:** Source clients that parse captured fixtures into `RawFarmCandidate[]`, plus the throttled/retrying http wrapper and structured logger. Stage 01 chains them. Two commits (C.1 scaffolding, C.2 clients+stage) keep each under the LOC budget.

**Files:**
- Create: `src/scripts/pipeline/config.ts`, `lib/log.ts`, `lib/http.ts` (+ `http.test.ts`)
- Create: `sources/overpass.ts` (+ test), `sources/fsa.ts` (+ test), `stages/01-discover.ts`
- Create fixtures under `src/scripts/pipeline/__fixtures__/`

- [ ] **Step 1: Write the config module**

Create `src/scripts/pipeline/config.ts`:

```ts
// Endpoints, rate limits, and feature flags for the pipeline.
export const PIPELINE_CONFIG = {
  overpass: {
    endpoint: process.env.OVERPASS_ENDPOINT ?? 'https://overpass-api.de/api/interpreter',
    minDelayMs: 3000, // be polite to public instances
  },
  fsa: {
    endpoint: 'https://api.ratings.food.gov.uk',
    apiVersion: '2',
    pageSize: 1000,
  },
  postcodes: {
    endpoint: 'https://api.postcodes.io',
    bulkSize: 100,
  },
  google: {
    hoursSeamEnabled: process.env.GOOGLE_HOURS_SEAM === 'true', // default OFF
  },
  artifactDir: process.env.PIPELINE_ARTIFACT_DIR ?? '.pipeline',
} as const
```

- [ ] **Step 2: Write the structured logger**

Create `src/scripts/pipeline/lib/log.ts`:

```ts
// One JSON line per event. No console.log soup elsewhere in the pipeline.
type Level = 'info' | 'warn' | 'error'

export interface LogFields {
  stage?: string
  source?: string
  count?: number
  durationMs?: number
  [k: string]: unknown
}

export function log(level: Level, msg: string, fields: LogFields = {}): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields })
  if (level === 'error') console.error(line)
  else console.log(line)
}
```

- [ ] **Step 3: Write the failing http test**

Create `src/scripts/pipeline/lib/http.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchWithRetry } from './http'

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers })
}

test('returns parsed JSON on first success', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return jsonResponse({ ok: true }) }
  const result = await fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 3, backoffBaseMs: 1 })
  assert.deepEqual(result, { ok: true })
  assert.equal(calls, 1)
})

test('retries on 429 then succeeds', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return calls < 3 ? jsonResponse({}, 429) : jsonResponse({ ok: true }) }
  const result = await fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 5, backoffBaseMs: 1 })
  assert.deepEqual(result, { ok: true })
  assert.equal(calls, 3)
})

test('throws after exhausting attempts on persistent 503', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return jsonResponse({}, 503) }
  await assert.rejects(fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 3, backoffBaseMs: 1 }), /503/)
  assert.equal(calls, 3)
})

test('does not retry on 400 (client error)', async () => {
  let calls = 0
  const fetcher = async () => { calls++; return jsonResponse({}, 400) }
  await assert.rejects(fetchWithRetry('https://x', {}, { fetcher, minDelayMs: 0, maxAttempts: 3, backoffBaseMs: 1 }), /400/)
  assert.equal(calls, 1)
})
```

- [ ] **Step 4: Run to verify it fails**

Run: `pnpm tsx --test src/scripts/pipeline/lib/http.test.ts`
Expected: FAIL — `fetchWithRetry` not found.

- [ ] **Step 5: Implement the http wrapper**

Create `src/scripts/pipeline/lib/http.ts`:

```ts
// fetch wrapper with throttle, exponential backoff + jitter, Retry-After
// support, and a capped attempt count. Retries only idempotent failures
// (429 + 5xx). `fetcher` is injectable for tests.
import { log } from './log'

export interface FetchOptions {
  fetcher?: typeof fetch
  minDelayMs?: number
  maxAttempts?: number
  backoffBaseMs?: number
}

const RETRYABLE = new Set([429, 500, 502, 503, 504])
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function fetchWithRetry<T = unknown>(
  url: string,
  init: RequestInit = {},
  opts: FetchOptions = {},
): Promise<T> {
  const fetcher = opts.fetcher ?? fetch
  const minDelayMs = opts.minDelayMs ?? 0
  const maxAttempts = opts.maxAttempts ?? 4
  const backoffBaseMs = opts.backoffBaseMs ?? 500

  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (minDelayMs > 0 && attempt === 1) await sleep(minDelayMs)
    const res = await fetcher(url, init)
    if (res.ok) return (await res.json()) as T

    if (!RETRYABLE.has(res.status) || attempt === maxAttempts) {
      throw new Error(`HTTP ${res.status} for ${url}`)
    }
    const retryAfter = Number(res.headers.get('retry-after'))
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : backoffBaseMs * 2 ** (attempt - 1) + Math.random() * backoffBaseMs
    log('warn', 'http retry', { url, status: res.status, attempt, waitMs: Math.round(wait) })
    lastErr = new Error(`HTTP ${res.status}`)
    await sleep(wait)
  }
  throw lastErr instanceof Error ? lastErr : new Error('fetchWithRetry exhausted')
}
```

- [ ] **Step 6: Run http test to verify pass, then commit C.1**

Run: `pnpm tsx --test src/scripts/pipeline/lib/http.test.ts`
Expected: PASS (4 tests).

```bash
git add src/scripts/pipeline/config.ts src/scripts/pipeline/lib/log.ts src/scripts/pipeline/lib/http.ts src/scripts/pipeline/lib/http.test.ts
git commit -m "feat(pipeline): Slice C.1 — config, structured log, retrying http wrapper"
```

- [ ] **Step 7: Capture an Overpass fixture**

Create `src/scripts/pipeline/__fixtures__/overpass-sample.json`:

```json
{
  "elements": [
    { "type": "node", "id": 1234, "lat": 50.5008, "lon": -3.7, "tags": { "shop": "farm", "name": "Riverford Farm Shop", "addr:postcode": "TQ11 0JU", "addr:city": "Buckfastleigh", "website": "https://riverford.co.uk", "phone": "01803 762059", "opening_hours": "Mo-Sa 09:00-17:00" } },
    { "type": "way", "id": 5678, "center": { "lat": 51.1, "lon": -1.2 }, "tags": { "shop": "farm", "name": "Nameless Way Farm" } },
    { "type": "node", "id": 9999, "lat": 52.0, "lon": -1.0, "tags": { "amenity": "cafe", "name": "Not A Farm" } }
  ]
}
```

- [ ] **Step 8: Write the failing Overpass test**

Create `src/scripts/pipeline/sources/overpass.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseOverpass } from './overpass'

const fixture = JSON.parse(readFileSync(resolve(__dirname, '../__fixtures__/overpass-sample.json'), 'utf8'))

test('parses shop=farm nodes into candidates with source ids', () => {
  const out = parseOverpass(fixture)
  const river = out.find((c) => c.sourceId === 'node:1234')
  assert.ok(river)
  assert.equal(river?.source, 'osm')
  assert.equal(river?.name, 'Riverford Farm Shop')
  assert.equal(river?.postcode, 'TQ11 0JU')
  assert.equal(river?.latitude, 50.5008)
  assert.equal(river?.openingHoursRaw, 'Mo-Sa 09:00-17:00')
})

test('uses way center for lat/lng', () => {
  const out = parseOverpass(fixture)
  const way = out.find((c) => c.sourceId === 'way:5678')
  assert.equal(way?.latitude, 51.1)
  assert.equal(way?.longitude, -1.2)
})

test('ignores non-farm elements', () => {
  const out = parseOverpass(fixture)
  assert.equal(out.find((c) => c.sourceId === 'node:9999'), undefined)
})
```

- [ ] **Step 9: Run to verify FAIL, then implement Overpass client**

Run: `pnpm tsx --test src/scripts/pipeline/sources/overpass.test.ts` → FAIL.

Create `src/scripts/pipeline/sources/overpass.ts`:

```ts
import type { RawFarmCandidate } from '../types'
import { fetchWithRetry } from '../lib/http'
import { PIPELINE_CONFIG } from '../config'

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}
interface OverpassResponse { elements: OverpassElement[] }

/** Pure parser — tested against fixtures. */
export function parseOverpass(res: OverpassResponse): RawFarmCandidate[] {
  const out: RawFarmCandidate[] = []
  for (const el of res.elements ?? []) {
    const tags = el.tags ?? {}
    if (tags.shop !== 'farm') continue
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    const addr = [tags['addr:housename'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ')
    out.push({
      source: 'osm',
      sourceId: `${el.type}:${el.id}`,
      name: tags.name,
      address: addr || undefined,
      postcode: tags['addr:postcode'],
      city: tags['addr:city'],
      latitude: lat,
      longitude: lon,
      phone: tags.phone ?? tags['contact:phone'],
      website: tags.website ?? tags['contact:website'],
      openingHoursRaw: tags.opening_hours,
      tags,
      raw: el,
    })
  }
  return out
}

/** UK region bounding boxes (south,west,north,east) kept small to respect limits. */
export const UK_BBOXES: ReadonlyArray<[number, number, number, number]> = [
  [49.9, -6.5, 55.9, 1.8],   // GB main (split further if Overpass times out)
  [54.0, -8.2, 55.4, -5.4],  // Northern Ireland
]

export function overpassQuery(bbox: [number, number, number, number]): string {
  const [s, w, n, e] = bbox
  return `[out:json][timeout:120];(node["shop"="farm"](${s},${w},${n},${e});way["shop"="farm"](${s},${w},${n},${e}););out center tags;`
}

export async function fetchOverpass(
  bbox: [number, number, number, number],
  opts: { fetcher?: typeof fetch } = {},
): Promise<RawFarmCandidate[]> {
  const body = `data=${encodeURIComponent(overpassQuery(bbox))}`
  const res = await fetchWithRetry<OverpassResponse>(
    PIPELINE_CONFIG.overpass.endpoint,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    { fetcher: opts.fetcher, minDelayMs: PIPELINE_CONFIG.overpass.minDelayMs },
  )
  return parseOverpass(res)
}
```

Run: `pnpm tsx --test src/scripts/pipeline/sources/overpass.test.ts` → PASS.

- [ ] **Step 10: Capture an FSA fixture + write its failing test**

Create `src/scripts/pipeline/__fixtures__/fsa-sample.json`:

```json
{
  "establishments": [
    { "FHRSID": 12345, "BusinessName": "Riverford Farm Shop", "BusinessType": "Retailers - other", "AddressLine1": "Wash Barn", "AddressLine2": "Buckfastleigh", "PostCode": "TQ11 0JU", "LocalAuthorityName": "South Hams", "geocode": { "latitude": "50.5008", "longitude": "-3.7" } },
    { "FHRSID": 67890, "BusinessName": "City Kebab House", "BusinessType": "Takeaway/sandwich shop", "PostCode": "M1 1AA", "geocode": { "latitude": "53.4", "longitude": "-2.2" } }
  ]
}
```

Create `src/scripts/pipeline/sources/fsa.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseFsa } from './fsa'

const fixture = JSON.parse(readFileSync(resolve(__dirname, '../__fixtures__/fsa-sample.json'), 'utf8'))

test('parses farm-relevant establishments with FHRSID source id', () => {
  const out = parseFsa(fixture)
  const river = out.find((c) => c.sourceId === '12345')
  assert.ok(river)
  assert.equal(river?.source, 'fsa')
  assert.equal(river?.postcode, 'TQ11 0JU')
  assert.equal(river?.county, 'South Hams')
  assert.equal(river?.latitude, 50.5008)
})

test('filters out clearly non-farm business types', () => {
  const out = parseFsa(fixture)
  assert.equal(out.find((c) => c.sourceId === '67890'), undefined)
})
```

- [ ] **Step 11: Run to verify FAIL, then implement FSA client**

Create `src/scripts/pipeline/sources/fsa.ts`:

```ts
import type { RawFarmCandidate } from '../types'
import { fetchWithRetry } from '../lib/http'
import { PIPELINE_CONFIG } from '../config'

interface FsaEstablishment {
  FHRSID: number
  BusinessName?: string
  BusinessType?: string
  AddressLine1?: string
  AddressLine2?: string
  AddressLine3?: string
  PostCode?: string
  LocalAuthorityName?: string
  geocode?: { latitude?: string; longitude?: string }
}
interface FsaResponse { establishments: FsaEstablishment[] }

// FSA business types that plausibly include farm shops. Coarse by design;
// FSA corroborates OSM rather than standing alone (spec OL-2).
const FARM_RELEVANT_TYPES = new Set([
  'Retailers - other',
  'Retailers - supermarkets/hypermarkets',
  'Farmers/growers',
  'Manufacturers/packers',
])

function num(s: string | undefined): number | undefined {
  if (s == null) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

/** Pure parser — tested against fixtures. */
export function parseFsa(res: FsaResponse): RawFarmCandidate[] {
  const out: RawFarmCandidate[] = []
  for (const e of res.establishments ?? []) {
    if (e.BusinessType && !FARM_RELEVANT_TYPES.has(e.BusinessType)) continue
    const addr = [e.AddressLine1, e.AddressLine2, e.AddressLine3].filter(Boolean).join(', ')
    out.push({
      source: 'fsa',
      sourceId: String(e.FHRSID),
      name: e.BusinessName,
      address: addr || undefined,
      postcode: e.PostCode,
      county: e.LocalAuthorityName,
      latitude: num(e.geocode?.latitude),
      longitude: num(e.geocode?.longitude),
      raw: e,
    })
  }
  return out
}

export async function fetchFsaPage(
  pageNumber: number,
  opts: { fetcher?: typeof fetch } = {},
): Promise<RawFarmCandidate[]> {
  const { endpoint, apiVersion, pageSize } = PIPELINE_CONFIG.fsa
  const url = `${endpoint}/Establishments?pageNumber=${pageNumber}&pageSize=${pageSize}`
  const res = await fetchWithRetry<FsaResponse>(
    url,
    { headers: { 'x-api-version': apiVersion, accept: 'application/json' } },
    { fetcher: opts.fetcher, minDelayMs: 1000 },
  )
  return parseFsa(res)
}
```

Run: `pnpm tsx --test src/scripts/pipeline/sources/fsa.test.ts` → PASS.

- [ ] **Step 12: Write stage 01-discover**

Create `src/scripts/pipeline/stages/01-discover.ts`:

```ts
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
```

- [ ] **Step 13: Verify typecheck + full unit suite, then commit C.2**

Run: `pnpm tsc --noEmit && pnpm test:unit`
Expected: tsc clean; all pipeline tests green alongside the existing suite.

```bash
git add src/scripts/pipeline/sources/overpass.ts src/scripts/pipeline/sources/overpass.test.ts src/scripts/pipeline/sources/fsa.ts src/scripts/pipeline/sources/fsa.test.ts src/scripts/pipeline/stages/01-discover.ts src/scripts/pipeline/__fixtures__/overpass-sample.json src/scripts/pipeline/__fixtures__/fsa-sample.json
git commit -m "feat(pipeline): Slice C.2 — OSM/FSA clients + stage 01 discover"
```

---

## Slice D — Normalize + dedupe

**Goal:** Collapse intra/inter-source duplicates into one `NormalizedCandidate` per real farm, tagging each field with its source and recording the merge reason.

**Files:**
- Create: `src/scripts/pipeline/stages/02-normalize.ts` (+ `02-normalize.test.ts`)

- [ ] **Step 1: Write the failing dedupe/normalize test**

Create `src/scripts/pipeline/stages/02-normalize.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { RawFarmCandidate } from '../types'
import { normalize, slugify } from './02-normalize'

test('slugify produces url-safe slugs', () => {
  assert.equal(slugify('Riverford Farm Shop'), 'riverford-farm-shop')
  assert.equal(slugify("O'Connor & Sons Farm"), 'oconnor-sons-farm')
})

test('a single OSM candidate becomes one normalized candidate with osm-tagged fields', () => {
  const raw: RawFarmCandidate[] = [{ source: 'osm', sourceId: 'node:1', name: 'Riverford Farm Shop', postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7, raw: {} }]
  const out = normalize(raw)
  assert.equal(out.length, 1)
  assert.equal(out[0].osmId, 'node:1')
  assert.equal(out[0].slug, 'riverford-farm-shop')
  assert.equal(out[0].fields.name?.source, 'osm')
})

test('same farm from OSM + FSA collapses into one candidate carrying both ids', () => {
  const raw: RawFarmCandidate[] = [
    { source: 'osm', sourceId: 'node:1', name: 'Riverford Farm Shop', postcode: 'TQ11 0JU', latitude: 50.5000, longitude: -3.7000, raw: {} },
    { source: 'fsa', sourceId: '12345', name: 'Riverford Farm Shop', postcode: 'TQ11 0JU', latitude: 50.5005, longitude: -3.7000, address: 'Wash Barn', raw: {} },
  ]
  const out = normalize(raw)
  assert.equal(out.length, 1)
  assert.equal(out[0].osmId, 'node:1')
  assert.equal(out[0].fsaId, '12345')
  assert.equal(out[0].fields.address?.source, 'fsa') // FSA (higher) wins address
  assert.ok(out[0].mergedFrom?.length)
})

test('different farms with same name but different postcodes stay separate', () => {
  const raw: RawFarmCandidate[] = [
    { source: 'osm', sourceId: 'node:1', name: 'Manor Farm Shop', postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7, raw: {} },
    { source: 'osm', sourceId: 'node:2', name: 'Manor Farm Shop', postcode: 'YO1 7PR', latitude: 53.9, longitude: -1.0, raw: {} },
  ]
  assert.equal(normalize(raw).length, 2)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm tsx --test src/scripts/pipeline/stages/02-normalize.test.ts` → FAIL.

- [ ] **Step 3: Implement normalize + dedupe**

Create `src/scripts/pipeline/stages/02-normalize.ts`:

```ts
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
    .replace(/['’]/g, '')
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

/** Pure normalize + dedupe — tested against in-memory arrays. */
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
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm tsx --test src/scripts/pipeline/stages/02-normalize.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/scripts/pipeline/stages/02-normalize.ts src/scripts/pipeline/stages/02-normalize.test.ts
git commit -m "feat(pipeline): Slice D — normalize + dedupe (OSM+FSA collapse)"
```

---

## Slice E — Geocode (postcodes.io)

**Goal:** Validate postcodes, fill missing coordinates and county/city from postcodes.io. Stage 03 enriches normalized candidates; geocoded values are tagged `derived`.

**Files:**
- Create: `src/scripts/pipeline/sources/postcodes.ts` (+ `postcodes.test.ts`)
- Create: `src/scripts/pipeline/stages/03-geocode.ts`
- Create: `src/scripts/pipeline/__fixtures__/postcodes-sample.json`

- [ ] **Step 1: Capture fixture + write failing parser test**

Create `src/scripts/pipeline/__fixtures__/postcodes-sample.json`:

```json
{
  "status": 200,
  "result": [
    { "query": "TQ11 0JU", "result": { "postcode": "TQ11 0JU", "latitude": 50.5008, "longitude": -3.7, "admin_county": "Devon", "admin_district": "South Hams" } },
    { "query": "ZZ99 9ZZ", "result": null }
  ]
}
```

Create `src/scripts/pipeline/sources/postcodes.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseBulkPostcodes } from './postcodes'

const fixture = JSON.parse(readFileSync(resolve(__dirname, '../__fixtures__/postcodes-sample.json'), 'utf8'))

test('maps valid postcode to coords + county/district', () => {
  const map = parseBulkPostcodes(fixture)
  const hit = map.get('TQ11 0JU')
  assert.equal(hit?.latitude, 50.5008)
  assert.equal(hit?.county, 'Devon')
  assert.equal(hit?.city, 'South Hams')
})

test('invalid postcode maps to undefined (not present)', () => {
  const map = parseBulkPostcodes(fixture)
  assert.equal(map.get('ZZ99 9ZZ'), undefined)
})
```

- [ ] **Step 2: Run to verify FAIL, then implement client**

Create `src/scripts/pipeline/sources/postcodes.ts`:

```ts
import { fetchWithRetry } from '../lib/http'
import { PIPELINE_CONFIG } from '../config'

export interface GeoResult {
  latitude: number
  longitude: number
  county?: string
  city?: string
  postcode: string
}

interface BulkItem {
  query: string
  result: { postcode: string; latitude: number; longitude: number; admin_county?: string | null; admin_district?: string | null } | null
}
interface BulkResponse { status: number; result: BulkItem[] }

/** Pure parser — tested against fixtures. */
export function parseBulkPostcodes(res: BulkResponse): Map<string, GeoResult> {
  const map = new Map<string, GeoResult>()
  for (const item of res.result ?? []) {
    if (!item.result) continue
    map.set(item.query, {
      postcode: item.result.postcode,
      latitude: item.result.latitude,
      longitude: item.result.longitude,
      county: item.result.admin_county ?? undefined,
      city: item.result.admin_district ?? undefined,
    })
  }
  return map
}

export async function bulkGeocode(
  postcodes: string[],
  opts: { fetcher?: typeof fetch } = {},
): Promise<Map<string, GeoResult>> {
  const { endpoint, bulkSize } = PIPELINE_CONFIG.postcodes
  const merged = new Map<string, GeoResult>()
  for (let i = 0; i < postcodes.length; i += bulkSize) {
    const batch = postcodes.slice(i, i + bulkSize)
    const res = await fetchWithRetry<BulkResponse>(
      `${endpoint}/postcodes`,
      { method: 'POST', body: JSON.stringify({ postcodes: batch }), headers: { 'Content-Type': 'application/json' } },
      { fetcher: opts.fetcher, minDelayMs: 200 },
    )
    for (const [k, v] of parseBulkPostcodes(res)) merged.set(k, v)
  }
  return merged
}
```

Run: `pnpm tsx --test src/scripts/pipeline/sources/postcodes.test.ts` → PASS.

- [ ] **Step 3: Implement stage 03-geocode**

Create `src/scripts/pipeline/stages/03-geocode.ts`:

```ts
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
  opts: { fetcher?: typeof fetch } = {},
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
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm tsc --noEmit && pnpm tsx --test src/scripts/pipeline/sources/postcodes.test.ts`
Expected: tsc clean, tests PASS.

```bash
git add src/scripts/pipeline/sources/postcodes.ts src/scripts/pipeline/sources/postcodes.test.ts src/scripts/pipeline/stages/03-geocode.ts src/scripts/pipeline/__fixtures__/postcodes-sample.json
git commit -m "feat(pipeline): Slice E — postcodes.io geocode (stage 03)"
```

---

## Slice F — Enrich (hours + offerings→categories)

**Goal:** Map OSM tags to category slugs. Add a flag-gated, default-OFF Google hours seam that must not call out unless `GOOGLE_HOURS_SEAM=true`.

**Files:**
- Create: `src/scripts/pipeline/stages/04-enrich.ts` (+ `04-enrich.test.ts`)
- Create: `src/scripts/pipeline/sources/google-hours.ts`

- [ ] **Step 1: Write failing enrich test (category mapping + seam OFF)**

Create `src/scripts/pipeline/stages/04-enrich.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { NormalizedCandidate } from '../types'
import { tagsToCategories, enrich } from './04-enrich'
import { maybeFetchHours } from '../sources/google-hours'

test('OSM produce/organic tags map to category slugs incl. farm-shops', () => {
  const slugs = tagsToCategories({ shop: 'farm', organic: 'yes', produce: 'vegetables;eggs' })
  assert.ok(slugs.includes('farm-shops'))
  assert.ok(slugs.includes('organic'))
  assert.ok(slugs.includes('vegetables'))
  assert.ok(slugs.includes('eggs'))
})

test('every farm gets the farm-shops category even with no extra tags', () => {
  assert.deepEqual(tagsToCategories({ shop: 'farm' }), ['farm-shops'])
})

test('enrich attaches categories without removing existing ones', () => {
  const cands: NormalizedCandidate[] = [{
    osmId: 'node:1', fields: {}, categories: ['pre-existing'], images: [], aiFallbackEligible: false,
    tags: { shop: 'farm', organic: 'yes' },
  }]
  const out = enrich(cands)
  assert.ok(out[0].categories.includes('pre-existing'))
  assert.ok(out[0].categories.includes('farm-shops'))
  assert.ok(out[0].categories.includes('organic'))
})

test('google hours seam is OFF by default and returns null without fetching', async () => {
  let called = false
  const result = await maybeFetchHours('Some Farm', { fetcher: async () => { called = true; return new Response('{}') } })
  assert.equal(result, null)
  assert.equal(called, false)
})
```

- [ ] **Step 2: Run to verify FAIL, then implement the google-hours seam**

Create `src/scripts/pipeline/sources/google-hours.ts`:

```ts
// OPTIONAL opening-hours seam. OFF by default (GOOGLE_HOURS_SEAM env flag).
// Discovery and photos via Google are explicitly out of scope (spec §4.6).
import { PIPELINE_CONFIG } from '../config'

export async function maybeFetchHours(
  _farmName: string,
  _opts: { fetcher?: typeof fetch } = {},
): Promise<string | null> {
  if (!PIPELINE_CONFIG.google.hoursSeamEnabled) return null
  // Intentionally a no-op until the flag is enabled by an operator decision.
  // When enabled, fetch hours-only and tag the field source 'google'.
  return null
}
```

- [ ] **Step 3: Implement stage 04-enrich**

Create `src/scripts/pipeline/stages/04-enrich.ts`:

```ts
// Stage 04: offerings/categories from OSM tags. Categories are additive
// (merge policy Rule 7) — we never remove existing ones.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import type { NormalizedCandidate } from '../types'

// OSM produce token -> site category slug. Extend as the taxonomy grows.
const PRODUCE_TO_SLUG: Record<string, string> = {
  vegetables: 'vegetables',
  veg: 'vegetables',
  fruit: 'fruit',
  eggs: 'eggs',
  meat: 'meat',
  dairy: 'dairy',
  milk: 'dairy',
  cheese: 'dairy',
  honey: 'honey',
  flowers: 'flowers',
}

export function tagsToCategories(tags: Record<string, string>): string[] {
  const slugs = new Set<string>(['farm-shops']) // every farm shop gets this
  if (tags.organic === 'yes') slugs.add('organic')
  if (tags.produce) {
    for (const token of tags.produce.split(/[;,]/).map((t) => t.trim().toLowerCase())) {
      const slug = PRODUCE_TO_SLUG[token]
      if (slug) slugs.add(slug)
    }
  }
  return [...slugs]
}

export function enrich(candidates: NormalizedCandidate[]): NormalizedCandidate[] {
  for (const c of candidates) {
    const cats = tagsToCategories(c.tags ?? {})
    c.categories = [...new Set([...c.categories, ...cats])]
  }
  return candidates
}

export function runEnrich(): NormalizedCandidate[] {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const input = JSON.parse(readFileSync(resolve(dir, '03-geocode.json'), 'utf8')) as NormalizedCandidate[]
  const out = enrich(input)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, '04-enrich.json'), JSON.stringify(out, null, 2))
  log('info', 'enrich complete', { stage: '04', count: out.length })
  return out
}
```

- [ ] **Step 4: Run to verify pass + typecheck**

Run: `pnpm tsx --test src/scripts/pipeline/stages/04-enrich.test.ts && pnpm tsc --noEmit`
Expected: PASS (4 tests), tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/pipeline/stages/04-enrich.ts src/scripts/pipeline/stages/04-enrich.test.ts src/scripts/pipeline/sources/google-hours.ts
git commit -m "feat(pipeline): Slice F — enrich (categories + hours seam OFF)"
```

---

## Slice G — Images (CC sourcing + ranking + attribution page)

**Goal:** Rank image candidates, attach CC images only when attribution is complete, flag AI-fallback otherwise, and surface attribution on `/data-attributions` (operator decision).

**Files:**
- Create: `src/scripts/pipeline/sources/geograph.ts`, `src/scripts/pipeline/sources/wikimedia.ts`
- Create: `src/scripts/pipeline/stages/05-images.ts` (+ `05-images.test.ts`)
- Create: `src/app/data-attributions/page.tsx`
- Modify: the global footer component (add `/data-attributions` link)

- [ ] **Step 1: Write failing image-ranking test**

Create `src/scripts/pipeline/stages/05-images.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { ImageCandidate } from '../types'
import { rankImages, attachableImages, decideImages } from './05-images'

const cc = (over: Partial<ImageCandidate> = {}): ImageCandidate => ({
  url: 'https://x/img.jpg', source: 'geograph', license: 'CC-BY-SA-2.0',
  attribution: 'Jane Doe', sourceUrl: 'https://geograph/123', score: 0, ...over,
})

test('ranking prefers higher score', () => {
  const ranked = rankImages([cc({ score: 1 }), cc({ score: 5 }), cc({ score: 3 })])
  assert.deepEqual(ranked.map((i) => i.score), [5, 3, 1])
})

test('image with missing attribution is NOT attachable', () => {
  const ok = cc()
  const out = attachableImages([ok, cc({ attribution: '' })])
  assert.equal(out.length, 1)
  assert.equal(out[0], ok)
})

test('image with missing license is NOT attachable', () => {
  assert.equal(attachableImages([cc({ license: '' })]).length, 0)
})

test('no attachable CC images -> aiFallbackEligible true, images empty', () => {
  const r = decideImages([cc({ attribution: '' })])
  assert.equal(r.aiFallbackEligible, true)
  assert.equal(r.images.length, 0)
})

test('attachable CC images present -> aiFallbackEligible false, highest score first', () => {
  const r = decideImages([cc({ score: 2 }), cc({ score: 9 })])
  assert.equal(r.aiFallbackEligible, false)
  assert.equal(r.images[0].score, 9)
})
```

- [ ] **Step 2: Run to verify FAIL, then implement ranking core**

Create `src/scripts/pipeline/stages/05-images.ts`:

```ts
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
```

Run: `pnpm tsx --test src/scripts/pipeline/stages/05-images.test.ts` → PASS.

- [ ] **Step 3: Implement Geograph + Wikimedia clients (parsers exported for tests)**

Create `src/scripts/pipeline/sources/geograph.ts`:

```ts
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
```

Create `src/scripts/pipeline/sources/wikimedia.ts`:

```ts
// Wikimedia Commons geosearch. Licence varies per file; reject anything
// without a commercial+derivatives-friendly licence. Parser exported for tests.
import { fetchWithRetry } from '../lib/http'
import type { ImageCandidate } from '../types'

const ALLOWED_LICENSES = /^(CC0|CC-BY(-SA)?(-\d(\.\d)?)?|Public domain|PD)/i

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
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title ?? '')}`,
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
```

- [ ] **Step 4: Add the attribution page + footer link**

Create `src/app/data-attributions/page.tsx`:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data & Image Attributions',
  description: 'Open-data and image source licences used by Farm Companion.',
}

export default function DataAttributionsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 prose">
      <h1>Data &amp; Image Attributions</h1>
      <p>
        Farm Companion is built on open data. We credit our sources here in line
        with their licences.
      </p>
      <h2>Farm location data</h2>
      <ul>
        <li>
          Farm locations and tags &copy;{' '}
          <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>{' '}
          contributors, available under the Open Database License (ODbL).
        </li>
        <li>
          Business verification and addresses from the{' '}
          <a href="https://www.food.gov.uk/">Food Standards Agency</a> Food
          Hygiene Rating data, under the Open Government Licence (OGL).
        </li>
        <li>
          Postcode geocoding by <a href="https://postcodes.io/">postcodes.io</a>{' '}
          (ONS/OS OpenData, OGL).
        </li>
      </ul>
      <h2>Photography</h2>
      <ul>
        <li>
          Some place photographs are sourced from{' '}
          <a href="https://www.geograph.org.uk/">Geograph Britain and Ireland</a>{' '}
          under CC BY-SA 2.0; the photographer is credited on each image.
        </li>
        <li>
          Some photographs are sourced from{' '}
          <a href="https://commons.wikimedia.org/">Wikimedia Commons</a> under
          their respective Creative Commons or public-domain licences, credited
          per image.
        </li>
      </ul>
    </main>
  )
}
```

Locate the global footer and add a link. Run: `grep -rln "footer" src/components src/app --include=*.tsx | head`. In the footer's link list, add (matching existing link markup, e.g. a `Link` from `next/link` if that is the convention):

```tsx
<a href="/data-attributions">Data &amp; attributions</a>
```

- [ ] **Step 5: Verify tests + typecheck + route builds**

Run: `pnpm tsx --test src/scripts/pipeline/stages/05-images.test.ts && pnpm tsc --noEmit`
Expected: tests PASS, tsc clean. (Optional: add `parseGeograph`/`parseWikimedia` fixture tests in the Slice-C pattern.)

- [ ] **Step 6: Commit**

```bash
git add src/scripts/pipeline/sources/geograph.ts src/scripts/pipeline/sources/wikimedia.ts src/scripts/pipeline/stages/05-images.ts src/scripts/pipeline/stages/05-images.test.ts src/app/data-attributions/page.tsx
git add -p   # stage the footer edit
git commit -m "feat(pipeline): Slice G — CC image sourcing/ranking + /data-attributions"
```

---

## Slice H — Merge stage (wire policy to DB shape)

**Goal:** Build the live-DB view, run `matchExisting` + `mergeFarm` per candidate, emit a `ChangeSet`. No writes.

**Files:**
- Create: `src/scripts/pipeline/stages/06-merge.ts` (+ `06-merge.test.ts`)

- [ ] **Step 1: Write failing integration test (fixture candidates + fake rows → ChangeSet)**

Create `src/scripts/pipeline/stages/06-merge.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { DbFarm, NormalizedCandidate } from '../types'
import { buildChangeSet } from './06-merge'

const cand = (o: Partial<NormalizedCandidate>): NormalizedCandidate => ({
  fields: {}, categories: [], images: [], aiFallbackEligible: false, ...o,
})

test('new candidate with no DB match yields a create', () => {
  const cs = buildChangeSet(
    [cand({ osmId: 'node:1', slug: 'a', fields: { name: { value: 'A Farm', source: 'osm' } } })],
    [], '2026-05-23T00:00:00.000Z',
  )
  assert.equal(cs.length, 1)
  assert.equal(cs[0].action, 'create')
})

test('matched candidate with identical data yields a noop', () => {
  const rows: DbFarm[] = [{
    id: 'x', slug: 'a', osmId: 'node:1', fsaId: null, googlePlaceId: null,
    postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7,
    provenance: { name: { source: 'osm', at: 'x' } }, fields: { name: 'A Farm' },
  }]
  const cs = buildChangeSet([cand({ osmId: 'node:1', fields: { name: { value: 'A Farm', source: 'osm' } } })], rows, 'now')
  assert.equal(cs[0].action, 'noop')
})

test('matched candidate with a higher-source field change yields an update', () => {
  const rows: DbFarm[] = [{
    id: 'x', slug: 'a', osmId: null, fsaId: '999', googlePlaceId: null,
    postcode: 'TQ11 0JU', latitude: 50.5, longitude: -3.7,
    provenance: { address: { source: 'osm', at: 'x' } }, fields: { address: 'Old' },
  }]
  const cs = buildChangeSet([cand({ fsaId: '999', fields: { address: { value: 'New Barn', source: 'fsa' } } })], rows, 'now')
  assert.equal(cs[0].action, 'update')
  assert.equal(cs[0].fields[0].to, 'New Barn')
})
```

- [ ] **Step 2: Run to verify FAIL, then implement merge stage**

Create `src/scripts/pipeline/stages/06-merge.ts`:

```ts
// Stage 06: diff candidates against the live DB using the pure merge policy.
// Reads the DB read-only; emits a ChangeSet. No writes.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import { matchExisting, mergeFarm } from '../policy/merge-policy'
import type { ChangeSet, DbFarm, FarmFieldName, NormalizedCandidate } from '../types'

/** Pure: build the change set from candidates + a DB snapshot. */
export function buildChangeSet(
  candidates: NormalizedCandidate[],
  rows: DbFarm[],
  now: string,
): ChangeSet {
  return candidates.map((c) => {
    const { match, matchKey } = matchExisting(c, rows)
    const change = mergeFarm(match, c, now)
    if (matchKey === 'fuzzy') change.matchKey = 'fuzzy'
    return change
  })
}

const FIELD_NAMES: FarmFieldName[] = [
  'name', 'description', 'address', 'city', 'county', 'postcode',
  'latitude', 'longitude', 'phone', 'email', 'website', 'openingHours', 'status', 'verified',
]

/** Load a minimal read-only DB snapshot via Prisma. */
export async function loadDbSnapshot(prisma: {
  farm: { findMany: (args: unknown) => Promise<Record<string, unknown>[]> }
}): Promise<DbFarm[]> {
  const rows = await prisma.farm.findMany({ select: {
    id: true, slug: true, osmId: true, fsaId: true, googlePlaceId: true,
    postcode: true, latitude: true, longitude: true, provenance: true,
    name: true, description: true, address: true, city: true, county: true,
    phone: true, email: true, website: true, openingHours: true, status: true, verified: true,
  } }) as Record<string, unknown>[]

  return rows.map((r) => {
    const fields: DbFarm['fields'] = {}
    for (const f of FIELD_NAMES) {
      const v = r[f]
      if (v === undefined) continue
      fields[f] = (v !== null && typeof v === 'object' && 'toNumber' in v)
        ? (v as { toNumber(): number }).toNumber() // Prisma.Decimal -> number
        : v
    }
    return {
      id: String(r.id), slug: String(r.slug),
      osmId: (r.osmId as string) ?? null, fsaId: (r.fsaId as string) ?? null,
      googlePlaceId: (r.googlePlaceId as string) ?? null,
      postcode: (r.postcode as string) ?? null,
      latitude: (fields.latitude as number) ?? null,
      longitude: (fields.longitude as number) ?? null,
      provenance: (r.provenance as DbFarm['provenance']) ?? null,
      fields,
    }
  })
}

export async function runMerge(): Promise<ChangeSet> {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const candidates = JSON.parse(readFileSync(resolve(dir, '05-images.json'), 'utf8')) as NormalizedCandidate[]
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const rows = await loadDbSnapshot(prisma as never)
    const cs = buildChangeSet(candidates, rows, new Date().toISOString())
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, '06-merge.json'), JSON.stringify(cs, null, 2))
    const counts = cs.reduce((acc, c) => { acc[c.action]++; return acc }, { create: 0, update: 0, noop: 0 } as Record<string, number>)
    log('info', 'merge complete', { stage: '06', ...counts })
    return cs
  } finally {
    await prisma.$disconnect()
  }
}
```

- [ ] **Step 3: Run to verify pass + typecheck**

Run: `pnpm tsx --test src/scripts/pipeline/stages/06-merge.test.ts && pnpm tsc --noEmit`
Expected: PASS, tsc clean.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/pipeline/stages/06-merge.ts src/scripts/pipeline/stages/06-merge.test.ts
git commit -m "feat(pipeline): Slice H — merge stage (policy wired to DB snapshot)"
```

---

## Slice I — Load (dry-run-first apply)

**Goal:** Apply a `ChangeSet`, dry-run by default (zero writes), idempotent on re-run, with a `RunReport`. No `--force`.

**Files:**
- Create: `src/scripts/pipeline/stages/07-load.ts` (+ `07-load.test.ts`)

- [ ] **Step 1: Write failing load test against a mock Prisma client**

Create `src/scripts/pipeline/stages/07-load.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { ChangeSet } from '../types'
import { applyChangeSet } from './07-load'

function mockPrisma() {
  const calls: string[] = []
  return {
    calls,
    farm: {
      create: async () => { calls.push('create'); return { id: 'new' } },
      update: async () => { calls.push('update'); return { id: 'upd' } },
    },
  }
}

const changeSet: ChangeSet = [
  { action: 'create', matchKey: null, slug: 'a', fields: [{ field: 'name', from: null, to: 'A', reason: 'create' }], provenanceNext: { name: { source: 'osm', at: 'x' } } },
  { action: 'update', matchKey: 'b', slug: 'b', fields: [{ field: 'address', from: 'old', to: 'new', reason: 'r' }], provenanceNext: {} },
  { action: 'noop', matchKey: 'c', slug: 'c', fields: [], provenanceNext: {} },
]

test('dry-run performs ZERO writes', async () => {
  const prisma = mockPrisma()
  const report = await applyChangeSet(changeSet, prisma as never, { apply: false })
  assert.deepEqual(prisma.calls, [])
  assert.equal(report.created, 1)
  assert.equal(report.updated, 1)
  assert.equal(report.noop, 1)
})

test('apply performs create+update but never touches noop rows', async () => {
  const prisma = mockPrisma()
  await applyChangeSet(changeSet, prisma as never, { apply: true })
  assert.deepEqual(prisma.calls.sort(), ['create', 'update'])
})

test('idempotent re-run: an all-noop change set writes nothing even with --apply', async () => {
  const prisma = mockPrisma()
  const allNoop: ChangeSet = changeSet.map((c) => ({ ...c, action: 'noop' as const, fields: [] }))
  await applyChangeSet(allNoop, prisma as never, { apply: true })
  assert.deepEqual(prisma.calls, [])
})
```

- [ ] **Step 2: Run to verify FAIL, then implement load**

Create `src/scripts/pipeline/stages/07-load.ts`:

```ts
// Stage 07: apply a ChangeSet. Dry-run by default (zero writes). No --force.
// Writes only create/update actions; noop never touches the DB (idempotency).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import type { ChangeSet, FarmChange, RunReport } from '../types'

interface MinimalPrisma {
  farm: {
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
  }
}

function emptyReport(): RunReport {
  return {
    created: 0, updated: 0, noop: 0, skipped: 0,
    imagesAttached: 0, categoriesLinked: 0, errors: 0, byField: {},
    startedAt: new Date().toISOString(), finishedAt: '',
  }
}

function buildData(change: FarmChange): Record<string, unknown> {
  const data: Record<string, unknown> = { provenance: change.provenanceNext }
  for (const diff of change.fields) data[diff.field] = diff.to
  return data
}

export async function applyChangeSet(
  changeSet: ChangeSet,
  prisma: MinimalPrisma,
  opts: { apply: boolean },
): Promise<RunReport> {
  const report = emptyReport()
  for (const change of changeSet) {
    try {
      if (change.action === 'noop') { report.noop++; continue }
      for (const diff of change.fields) report.byField[diff.field] = (report.byField[diff.field] ?? 0) + 1

      if (change.action === 'create') {
        report.created++
        if (opts.apply) await prisma.farm.create({ data: buildData(change) })
      } else if (change.action === 'update') {
        report.updated++
        if (opts.apply) await prisma.farm.update({ where: { slug: change.matchKey }, data: buildData(change) })
      }
    } catch (e) {
      report.errors++
      log('error', 'load row failed', { stage: '07', slug: change.slug, error: e instanceof Error ? e.message : String(e) })
    }
  }
  report.finishedAt = new Date().toISOString()
  log('info', opts.apply ? 'load applied' : 'load dry-run', {
    stage: '07', created: report.created, updated: report.updated, noop: report.noop, errors: report.errors,
  })
  return report
}

export async function runLoad(opts: { apply: boolean }): Promise<RunReport> {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const cs = JSON.parse(readFileSync(resolve(dir, '06-merge.json'), 'utf8')) as ChangeSet
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const report = await applyChangeSet(cs, prisma as never, opts)
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, `run-report-${Date.now()}.json`), JSON.stringify(report, null, 2))
    return report
  } finally {
    await prisma.$disconnect()
  }
}
```

> Note: this slice writes only Farm scalar fields + provenance. Category linking and image rows reuse the existing additive upsert pattern (`import-farms.ts:373-387` for categories; the Image model for CC images with `license`/`attribution`/`sourceUrl`); wire them in Slice J Step 6 once the end-to-end dry-run shape is confirmed, to keep this slice under the LOC budget.

- [ ] **Step 3: Run to verify pass + typecheck**

Run: `pnpm tsx --test src/scripts/pipeline/stages/07-load.test.ts && pnpm tsc --noEmit`
Expected: PASS (3 tests), tsc clean.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/pipeline/stages/07-load.ts src/scripts/pipeline/stages/07-load.test.ts
git commit -m "feat(pipeline): Slice I — dry-run-first idempotent load (stage 07)"
```

---

## Slice J — Orchestrator + retire Python pipeline

**Goal:** A `run.ts` chaining stages with `--from/--to/--dry-run/--limit/--apply`, a full-suite green check, retiring `farm-pipeline/`, and ledger/spec reconciliation.

**Files:**
- Create: `src/scripts/pipeline/run.ts`
- Modify: `package.json` (add `pipeline` script)
- Modify: `docs/assistant/execution-ledger.md`
- Modify: `docs/superpowers/specs/2026-05-23-farm-data-pipeline-redesign.md` (DRAFT → CANONICAL)
- Delete/retire: `farm-pipeline/` (operator-confirmed)

- [ ] **Step 1: Implement the orchestrator**

Create `src/scripts/pipeline/run.ts`:

```ts
#!/usr/bin/env tsx
// Pipeline orchestrator. Chains stages 01..07 with range + safety flags.
//   pnpm pipeline --from 1 --to 5         # read side only, no DB
//   pnpm pipeline --dry-run               # full chain, load is dry-run
//   pnpm pipeline --apply --limit 50      # apply a small batch
import { config } from 'dotenv'
import { resolve } from 'node:path'
config({ path: resolve(process.cwd(), '.env.local'), override: true })
config({ path: resolve(process.cwd(), '.env') })

import { discover } from './stages/01-discover'
import { runNormalize } from './stages/02-normalize'
import { runGeocode } from './stages/03-geocode'
import { runEnrich } from './stages/04-enrich'
import { runImages } from './stages/05-images'
import { runMerge } from './stages/06-merge'
import { runLoad } from './stages/07-load'
import { log } from './lib/log'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
function flag(name: string): boolean { return process.argv.includes(`--${name}`) }

async function main() {
  const from = Number(arg('from') ?? '1')
  const to = Number(arg('to') ?? '7')
  const limit = arg('limit') ? Number(arg('limit')) : undefined
  const apply = flag('apply')
  const inRange = (n: number) => n >= from && n <= to

  if (inRange(1)) await discover({ limit })
  if (inRange(2)) runNormalize()
  if (inRange(3)) await runGeocode()
  if (inRange(4)) runEnrich()
  if (inRange(5)) runImages()
  if (inRange(6)) await runMerge()
  if (inRange(7)) {
    const report = await runLoad({ apply })
    log('info', 'run report', { ...report })
    if (!apply) log('warn', 'DRY RUN — no writes. Re-run with --apply to persist.', {})
  }
}

main().catch((e) => {
  log('error', 'pipeline failed', { error: e instanceof Error ? e.message : String(e) })
  process.exitCode = 1
})
```

- [ ] **Step 2: Add the pnpm script**

In `package.json` scripts (after `"generate:pitti"`, line 15), add:

```json
    "pipeline": "tsx src/scripts/pipeline/run.ts",
```

- [ ] **Step 3: Full verification gate**

Run: `pnpm tsc --noEmit && pnpm test:unit`
Expected: tsc clean; entire unit suite (existing + all pipeline tests) green.

- [ ] **Step 4: OPERATOR STEP — full dry-run sanity check**

- Step J4 — confirm an end-to-end dry-run produces a readable RunReport
- Owner: you (operator)
- Action: from `farm-frontend/`, run `pnpm pipeline --dry-run --limit 50`.
- Verify: `.pipeline/run-report-*.json` exists; `created/updated/noop/byField` look sane; `errors` is 0; row counts unchanged via `pnpm tsx src/scripts/check-image-schema.ts` (no writes occurred).
- Reply: paste the run-report summary.

- [ ] **Step 5: OPERATOR STEP — authorize Python retirement**

- Step J5 — retire `farm-pipeline/`
- Owner: you (operator)
- Action: confirm the Python pipeline is no longer referenced by any deploy/cron, then authorize deletion.
- Verify: `grep -rn "farm-pipeline" --include=*.json --include=*.yml --include=*.yaml --include=*.ts .` returns no live references.
- Reply: "authorize farm-pipeline removal" or list blockers.

- [ ] **Step 6: Retire Python + wire category/image writes + reconcile docs (after operator authorizes)**

```bash
git rm -r farm-pipeline/
```

Wire category linking and CC image rows into `07-load.ts` using the existing additive `farmCategory.upsert` pattern from `import-farms.ts:373-387` and an `image.create` for each attachable CC image (populating `source`, `license`, `attribution`, `sourceUrl`). Keep dry-run gating (`if (opts.apply)`). Add a `07-load.test.ts` case asserting dry-run still performs zero category/image writes.

In `docs/superpowers/specs/2026-05-23-farm-data-pipeline-redesign.md`, change the status line from `DRAFT for operator review` to `CANONICAL (implemented A–J, 2026-05-23)`.

In `docs/assistant/execution-ledger.md`, update the Open Work Snapshot: move "Farm data pipeline redesign" from active arc to a closed track listing slices A–J, and note `import-farms.ts` + `farm-pipeline/` retired, superseded by `pipeline/run.ts`.

- [ ] **Step 7: Final verification + commit**

Run: `pnpm tsc --noEmit && pnpm test:unit`
Expected: tsc clean, all tests green.

```bash
git add src/scripts/pipeline/run.ts src/scripts/pipeline/stages/07-load.ts src/scripts/pipeline/stages/07-load.test.ts package.json docs/superpowers/specs docs/assistant/execution-ledger.md
git commit -m "feat(pipeline): Slice J — orchestrator, category/image writes, retire Python, reconcile docs"
```

---

## Self-Review

**1. Spec coverage:**
- §3 directory layout → File Structure + Slices A–J create every listed file. ✓
- §4 sources (OSM, FSA, postcodes.io, Geograph, Wikimedia, Google hours seam) → Slices C, E, G, F. ✓
- §4.7 source precedence → `SOURCE_PRECEDENCE` (A), enforced by merge policy (B). ✓
- §5 provenance model → additive schema (A); `provenance` written on every accepted field (B mergeFarm, I buildData). ✓
- §5.3 migration approach (`db push`, never `migrate dev`) → Slice A Step 6 operator step uses `db push`. ✓
- §6 merge rules 1–7 + §6.3 matching → Slice B tests cover each rule plus the locked 150m / 0.85 / same-postcode fuzzy gate. ✓
- §6.4 image merge (attribution-required, AI fallback) → Slice G `attachableImages`/`decideImages`. ✓
- §7 stage contracts → stages 01–07 each read prior artifact, write own (C–I). ✓
- §8 safety (dry-run-first, no `--force`, retries/backoff, structured logging) → `http.ts`, `log.ts` (C), `07-load` dry-run default (I). ✓
- §9 A–J mapping → one-to-one. ✓
- §10 testing (pure-first, fixtures over network, mocked load) → every pure module test-first; clients tested on fixtures; load on mock Prisma. ✓
- §11 OL-1 attribution → `/data-attributions` + footer link (G); share-alike-publish question left documented (non-blocking). ✓
- §12 reconciliation + §14 DoD → Slice J. ✓

**2. Placeholder scan:** No "TBD"/"implement later" left as the substance of a step. The one deliberately-unimplemented body is the Google hours seam, which the spec (§4.6) requires to be OFF/no-op by default — its test asserts it does not fetch. The footer-link step uses `grep` to locate the project's footer because its exact path is not pre-known; the link markup is given.

**3. Type consistency:** `RawFarmCandidate`, `NormalizedCandidate`, `DbFarm`, `FarmChange`, `ChangeSet`, `RunReport`, `ImageCandidate`, `SourceName`, `SOURCE_PRECEDENCE`, `FieldProvenance`, `TaggedValue` are defined once in Slice A and referenced unchanged thereafter. `NormalizedCandidate.tags` is defined in A and populated in D (`toNormalized`), read in F (`enrich`). `mergeFarm(existing, incoming, now)` and `matchExisting(incoming, rows)` signatures are stable across B, H. `calculateDistance` (km) is reused from `shared/lib/geo.ts` in B and D. `rankImages`/`attachableImages`/`decideImages` names match across G's test and impl. `applyChangeSet`/`buildChangeSet`/`buildData` consistent across H, I.

**Known follow-ups recorded for execution (not gaps):** category-link and CC-image-row writes are deferred from Slice I to Slice J Step 6 to respect the per-slice LOC budget; the existing `import-farms.ts` upsert pattern is the reference. `fetchGeograph`/`fetchWikimedia` are wired into `05-images` during execution at the point coordinates are available per-candidate (left to the implementer since it depends on whether image fetching runs inline in stage 05 or as a pre-pass; the pure ranking/gating core is fully specified and tested).
