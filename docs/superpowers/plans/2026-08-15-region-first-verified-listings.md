# Region-First Verified Listings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the site claiming that food producers are visitable farm shops, and give the listings that genuinely are shops real opening hours.

**Architecture:** A pure evidence-graph classifier decides `venueType` from which sources corroborate a candidate, enforcing one invariant: FSA evidence alone can never admit a listing. A pure OSM `opening_hours` parser converts to the shape `formatOpeningStatus` already consumes. Two pure gate predicates decide whether a page may make a visitability claim and whether it may be indexed. Because `venueType` defaults to `unknown`, shipping the gate silences every unverified page immediately, before any per-region work.

**Tech Stack:** TypeScript, `tsx --test` (node:test + node:assert/strict), Prisma (Postgres on Hetzner), Next.js App Router, existing pipeline under `farm-frontend/src/scripts/pipeline/`.

**Relationship to `2026-05-26-non-farm-contamination.md`:** that plan shipped and solved a different problem, national retail *chains* (Farmfoods, Tesco) via the `isNonFarmChain` denylist. This plan addresses *producers* (dairies, poultry keepers, farming partnerships), which is 65.2% of rows and cannot be enumerated in a denylist. Its own Self-Review flagged exactly this residual: "a name denylist still misses unknown chains". The evidence graph generalises it. Both filters coexist; neither replaces the other.

## Global Constraints

- Package manager is **pnpm** (`farm-frontend/pnpm-lock.yaml`). All commands run from `farm-frontend/`.
- Tests use `node:test` + `node:assert/strict`, matching every existing pipeline test. Full suite: `pnpm test:unit`.
- Source files: soft 300 lines, hard 500 (needs a `// rationale:` header), forbidden 800. Tests get 2x.
- **No em dashes, no emojis** in code, comments, copy, or commit messages.
- Max 8 files touched per slice; max 300 changed lines excluding deletions and docs.
- `OpeningHours` is `{ day: string; open: string; close: string }` and `isCurrentlyOpen` matches `day.toLowerCase()` against `toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()`. **`day` must be a full English weekday name** ("Monday"), never an OSM abbreviation ("Mo").
- Never claim more certainty than the data supports (PRODUCT.md).

---

## File Structure

- `farm-frontend/src/scripts/pipeline/lib/parse-osm-hours.ts` (CREATE): one responsibility: OSM `opening_hours` string to `OpeningHours[] | null`.
- `farm-frontend/src/scripts/pipeline/lib/parse-osm-hours.test.ts` (CREATE)
- `farm-frontend/src/scripts/pipeline/lib/classify-venue.ts` (CREATE): one responsibility: evidence set to `VenueType`.
- `farm-frontend/src/scripts/pipeline/lib/classify-venue.test.ts` (CREATE)
- `farm-frontend/src/lib/farm-claims.ts` (CREATE): one responsibility: may this page make a claim, and may it be indexed.
- `farm-frontend/src/lib/farm-claims.test.ts` (CREATE)
- `farm-frontend/prisma/schema.prisma` (MODIFY): two nullable fields.
- `farm-frontend/src/scripts/pipeline/types.ts` (MODIFY): `VenueType`, `FarmFieldName += 'venueType'`.
- `farm-frontend/src/scripts/pipeline/stages/02-normalize.ts` (MODIFY): parse hours.
- `farm-frontend/src/scripts/pipeline/stages/06-merge.ts` (MODIFY): classify, extend `FIELD_NAMES` and the snapshot select.
- `farm-frontend/src/app/shop/[slug]/page.tsx` (MODIFY): apply both gates.
- `farm-frontend/src/scripts/backfill-false-descriptions.ts` (CREATE): reversible, dry-run by default.
- `farm-frontend/src/scripts/select-region.ts` (CREATE): read-only ranking report.

---

## Task 1: Venue type and schema fields

**Files:**
- Modify: `farm-frontend/src/scripts/pipeline/types.ts`
- Modify: `farm-frontend/prisma/schema.prisma`

**Interfaces:**
- Produces: `type VenueType = 'shop' | 'pyo' | 'market_stall' | 'producer_no_public_access' | 'unknown'`, and `'venueType'` as a member of `FarmFieldName`.

- [ ] **Step 1: Add the type**

In `types.ts`, directly above the existing `FarmFieldName` declaration:

```ts
/**
 * What a listing physically is, from the visitor's point of view.
 * The inclusion rule admits 'shop' | 'pyo' | 'market_stall'.
 * 'unknown' is the honest default and never makes a visitability claim.
 */
export type VenueType =
  | 'shop'
  | 'pyo'
  | 'market_stall'
  | 'producer_no_public_access'
  | 'unknown'

/** The venue types a listing may claim public access for. */
export const ADMITTED_VENUE_TYPES: ReadonlySet<VenueType> = new Set<VenueType>([
  'shop', 'pyo', 'market_stall',
])
```

- [ ] **Step 2: Add `venueType` to the mergeable field union**

In `types.ts`, change the `FarmFieldName` union's last line from:

```ts
  | 'openingHours' | 'status' | 'verified'
```

to:

```ts
  | 'openingHours' | 'status' | 'verified' | 'venueType'
```

- [ ] **Step 3: Add the Prisma fields**

In `schema.prisma`, inside `model Farm`, immediately after the `openingHours Json?` line:

```prisma
  // Venue classification (2026-08-15). FSA's "Farmers/growers" category
  // identifies producers, not premises the public can enter, so venue type is
  // tracked separately and defaults to unknown. Only venueVerifiedAt gates a
  // visitability claim; the older `verified` flag is reserved for owner
  // confirmation and is not read by the claim gate.
  venueType       String?   @db.VarChar(32)
  venueVerifiedAt DateTime?
```

Then add `@@index([venueType])` alongside the existing `@@index` entries at the bottom of the model, not mid-model.

- [ ] **Step 4: Verify schema and types**

Run: `cd farm-frontend && pnpm prisma validate && pnpm prisma migrate dev --name add_venue_classification --create-only && npx tsc --noEmit`
Expected: `The schema at prisma/schema.prisma is valid`, a migration file created under `prisma/migrations/`, and tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add farm-frontend/src/scripts/pipeline/types.ts farm-frontend/prisma/schema.prisma farm-frontend/prisma/migrations
git commit -m "feat(schema): venue classification fields, defaulting to unknown"
```

---

## Task 2: OSM opening_hours parser

**Files:**
- Create: `farm-frontend/src/scripts/pipeline/lib/parse-osm-hours.ts`
- Test: `farm-frontend/src/scripts/pipeline/lib/parse-osm-hours.test.ts`

**Interfaces:**
- Consumes: `OpeningHours` from `@/lib/opening-hours`.
- Produces: `parseOsmHours(raw: string | undefined): OpeningHours[] | null`.

- [ ] **Step 1: Write the failing test**

```ts
// farm-frontend/src/scripts/pipeline/lib/parse-osm-hours.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseOsmHours } from './parse-osm-hours'

test('parses a weekday range', () => {
  assert.deepEqual(parseOsmHours('Mo-We 09:00-17:00'), [
    { day: 'Monday', open: '09:00', close: '17:00' },
    { day: 'Tuesday', open: '09:00', close: '17:00' },
    { day: 'Wednesday', open: '09:00', close: '17:00' },
  ])
})

test('parses a full week, the most common real value', () => {
  const out = parseOsmHours('Mo-Su 09:00-17:00')
  assert.equal(out?.length, 7)
  assert.equal(out?.[0].day, 'Monday')
  assert.equal(out?.[6].day, 'Sunday')
})

test('parses semicolon-separated rules and a comma day list', () => {
  assert.equal(parseOsmHours('Mo-Sa 09:00-17:00; Su 10:00-16:00')?.length, 7)
  assert.deepEqual(parseOsmHours('Sa,Su 10:00-16:00'), [
    { day: 'Saturday', open: '10:00', close: '16:00' },
    { day: 'Sunday', open: '10:00', close: '16:00' },
  ])
})

test('parses 24/7 as every day', () => {
  const out = parseOsmHours('24/7')
  assert.equal(out?.length, 7)
  assert.deepEqual(out?.[0], { day: 'Monday', open: '00:00', close: '23:59' })
})

test('a later rule overrides an earlier one for the same day', () => {
  const out = parseOsmHours('Mo-Su 09:00-17:00; Su 11:00-15:00')
  assert.deepEqual(out?.find((h) => h.day === 'Sunday'), {
    day: 'Sunday', open: '11:00', close: '15:00',
  })
})

// --- Rejection: unsupported syntax must yield null, never a partial parse ---
test('rejects seasonal, holiday, and open-ended syntax', () => {
  assert.equal(parseOsmHours('Apr-Sep Mo-Su 09:00-18:00'), null)
  assert.equal(parseOsmHours('Mo-Sa 09:00-17:00; PH off'), null)
  assert.equal(parseOsmHours('Mo-Fr 09:00+'), null)
  assert.equal(parseOsmHours('sunrise-sunset'), null)
  assert.equal(parseOsmHours('by appointment'), null)
})

test('rejects empty, undefined, and malformed input', () => {
  assert.equal(parseOsmHours(undefined), null)
  assert.equal(parseOsmHours(''), null)
  assert.equal(parseOsmHours('Mo-We'), null)
  assert.equal(parseOsmHours('Xx-Yy 09:00-17:00'), null)
  assert.equal(parseOsmHours('Mo 25:00-17:00'), null)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/lib/parse-osm-hours.test.ts`
Expected: FAIL with "Cannot find module './parse-osm-hours'".

- [ ] **Step 3: Write minimal implementation**

```ts
// farm-frontend/src/scripts/pipeline/lib/parse-osm-hours.ts
// OSM `opening_hours` to the OpeningHours shape the site already consumes.
//
// Deliberately supports a narrow subset and returns null for everything else.
// A wrong "Open now" badge sends someone on a wasted drive, which is the exact
// failure this product exists to prevent, so an unparseable string is silence
// rather than a guess. Unsupported on purpose: seasonal ranges (Apr-Sep),
// public holidays (PH), open-ended times (09:00+), variable times
// (sunrise-sunset), and free text.
import type { OpeningHours } from '@/lib/opening-hours'

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const

const OSM_DAY_INDEX: Readonly<Record<string, number>> = {
  Mo: 0, Tu: 1, We: 2, Th: 3, Fr: 4, Sa: 5, Su: 6,
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const RULE = /^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/

/** Expand "Mo-We" or "Sa,Su" or "Mo" into day indices. Null if unrecognised. */
function expandDays(spec: string): number[] | null {
  const out: number[] = []
  for (const part of spec.split(',')) {
    const range = part.split('-')
    if (range.length === 1) {
      const i = OSM_DAY_INDEX[range[0]]
      if (i === undefined) return null
      out.push(i)
    } else if (range.length === 2) {
      const from = OSM_DAY_INDEX[range[0]]
      const to = OSM_DAY_INDEX[range[1]]
      if (from === undefined || to === undefined) return null
      for (let i = from; ; i = (i + 1) % 7) {
        out.push(i)
        if (i === to) break
      }
    } else {
      return null
    }
  }
  return out
}

/**
 * Parse an OSM opening_hours string.
 * Returns null when the value uses syntax outside the supported subset.
 * Later rules override earlier ones for the same day, matching OSM semantics.
 */
export function parseOsmHours(raw: string | undefined): OpeningHours[] | null {
  if (!raw) return null
  const value = raw.trim()
  if (!value) return null

  if (value === '24/7') {
    return DAYS.map((day) => ({ day, open: '00:00', close: '23:59' }))
  }

  const byDay = new Map<number, { open: string; close: string }>()
  for (const rule of value.split(';')) {
    const trimmed = rule.trim()
    if (!trimmed) continue
    const m = RULE.exec(trimmed)
    if (!m) return null
    const [, daySpec, open, close] = m
    if (!TIME.test(open) || !TIME.test(close)) return null
    const days = expandDays(daySpec)
    if (days === null) return null
    for (const d of days) byDay.set(d, { open, close })
  }

  if (byDay.size === 0) return null
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([i, t]) => ({ day: DAYS[i], open: t.open, close: t.close }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/lib/parse-osm-hours.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add farm-frontend/src/scripts/pipeline/lib/parse-osm-hours.ts farm-frontend/src/scripts/pipeline/lib/parse-osm-hours.test.ts
git commit -m "feat(pipeline): OSM opening_hours parser, null on unsupported syntax"
```

---

## Task 3: Venue classifier

**Files:**
- Create: `farm-frontend/src/scripts/pipeline/lib/classify-venue.ts`
- Test: `farm-frontend/src/scripts/pipeline/lib/classify-venue.test.ts`

**Interfaces:**
- Consumes: `VenueType` from `../types` (Task 1).
- Produces: `classifyVenue(e: VenueEvidence): VenueTier`, where
  `interface VenueEvidence { osmShopFarm: boolean; osmOpeningHours: boolean; fsaFarmType: boolean; retailLexeme: boolean; websiteRetailSignal: boolean; placesRetailWithHours: boolean }`
  and `interface VenueTier { tier: 'A' | 'B' | 'C'; venueType: VenueType }`.
  Also `hasRetailLexeme(name: string | undefined): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
// farm-frontend/src/scripts/pipeline/lib/classify-venue.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyVenue, hasRetailLexeme, type VenueEvidence } from './classify-venue'

const ev = (o: Partial<VenueEvidence> = {}): VenueEvidence => ({
  osmShopFarm: false, osmOpeningHours: false, fsaFarmType: false,
  retailLexeme: false, websiteRetailSignal: false, placesRetailWithHours: false,
  ...o,
})

test('Tier A needs a retail tag plus evidence of public opening', () => {
  assert.deepEqual(classifyVenue(ev({ osmShopFarm: true, osmOpeningHours: true })),
    { tier: 'A', venueType: 'shop' })
  assert.deepEqual(classifyVenue(ev({ osmShopFarm: true, placesRetailWithHours: true })),
    { tier: 'A', venueType: 'shop' })
})

test('Tier B is a review candidate, never an admitted type', () => {
  assert.deepEqual(classifyVenue(ev({ osmShopFarm: true })),
    { tier: 'B', venueType: 'unknown' })
  assert.deepEqual(classifyVenue(ev({ retailLexeme: true, websiteRetailSignal: true })),
    { tier: 'B', venueType: 'unknown' })
})

test('a retail lexeme alone is not enough for Tier B', () => {
  assert.equal(classifyVenue(ev({ retailLexeme: true })).tier, 'C')
})

// --- THE INVARIANT. This test is the trust rule made executable. ---
test('INVARIANT: FSA evidence alone never admits a listing', () => {
  const combos: VenueEvidence[] = [
    ev({ fsaFarmType: true }),
    ev({ fsaFarmType: true, retailLexeme: true }),
  ]
  for (const e of combos) {
    const r = classifyVenue(e)
    assert.equal(r.venueType, 'unknown', `FSA-only combo admitted: ${JSON.stringify(e)}`)
    assert.equal(r.tier, 'C')
  }
})

test('INVARIANT holds across every evidence combination without OSM or Places', () => {
  for (const fsaFarmType of [true, false]) {
    for (const retailLexeme of [true, false]) {
      for (const websiteRetailSignal of [true, false]) {
        const r = classifyVenue(ev({ fsaFarmType, retailLexeme, websiteRetailSignal }))
        assert.equal(
          r.venueType, 'unknown',
          `admitted without OSM/Places: ${JSON.stringify({ fsaFarmType, retailLexeme, websiteRetailSignal })}`,
        )
      }
    }
  }
})

test('retail lexeme detection is case-insensitive and word-bounded', () => {
  assert.equal(hasRetailLexeme('Berry Hill Farm Shop'), true)
  assert.equal(hasRetailLexeme("Lathy's Farmshop"), true)
  assert.equal(hasRetailLexeme('Longridge Farm Produce'), true)
  assert.equal(hasRetailLexeme('Mr D & Mrs H Harries'), false)
  assert.equal(hasRetailLexeme('Ardenlodge Poultry'), false)
  assert.equal(hasRetailLexeme('Ben Heath'), false)
  assert.equal(hasRetailLexeme(undefined), false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/lib/classify-venue.test.ts`
Expected: FAIL with "Cannot find module './classify-venue'".

- [ ] **Step 3: Write minimal implementation**

```ts
// farm-frontend/src/scripts/pipeline/lib/classify-venue.ts
// Decide what a listing physically is, from typed evidence rather than from
// whichever source happened to arrive last.
//
// The governing invariant: no path to an admitted venueType may consist solely
// of FSA evidence. FSA businessTypeId 7838 is "Farmers/growers", a producer
// classification, so it proves the business grows things and says nothing about
// whether the public can visit. Tiers are discrete rather than weighted because
// weights are unfalsifiable and tiers are testable.
import type { VenueType } from '../types'

export interface VenueEvidence {
  /** E1: OSM shop=farm. Retail tag. */
  osmShopFarm: boolean
  /** E2: OSM opening_hours present. Public access with stated times. */
  osmOpeningHours: boolean
  /** E3: FSA businessTypeId 7838. Production only. Never admits on its own. */
  fsaFarmType: boolean
  /** E4: name contains a retail lexeme. Weak. */
  retailLexeme: boolean
  /** E5: website mentions visiting, opening times, or a shop. Medium. */
  websiteRetailSignal: boolean
  /** E6: Places retail type AND regular_opening_hours. Strong. */
  placesRetailWithHours: boolean
}

export interface VenueTier {
  /** A: auto-classify. B: review candidate. C: no venue evidence. */
  tier: 'A' | 'B' | 'C'
  venueType: VenueType
}

// Fixed and case-insensitive. Changing this set changes the measured 34.8%
// match rate against live data and requires re-measuring.
const RETAIL_LEXEMES: readonly string[] = [
  'shop', 'farmshop', 'store', 'stores', 'market', 'deli', 'butcher', 'dairy',
  'bakery', 'creamery', 'cafe', 'kitchen', 'pantry', 'larder', 'produce',
  'nursery', 'garden',
]

const LEXEME_RE = new RegExp(`\\b(${RETAIL_LEXEMES.join('|')})\\b`, 'i')

/** True when a business name contains a whole-word retail lexeme. */
export function hasRetailLexeme(name: string | undefined): boolean {
  return name ? LEXEME_RE.test(name) : false
}

/**
 * Classify from evidence.
 *
 * Only Tier A yields an admitted venueType, and even then a human must set
 * venueVerifiedAt before any page may make a visitability claim. Tier B exists
 * solely to order the human review backlog; it never writes an admitted type.
 */
export function classifyVenue(e: VenueEvidence): VenueTier {
  if (e.osmShopFarm && (e.osmOpeningHours || e.placesRetailWithHours)) {
    return { tier: 'A', venueType: 'shop' }
  }
  if (e.osmShopFarm || (e.retailLexeme && (e.websiteRetailSignal || e.placesRetailWithHours))) {
    return { tier: 'B', venueType: 'unknown' }
  }
  return { tier: 'C', venueType: 'unknown' }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/lib/classify-venue.test.ts`
Expected: PASS, all cases including both invariant tests.

- [ ] **Step 5: Commit**

```bash
git add farm-frontend/src/scripts/pipeline/lib/classify-venue.ts farm-frontend/src/scripts/pipeline/lib/classify-venue.test.ts
git commit -m "feat(pipeline): evidence-graph venue classifier with FSA-alone invariant"
```

---

## Task 4: Parse hours during normalize

**Files:**
- Modify: `farm-frontend/src/scripts/pipeline/stages/02-normalize.ts`
- Test: `farm-frontend/src/scripts/pipeline/stages/02-normalize.test.ts`

**Interfaces:**
- Consumes: `parseOsmHours` from `../lib/parse-osm-hours` (Task 2).
- Produces: a normalized candidate whose `fields.openingHours` is `OpeningHours[]` when the raw string parses, and absent when it does not.

- [ ] **Step 1: Write the failing test** (append to the existing test file, reusing whatever helper that file already uses to build a `RawFarmCandidate`)

```ts
test('normalize converts a parseable OSM opening_hours into structured hours', () => {
  const [c] = normalize([{
    source: 'osm', sourceId: 'node:9', name: 'Test Farm Shop',
    latitude: 51, longitude: -1, openingHoursRaw: 'Mo-Fr 09:00-17:00', raw: {},
  }])
  assert.deepEqual(c.fields.openingHours?.value, [
    { day: 'Monday', open: '09:00', close: '17:00' },
    { day: 'Tuesday', open: '09:00', close: '17:00' },
    { day: 'Wednesday', open: '09:00', close: '17:00' },
    { day: 'Thursday', open: '09:00', close: '17:00' },
    { day: 'Friday', open: '09:00', close: '17:00' },
  ])
  assert.equal(c.fields.openingHours?.source, 'osm')
})

test('normalize omits openingHours entirely when the raw value cannot be parsed', () => {
  const [c] = normalize([{
    source: 'osm', sourceId: 'node:10', name: 'Test Farm Shop',
    latitude: 51, longitude: -1, openingHoursRaw: 'by appointment', raw: {},
  }])
  assert.equal(c.fields.openingHours, undefined)
})
```

The exported function is `normalize(raw: RawFarmCandidate[]): NormalizedCandidate[]` at `02-normalize.ts:90`. Import it if the test file does not already.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/stages/02-normalize.test.ts`
Expected: FAIL, `c.fields.openingHours` is undefined in the first test.

- [ ] **Step 3: Write minimal implementation**

In `02-normalize.ts`, add the import at the top:

```ts
import { parseOsmHours } from '../lib/parse-osm-hours'
```

Then in `toNormalized`, alongside the existing `set(...)` calls (after `set('website', raw.website)`), add:

```ts
  // Structured hours only when the OSM string parses cleanly. An unparseable
  // value is dropped rather than guessed: a wrong "Open now" is worse than none.
  // `set` already skips undefined via its tag() guard.
  set('openingHours', parseOsmHours(raw.openingHoursRaw) ?? undefined)
```

`toNormalized` is a module-private function in the same file; `set` is its
local helper `(f: FarmFieldName, v: unknown) => void` which tags the value with
the candidate's source. Do not hand-build the `TaggedValue`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/stages/02-normalize.test.ts`
Expected: PASS, and the pre-existing normalize tests still pass.

- [ ] **Step 5: Commit**

```bash
git add farm-frontend/src/scripts/pipeline/stages/02-normalize.ts farm-frontend/src/scripts/pipeline/stages/02-normalize.test.ts
git commit -m "feat(pipeline): structured opening hours from OSM during normalize"
```

---

## Task 5: Classify during merge

**Files:**
- Modify: `farm-frontend/src/scripts/pipeline/stages/06-merge.ts`
- Test: `farm-frontend/src/scripts/pipeline/stages/06-merge.test.ts`

**Interfaces:**
- Consumes: `classifyVenue`, `hasRetailLexeme` (Task 3); `FarmFieldName` including `'venueType'` (Task 1).
- Produces: change sets whose `fields` may include a `venueType` diff. `07-load` needs no change, because its `buildData` already iterates `change.fields` generically.

- [ ] **Step 1: Write the failing test** (append to the existing test file, reusing its `cand` helper)

```ts
test('merge assigns venueType shop when OSM tag and hours agree', () => {
  const cs = buildChangeSet(
    [cand({
      osmId: 'node:1', slug: 'a',
      fields: {
        name: { value: 'A Farm Shop', source: 'osm' },
        openingHours: { value: [{ day: 'Monday', open: '09:00', close: '17:00' }], source: 'osm' },
      },
    })],
    [], '2026-08-15T00:00:00.000Z',
  )
  const venue = cs[0].fields.find((f) => f.field === 'venueType')
  assert.equal(venue?.to, 'shop')
})

test('merge leaves venueType unknown for an FSA-only candidate', () => {
  const cs = buildChangeSet(
    [cand({ fsaId: '123', slug: 'b', fields: { name: { value: 'Mr D & Mrs H Harries', source: 'fsa' } } })],
    [], '2026-08-15T00:00:00.000Z',
  )
  const venue = cs[0].fields.find((f) => f.field === 'venueType')
  assert.equal(venue?.to ?? 'unknown', 'unknown')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/stages/06-merge.test.ts`
Expected: FAIL, no `venueType` diff is produced.

- [ ] **Step 3: Write minimal implementation**

In `06-merge.ts`, add the import:

```ts
import { classifyVenue, hasRetailLexeme } from '../lib/classify-venue'
```

Extend `FIELD_NAMES` (currently at line 26) to include `'venueType'` as the final entry:

```ts
const FIELD_NAMES: FarmFieldName[] = [
  'name', 'description', 'address', 'city', 'county', 'postcode',
  'latitude', 'longitude', 'phone', 'email', 'website', 'openingHours', 'status', 'verified',
  'venueType',
]
```

Add `venueType: true` and `venueVerifiedAt: true` to the `prisma.farm.findMany` select inside `loadDbSnapshot`.

In `buildChangeSet`, immediately after the existing `const change = mergeFarm(match, c, now)` line:

```ts
    // Venue classification. Only Tier A writes an admitted type; everything else
    // stays unknown so no page can claim visitability without a human.
    //
    // osmShopFarm infers from osmId because parseOverpass already rejects any
    // element without shop=farm, so an osmId implies the tag. If OSM discovery
    // ever widens beyond shop=farm, this inference breaks silently.
    const { venueType } = classifyVenue({
      osmShopFarm: Boolean(c.osmId),
      osmOpeningHours: Boolean(c.fields.openingHours),
      fsaFarmType: Boolean(c.fsaId),
      retailLexeme: hasRetailLexeme(c.fields.name?.value as string | undefined),
      websiteRetailSignal: false,
      placesRetailWithHours: false,
    })
    if (venueType !== 'unknown') {
      change.fields.push({
        field: 'venueType',
        from: match?.fields.venueType ?? null,
        to: venueType,
        reason: 'classified from source evidence',
      })
    }
```

`FieldDiff` is `{ field: FarmFieldName; from: unknown; to: unknown; reason: string }`
(`types.ts`). The `reason` string is required; omitting it is a type error.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/stages/06-merge.test.ts && npx tsc --noEmit`
Expected: PASS, and tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add farm-frontend/src/scripts/pipeline/stages/06-merge.ts farm-frontend/src/scripts/pipeline/stages/06-merge.test.ts
git commit -m "feat(pipeline): classify venue type during merge"
```

---

## Task 6: Claim and index gate predicates

**Files:**
- Create: `farm-frontend/src/lib/farm-claims.ts`
- Test: `farm-frontend/src/lib/farm-claims.test.ts`

**Interfaces:**
- Produces: `canClaimVisitable(f: ClaimInput): boolean`, `isIndexable(f: ClaimInput): boolean`, and
  `interface ClaimInput { venueType: string | null; venueVerifiedAt: Date | string | null; openingHours: unknown; phone: string | null; website: string | null; description: string | null; offerings: string[]; hasRealImage: boolean }`.

- [ ] **Step 1: Write the failing test**

```ts
// farm-frontend/src/lib/farm-claims.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canClaimVisitable, isIndexable, type ClaimInput } from './farm-claims'

const base = (o: Partial<ClaimInput> = {}): ClaimInput => ({
  venueType: null, venueVerifiedAt: null, openingHours: null,
  phone: null, website: null, description: null, offerings: [],
  hasRealImage: false, ...o,
})

test('an unverified listing may never claim visitability', () => {
  assert.equal(canClaimVisitable(base()), false)
  assert.equal(canClaimVisitable(base({ venueType: 'shop' })), false)
  assert.equal(canClaimVisitable(base({ venueVerifiedAt: '2026-08-15T00:00:00.000Z' })), false)
})

test('a producer may never claim visitability even when verified', () => {
  assert.equal(canClaimVisitable(base({
    venueType: 'producer_no_public_access', venueVerifiedAt: '2026-08-15T00:00:00.000Z',
  })), false)
})

test('each admitted venue type may claim once verified', () => {
  for (const venueType of ['shop', 'pyo', 'market_stall']) {
    assert.equal(canClaimVisitable(base({ venueType, venueVerifiedAt: new Date() })), true, venueType)
  }
})

test('indexable requires the claim gate first', () => {
  assert.equal(isIndexable(base({ phone: '01803 000000', website: 'https://x.co.uk' })), false)
})

test('a verified listing with hours is indexable', () => {
  assert.equal(isIndexable(base({
    venueType: 'shop', venueVerifiedAt: new Date(),
    openingHours: [{ day: 'Monday', open: '09:00', close: '17:00' }],
  })), true)
})

test('a verified listing needs two substantive fields without hours', () => {
  const verified = { venueType: 'shop', venueVerifiedAt: new Date() }
  assert.equal(isIndexable(base({ ...verified, phone: '01803 000000' })), false)
  assert.equal(isIndexable(base({ ...verified, phone: '01803 000000', website: 'https://x.co.uk' })), true)
})

test('the template description and the default offering do not count as substance', () => {
  const verified = { venueType: 'shop', venueVerifiedAt: new Date() }
  assert.equal(isIndexable(base({
    ...verified,
    description: 'Hallgate Farm is a farm shop in Lincolnshire.',
    offerings: ['Farm Shops'],
  })), false)
  assert.equal(isIndexable(base({
    ...verified,
    description: 'A family-run holding selling day-picked veg and raw milk.',
    offerings: ['Farm Shops', 'PYO'],
  })), true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd farm-frontend && pnpm tsx --test src/lib/farm-claims.test.ts`
Expected: FAIL with "Cannot find module './farm-claims'".

- [ ] **Step 3: Write minimal implementation**

```ts
// farm-frontend/src/lib/farm-claims.ts
// Two gates, both pure.
//
// Claim gate: may this page tell a visitor they can go there? Only when a human
// has confirmed the venue is one you can buy from. Because venueType defaults to
// unknown across every existing row, shipping this silences every unverified
// page immediately.
//
// Index gate: layered above the claim gate. A page Google should rank has to say
// something, not merely exist.

const ADMITTED = new Set(['shop', 'pyo', 'market_stall'])

/** The LLM fallback sentence, which asserts a farm shop without evidence. */
const TEMPLATE_DESCRIPTION = /^(.+?) is a farm shop in (.+?)\.$/

/** The default offering tag carries no information; 99.3% of rows have it. */
const DEFAULT_OFFERING = 'Farm Shops'

export interface ClaimInput {
  venueType: string | null
  venueVerifiedAt: Date | string | null
  openingHours: unknown
  phone: string | null
  website: string | null
  description: string | null
  offerings: string[]
  hasRealImage: boolean
}

/** True when the page may state the visitor can go there and buy something. */
export function canClaimVisitable(f: ClaimInput): boolean {
  if (!f.venueType || !ADMITTED.has(f.venueType)) return false
  return f.venueVerifiedAt != null
}

function hasParsedHours(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0
}

/** Count of substantive fields, over a closed list. Nothing else qualifies. */
function substanceCount(f: ClaimInput): number {
  let n = 0
  if (f.phone) n++
  if (f.website) n++
  if (f.description && !TEMPLATE_DESCRIPTION.test(f.description.trim())) n++
  if (f.offerings.some((o) => o !== DEFAULT_OFFERING)) n++
  if (f.hasRealImage) n++
  return n
}

/** True when the page carries enough to deserve a place in the index. */
export function isIndexable(f: ClaimInput): boolean {
  if (!canClaimVisitable(f)) return false
  if (hasParsedHours(f.openingHours)) return true
  return substanceCount(f) >= 2
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd farm-frontend && pnpm tsx --test src/lib/farm-claims.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add farm-frontend/src/lib/farm-claims.ts farm-frontend/src/lib/farm-claims.test.ts
git commit -m "feat(lib): claim and index gate predicates"
```

---

## Task 7: Apply both gates to the farm page

**Files:**
- Modify: `farm-frontend/src/app/shop/[slug]/page.tsx`

**Interfaces:**
- Consumes: `canClaimVisitable`, `isIndexable` from `@/lib/farm-claims` (Task 6).

> No unit test: this is a rendering and metadata change on a server component.
> It is verified by reading two rendered pages instead.

- [ ] **Step 1: Add the import and build the gate input**

At the top of `page.tsx`:

```ts
import { canClaimVisitable, isIndexable } from '@/lib/farm-claims'
```

After the farm is loaded, in both `generateMetadata` and the page component, build:

```ts
  const claimInput = {
    venueType: farm.venueType ?? null,
    venueVerifiedAt: farm.venueVerifiedAt ?? null,
    openingHours: farm.openingHours ?? null,
    phone: farm.phone ?? null,
    website: farm.website ?? null,
    description: farm.description ?? null,
    offerings: farm.offerings ?? [],
    hasRealImage: (farm.images ?? []).some((i) => !String(i.uploadedBy ?? '').startsWith('ai_')),
  }
```

Adjust property access to match how this page already reads the farm record.

- [ ] **Step 2: Gate the visitability copy**

Wherever the page renders the description or any "farm shop" phrasing:

```tsx
{canClaimVisitable(claimInput)
  ? <p className="text-ink">{farm.description}</p>
  : <p className="text-ink-muted">
      A registered food producer in {farm.county ?? 'the UK'}.
      We have not confirmed whether it is open to visitors.
    </p>}
```

- [ ] **Step 3: Gate indexing in `generateMetadata`**

Add to the returned metadata object:

```ts
    robots: isIndexable(claimInput)
      ? { index: true, follow: true }
      : { index: false, follow: true },
```

- [ ] **Step 4: Verify against two real pages**

Run: `cd farm-frontend && npx tsc --noEmit`, then start the dev server and open any farm page.
Expected: because no row has `venueVerifiedAt` set yet, **every** farm page renders the producer sentence and emits `<meta name="robots" content="noindex, follow">`. That is the correct initial state and is the point of this task. Then set `venueVerifiedAt` and `venueType='shop'` on one row by hand, reload, and confirm that page shows the description and returns to `index, follow`.

- [ ] **Step 5: Commit**

```bash
git add "farm-frontend/src/app/shop/[slug]/page.tsx"
git commit -m "feat(shop): gate visitability claims and indexing on venue verification"
```

---

## Task 8: Retroactive description backfill

**Files:**
- Create: `farm-frontend/src/scripts/backfill-false-descriptions.ts`

> Dry-run by default. Backs up prior values to `.cleanup-backups/` before writing,
> matching the convention `remove-farms.ts` established.

- [ ] **Step 1: Write the script**

```ts
// farm-frontend/src/scripts/backfill-false-descriptions.ts
// Null the LLM fallback description on rows that have not been venue-verified.
// That sentence asserts "X is a farm shop in Y" about businesses that are, in
// 65.2% of cases, producers with no public access.
//
// Dry-run by default; --apply writes. Prior values are backed up first so the
// operation replays backwards.
//   pnpm tsx src/scripts/backfill-false-descriptions.ts
//   pnpm tsx src/scripts/backfill-false-descriptions.ts --apply
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '@/lib/prisma'

const TEMPLATE = /^(.+?) is a farm shop in (.+?)\.$/

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  const rows = await prisma.farm.findMany({
    where: { venueVerifiedAt: null, description: { not: null } },
    select: { id: true, slug: true, name: true, description: true },
  })
  const hits = rows.filter((r) => TEMPLATE.test((r.description ?? '').trim()))
  console.log(`${rows.length} unverified rows with a description; ${hits.length} match the template.`)
  for (const r of hits.slice(0, 10)) console.log(`  ${r.slug}: ${r.description}`)
  if (hits.length > 10) console.log(`  ... and ${hits.length - 10} more`)

  if (!apply) {
    console.log('\nDRY RUN. Re-run with --apply to back up and null these descriptions.')
    await prisma.$disconnect()
    return
  }

  const dir = resolve(process.cwd(), '.cleanup-backups')
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `false-descriptions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(file, JSON.stringify(hits, null, 2))
  console.log(`\nBacked up ${hits.length} prior values -> ${file}`)

  const result = await prisma.farm.updateMany({
    where: { id: { in: hits.map((h) => h.id) } },
    data: { description: null },
  })
  console.log(`Nulled ${result.count} descriptions.`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Dry-run against prod (read-only)**

Run: `cd farm-frontend && pnpm tsx src/scripts/backfill-false-descriptions.ts`
Expected: a count near 83.8% of described rows, and a sample of ten template sentences. Confirm none of the sampled rows is a genuine hand-written description.

- [ ] **Step 3: Apply (OPERATOR STEP, requires explicit confirmation)**

Run: `cd farm-frontend && pnpm tsx src/scripts/backfill-false-descriptions.ts --apply`
Expected: a backup JSON path is printed, then `Nulled N descriptions`. Re-run without `--apply` and confirm it reports 0 matches.

- [ ] **Step 4: Commit**

```bash
git add farm-frontend/src/scripts/backfill-false-descriptions.ts
git commit -m "feat(scripts): reversible backfill nulling unverified farm-shop claims"
```

---

## Task 9: Region selection report

**Files:**
- Create: `farm-frontend/src/scripts/select-region.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks. Read-only.

- [ ] **Step 1: Write the script**

```ts
// farm-frontend/src/scripts/select-region.ts
// Read-only: rank counties as launch-region candidates.
//
// The target band is 60 to 150 candidate rows: roughly one working day of human
// verification, and enough listings for a county page to be genuinely useful.
// Below 60 the page is too thin to compete; above 150 verification slips past a
// day and the region stops being a fast proof.
//   pnpm tsx src/scripts/select-region.ts
import { prisma } from '@/lib/prisma'

const MIN_ROWS = 60
const MAX_ROWS = 150

async function main(): Promise<void> {
  const rows = await prisma.farm.groupBy({
    by: ['county'],
    where: { status: 'active', county: { not: null } },
    _count: { _all: true },
  })
  const ranked = rows
    .map((r) => ({ county: r.county as string, count: r._count._all }))
    .sort((a, b) => b.count - a.count)

  console.log(`counties: ${ranked.length}\n`)
  console.log('IN TARGET BAND (60-150 rows):')
  const inBand = ranked.filter((r) => r.count >= MIN_ROWS && r.count <= MAX_ROWS)
  for (const r of inBand) console.log(`  ${String(r.count).padStart(4)}  ${r.county}`)
  if (inBand.length === 0) console.log('  (none; widen the band or group adjacent counties)')

  console.log('\nFOR CONTEXT (top 15 by row count):')
  for (const r of ranked.slice(0, 15)) {
    const flag = r.count > MAX_ROWS ? 'too many' : r.count < MIN_ROWS ? 'too few' : 'in band'
    console.log(`  ${String(r.count).padStart(4)}  ${r.county}  (${flag})`)
  }
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run it**

Run: `cd farm-frontend && pnpm tsx src/scripts/select-region.ts`
Expected: a ranked county list with in-band candidates called out. Record the chosen county for the human verification pass.

- [ ] **Step 3: Commit**

```bash
git add farm-frontend/src/scripts/select-region.ts
git commit -m "feat(scripts): launch-region selection report"
```

---

## Task 10: Full verification and ledger

**Files:**
- Modify: `docs/assistant/execution-ledger.md`

- [ ] **Step 1: Run the full gate**

Run:
```bash
cd farm-frontend && npx tsc --noEmit && pnpm test:unit && npx next build && npx impeccable detect src/lib src/scripts
```
Expected: tsc exit 0; the test count risen by the new cases with 0 failures; build exit 0; detect exit 0.

- [ ] **Step 2: Prepend a dated ledger entry**

Record: the root cause (FSA `businessTypeId=7838` is a producer category, so 65.2% of names carry no retail word yet every page claimed "is a farm shop"); the invariant and the property test that encodes it; the two schema fields defaulting to unknown; the parser's deliberate null-on-unsupported-syntax decision; the backfill count actually applied; the chosen launch region; and the exact verification commands with their results.

- [ ] **Step 3: Commit**

```bash
git add docs/assistant/execution-ledger.md
git commit -m "docs(ledger): venue classification and opening hours"
```

---

## Self-Review

**1. Spec coverage.** Venue model, Task 1. Classification evidence graph and its invariant, Task 3. Integration at `06-merge` with `07-load` untouched, Task 5. Hours convergence, Tasks 2 and 4. Claim gate, Task 6, applied in Task 7. Index gate, Task 6, applied in Task 7. Retroactive correction, Task 8. Region selection with the 60 to 150 band, Task 9.

**Gap, deliberate and named:** the spec's `sources/places.ts` and the `E5` / `E6` evidence edges are **not** implemented here. Both need a Google Maps Platform API key and billing, an operator dependency this plan cannot satisfy. `classifyVenue` already accepts `websiteRetailSignal` and `placesRetailWithHours` so the classifier needs no change when they arrive; Task 5 passes `false` for both. Places restoration gets its own plan once the key exists. This plan still produces working, testable software without it: the false claims stop, and OSM hours land.

**2. Placeholder scan.** No TBD, TODO, or "handle edge cases". Every code step carries the actual code. Task 7 has no unit test and says why, with a concrete two-page manual check instead.

**3. Type consistency.** `VenueType` is defined once in Task 1 and imported by Tasks 3 and 6. The `VenueEvidence` field names in the Task 3 test match the interface and match the object literal Task 5 passes. `ClaimInput` in Task 6 matches its use in Task 7. `parseOsmHours` returns `OpeningHours[] | null` in Task 2 and is consumed as such in Task 4. `hasRetailLexeme` is named identically in Tasks 3 and 5.

**Known risk carried into Task 5.** `classifyVenue` reads `osmShopFarm` as `Boolean(c.osmId)`. That is sound only because `parseOverpass` already rejects any element without `shop=farm`, so an `osmId` implies the tag. If OSM discovery ever widens beyond `shop=farm`, the inference breaks silently. Task 5's implementation comment states this inline.
