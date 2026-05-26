# Non-Farm Contamination Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove supermarket/retail chain entries (Farmfoods, Tesco, Sainsbury's, Nisa, ...) from the UK farm directory and stop both ingest sources (OSM `shop=farm`, FSA `Farmers/growers`) re-importing them.

**Architecture:** A shared, tested name/website predicate (`isNonFarmChain`) using PRECISE signals only — token-membership name matching (never substring), known chain web-domain matching, and OSM brand/operator tags — wired into both source parsers (prevention), plus a reusable read-only audit script and a reversible, backed-up removal script for the existing rows (cleanup).

**Tech Stack:** TypeScript, `tsx --test` (node:test), Prisma (prod Postgres on Hetzner), existing pipeline source parsers under `src/scripts/pipeline/sources/`.

**Council outcome (2026-05-26):** No fuzzy substring matching (deletes real farms like "Aldis Farm Shop"); the OSM parser's lack of any filter is the real defect ("fix the pipe"); the ~5-6 rows are a hand-fix; hard-delete with a reversible JSON backup is proportionate (no review-queue owner exists). Detection leads with precise structural signals, not a fuzzy name list.

---

## File Structure

- `farm-frontend/src/scripts/pipeline/sources/non-farm-chains.ts` (CREATE) — shared chain-detection predicates. One responsibility: "is this candidate a known non-farm chain?"
- `farm-frontend/src/scripts/pipeline/sources/non-farm-chains.test.ts` (CREATE) — pure unit tests, especially the false-positive guards.
- `farm-frontend/src/scripts/pipeline/sources/overpass.ts` (MODIFY) — reject chains in `parseOverpass` (the unguarded pipe).
- `farm-frontend/src/scripts/pipeline/sources/fsa.ts` (MODIFY) — reject chains in `parseFsa` (currently only filters vessels).
- `farm-frontend/src/scripts/audit-non-farm.ts` (CREATE) — read-only scan of active farms; reports contamination candidates. Ongoing review surface.
- `farm-frontend/src/scripts/remove-farms.ts` (CREATE) — reversible, backed-up deletion of explicit farm ids/slugs; dry-run by default.
- `docs/assistant/execution-ledger.md` (MODIFY) — slice record.

All under the test/source size limits. `non-farm-chains.ts` ~70 lines.

---

## Task 1: Shared chain-detection module

**Files:**
- Create: `farm-frontend/src/scripts/pipeline/sources/non-farm-chains.ts`
- Test: `farm-frontend/src/scripts/pipeline/sources/non-farm-chains.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// farm-frontend/src/scripts/pipeline/sources/non-farm-chains.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isChainName, isChainWebsite, isNonFarmChain } from './non-farm-chains'

// --- True positives: real chains that leaked in ---
test('matches leading chain names', () => {
  assert.equal(isChainName('farmfoods'), true)
  assert.equal(isChainName('Tesco Superstore'), true)
  assert.equal(isChainName('Tesco Express Camden'), true)
})

test('matches chain token in suffix/mid position', () => {
  // Real prod rows that exact-match would miss:
  assert.equal(isChainName("Washington Teal Farm Sainsbury's (Argos Collection Point)"), true)
  assert.equal(isChainName('Carnagh House Off Licence & NISA'), true)
})

test('matches multi-word chain phrases', () => {
  assert.equal(isChainName('Premier Stores/Nikki\'s Kitchen'), true)
  assert.equal(isChainName('Heron Foods'), true)
})

// --- False positives: real farm shops that MUST survive ---
test('does not match real farm shops with colliding substrings', () => {
  assert.equal(isChainName('Aldis Farm Shop'), false)   // contains "aldi"
  assert.equal(isChainName('Aldis & Sons'), false)
  assert.equal(isChainName('Spalding Farm Shop Manna Cafe'), false) // contains "aldi"
  assert.equal(isChainName('Mr Alasdair Marshall'), false) // contains "asda"
  assert.equal(isChainName('Sparkle-Ness'), false) // contains "spar"
  assert.equal(isChainName('Sparsholt College Game And Wildlife Centre'), false)
  assert.equal(isChainName('Vital Spark'), false)
  assert.equal(isChainName('Newton Farm Foods'), false) // genuine farm shop
  assert.equal(isChainName('Eco Farm Foods'), false)
})

test('handles empty/undefined names', () => {
  assert.equal(isChainName(undefined), false)
  assert.equal(isChainName(''), false)
})

// --- Website-domain signal (the Farmfoods OSM smoking gun) ---
test('matches known chain website domains', () => {
  assert.equal(isChainWebsite('https://www.farmfoods.co.uk/store-finder.php?branch_code=690'), true)
  assert.equal(isChainWebsite('http://tesco.com'), true)
  assert.equal(isChainWebsite('https://www.sainsburys.co.uk/'), true)
})

test('does not match a genuine farm website or junk', () => {
  assert.equal(isChainWebsite('https://www.newtonfarmfoods.co.uk'), false)
  assert.equal(isChainWebsite('not a url'), false)
  assert.equal(isChainWebsite(undefined), false)
})

// --- Combined candidate predicate ---
test('isNonFarmChain combines name, website, and OSM brand tag', () => {
  assert.equal(isNonFarmChain({ name: 'farmfoods', website: 'https://www.farmfoods.co.uk/x', tags: { shop: 'farm' } }), true)
  assert.equal(isNonFarmChain({ name: 'Some Shed', tags: { brand: 'Tesco' } }), true)
  assert.equal(isNonFarmChain({ name: 'Newton Farm Foods', website: 'https://newtonfarmfoods.co.uk' }), false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/sources/non-farm-chains.test.ts`
Expected: FAIL ("Cannot find module './non-farm-chains'").

- [ ] **Step 3: Write minimal implementation**

```ts
// farm-frontend/src/scripts/pipeline/sources/non-farm-chains.ts
// Detection of national retail/supermarket chains that are NOT farm shops
// but leak into the FSA "Farmers/growers" feed and OSM shop=farm tags.
//
// PRECISE signals only. We never substring-match a chain name against a farm
// name: real farms collide ("Aldis Farm Shop", "Spalding", "Sparkle-Ness",
// "Mr Alasdair Marshall"). Instead we match whole normalized TOKENS (so
// "aldis" never equals "aldi") and known chain WEB DOMAINS (which do not
// collide the way names do). Mirrors the isVesselName() filter in fsa.ts.

// Single-word chain identifiers, normalized (lowercase, apostrophes removed).
const CHAIN_NAME_TOKENS: ReadonlySet<string> = new Set([
  'farmfoods', 'tesco', 'asda', 'sainsburys', 'aldi', 'lidl', 'iceland',
  'morrisons', 'waitrose', 'nisa', 'spar', 'costcutter', 'budgens', 'londis',
  'greggs', 'poundland', 'poundstretcher',
])

// Multi-word chain identifiers, matched as whole space-bounded phrases.
const CHAIN_NAME_PHRASES: readonly string[] = [
  'premier stores', 'heron foods', 'one stop', 'marks and spencer',
  'whole foods market', 'co op food',
]

// Registrable chain web domains, matched against the OSM website tag host.
const CHAIN_DOMAINS: readonly string[] = [
  'farmfoods.co.uk', 'tesco.com', 'asda.com', 'sainsburys.co.uk', 'aldi.co.uk',
  'lidl.co.uk', 'iceland.co.uk', 'morrisons.com', 'waitrose.com',
  'nisalocally.co.uk', 'spar.co.uk', 'costcutter.co.uk', 'premier-stores.co.uk',
  'heronfoods.com', 'budgens.co.uk', 'londis.co.uk', 'marksandspencer.com',
  'greggs.co.uk',
]

/** Lowercase, drop apostrophes, & -> "and", collapse non-alphanumerics to single spaces. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** True when a business name is a known non-farm chain (token or phrase match). */
export function isChainName(name: string | undefined): boolean {
  if (!name) return false
  const nrm = normalizeName(name)
  if (!nrm) return false
  const tokens = new Set(nrm.split(' '))
  for (const token of CHAIN_NAME_TOKENS) {
    if (tokens.has(token)) return true
  }
  const padded = ` ${nrm} `
  return CHAIN_NAME_PHRASES.some((phrase) => padded.includes(` ${phrase} `))
}

/** True when a website URL belongs to a known chain domain. */
export function isChainWebsite(url: string | undefined): boolean {
  if (!url) return false
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return false
  }
  return CHAIN_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
}

/** Combined reject predicate for an ingest candidate. */
export function isNonFarmChain(c: {
  name?: string
  website?: string
  tags?: Record<string, string>
}): boolean {
  if (isChainName(c.name)) return true
  if (isChainWebsite(c.website)) return true
  const t = c.tags ?? {}
  const brand = (t.brand || t.operator || '').trim()
  return brand ? isChainName(brand) : false
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/sources/non-farm-chains.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add farm-frontend/src/scripts/pipeline/sources/non-farm-chains.ts farm-frontend/src/scripts/pipeline/sources/non-farm-chains.test.ts
git commit -m "feat(pipeline): non-farm chain detection (precise token + domain signals)"
```

---

## Task 2: Reject chains in the OSM parser (the unguarded pipe)

**Files:**
- Modify: `farm-frontend/src/scripts/pipeline/sources/overpass.ts`
- Test: `farm-frontend/src/scripts/pipeline/sources/overpass.test.ts`

- [ ] **Step 1: Write the failing test** (append to existing test file)

```ts
import { isNonFarmChain } from './non-farm-chains' // top of file with other imports

test('parseOverpass drops a mis-tagged chain store (Farmfoods)', () => {
  const res = {
    elements: [
      { type: 'way', id: 292181031, center: { lat: 52.6, lon: 1.28 }, tags: {
        shop: 'farm', name: 'farmfoods', old_name: 'Carpetright',
        website: 'https://www.farmfoods.co.uk/store-finder.php?branch_code=690',
      } },
      { type: 'node', id: 1, lat: 51, lon: -1, tags: { shop: 'farm', name: 'Newton Farm Foods' } },
    ],
  }
  const out = parseOverpass(res as unknown as Parameters<typeof parseOverpass>[0])
  assert.equal(out.find((c) => c.sourceId === 'way:292181031'), undefined)
  assert.ok(out.find((c) => c.name === 'Newton Farm Foods'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/sources/overpass.test.ts`
Expected: FAIL (Farmfoods still present; `isNonFarmChain` not yet applied).

- [ ] **Step 3: Add the guard in `parseOverpass`**

In `overpass.ts`, add the import at the top:
```ts
import { isNonFarmChain } from './non-farm-chains'
```
Then inside the `for` loop in `parseOverpass`, immediately after the `if (tags.shop !== 'farm') continue` line, add:
```ts
    // Drop national retail chains mis-tagged shop=farm in OSM (e.g. Farmfoods).
    if (isNonFarmChain({ name: tags.name, website: tags.website ?? tags['contact:website'], tags })) continue
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/sources/overpass.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add farm-frontend/src/scripts/pipeline/sources/overpass.ts farm-frontend/src/scripts/pipeline/sources/overpass.test.ts
git commit -m "feat(pipeline): filter non-farm chains in OSM parser"
```

---

## Task 3: Reject chains in the FSA parser

**Files:**
- Modify: `farm-frontend/src/scripts/pipeline/sources/fsa.ts`
- Test: `farm-frontend/src/scripts/pipeline/sources/fsa.test.ts`

- [ ] **Step 1: Write the failing test** (append to existing test file)

```ts
import { isNonFarmChain } from './non-farm-chains' // add to imports

test('parseFsa drops retail chains mis-filed under Farmers/growers', () => {
  const res = { establishments: [
    { FHRSID: 301, BusinessName: 'Tesco Superstore', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 302, BusinessName: 'Carnagh House Off Licence & NISA', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
    { FHRSID: 303, BusinessName: 'River Cottage Farm Shop', BusinessType: 'Farmers/growers', PostCode: 'AA1 1AA' },
  ] }
  const out = parseFsa(res as unknown as Parameters<typeof parseFsa>[0])
  assert.equal(out.find((c) => c.sourceId === '301'), undefined)
  assert.equal(out.find((c) => c.sourceId === '302'), undefined)
  assert.ok(out.find((c) => c.sourceId === '303'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/sources/fsa.test.ts`
Expected: FAIL (Tesco/NISA still present).

- [ ] **Step 3: Add the guard in `parseFsa`**

In `fsa.ts`, add the import at the top:
```ts
import { isNonFarmChain } from './non-farm-chains'
```
Then in `parseFsa`, immediately after the existing `if (isVesselName(e.BusinessName)) continue` line, add:
```ts
    // Drop national retail chains mis-filed under a farm business type.
    if (isNonFarmChain({ name: e.BusinessName })) continue
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd farm-frontend && pnpm tsx --test src/scripts/pipeline/sources/fsa.test.ts`
Expected: PASS (and the existing vessel/business-type tests still pass).

- [ ] **Step 5: Commit**

```bash
git add farm-frontend/src/scripts/pipeline/sources/fsa.ts farm-frontend/src/scripts/pipeline/sources/fsa.test.ts
git commit -m "feat(pipeline): filter non-farm chains in FSA parser"
```

---

## Task 4: Read-only audit script (ongoing review surface)

**Files:**
- Create: `farm-frontend/src/scripts/audit-non-farm.ts`

- [ ] **Step 1: Write the script**

```ts
// farm-frontend/src/scripts/audit-non-farm.ts
// Read-only scan: lists active farms whose name/website looks like a known
// non-farm chain (uses the same predicate the ingest parsers now enforce).
// Run: pnpm tsx src/scripts/audit-non-farm.ts
import { prisma } from '@/lib/prisma'
import { isNonFarmChain } from './pipeline/sources/non-farm-chains'

async function main(): Promise<void> {
  const farms = await prisma.farm.findMany({
    where: { status: 'active' },
    select: { id: true, slug: true, name: true, website: true, county: true, dataSource: true },
  })
  const hits = farms.filter((f) => isNonFarmChain({ name: f.name ?? undefined, website: f.website ?? undefined }))
  console.log(`Scanned ${farms.length} active farms; ${hits.length} chain candidate(s):`)
  for (const f of hits) {
    console.log(`  ${f.id}  ${f.dataSource ?? 'null'}  ${f.name}  (${f.county ?? 'no county'})  ${f.slug}`)
  }
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run the audit against prod (read-only)**

Run: `cd farm-frontend && pnpm tsx src/scripts/audit-non-farm.ts`
Expected: a list of chain candidates with their `id`. Record the ids of the rows confirmed to be chains (e.g. `farmfoods`, `Tesco`, `Tesco Superstore`, the `Sainsbury's` row, the `NISA` row). Manually exclude any genuine farm shop that slips in.

- [ ] **Step 3: Commit**

```bash
git add farm-frontend/src/scripts/audit-non-farm.ts
git commit -m "feat(scripts): read-only non-farm contamination audit"
```

---

## Task 5: Reversible backed-up removal (OPERATOR STEP — prod write)

**Files:**
- Create: `farm-frontend/src/scripts/remove-farms.ts`

> Deletion is destructive. This script is dry-run by default, backs up full rows
> to `.cleanup-backups/` before deleting, and only acts on an explicit id list
> the operator passes after reviewing the Task 4 output. Cascade deletes handle
> category/image relations (same mechanism as the vessel cleanup).

- [ ] **Step 1: Write the script**

```ts
// farm-frontend/src/scripts/remove-farms.ts
// Reversible deletion of explicitly listed farms (by id), with a JSON backup.
// Dry-run by default. Apply with --apply.
//   pnpm tsx src/scripts/remove-farms.ts --ids=ID1,ID2            # dry-run
//   pnpm tsx src/scripts/remove-farms.ts --ids=ID1,ID2 --apply    # delete
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '@/lib/prisma'

function arg(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
}

async function main(): Promise<void> {
  const ids = (arg('ids') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const apply = process.argv.includes('--apply')
  if (ids.length === 0) {
    console.error('No --ids provided. Pass --ids=ID1,ID2 (from audit-non-farm).')
    process.exit(1)
  }

  const rows = await prisma.farm.findMany({
    where: { id: { in: ids } },
    include: { categories: true, images: true },
  })
  console.log(`Matched ${rows.length} of ${ids.length} requested ids:`)
  for (const r of rows) console.log(`  ${r.id}  ${r.name}  (${r.county ?? 'no county'})`)

  if (!apply) {
    console.log('\nDRY RUN. Re-run with --apply to back up and delete.')
    await prisma.$disconnect()
    return
  }

  const dir = resolve(process.cwd(), '.cleanup-backups')
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `non-farm-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(file, JSON.stringify(rows, null, 2))
  console.log(`\nBacked up ${rows.length} full rows -> ${file}`)

  const result = await prisma.farm.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } })
  console.log(`Deleted ${result.count} farms (cascade removed their category/image links).`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Dry-run with the reviewed ids**

Run: `cd farm-frontend && pnpm tsx src/scripts/remove-farms.ts --ids=<reviewed-ids>`
Expected: prints the matched rows; no write. Confirm every listed row is genuinely a chain.

- [ ] **Step 3: Apply (after explicit user confirmation)**

Run: `cd farm-frontend && pnpm tsx src/scripts/remove-farms.ts --ids=<reviewed-ids> --apply`
Expected: writes a backup JSON to `.cleanup-backups/`, then `Deleted N farms`. Verify `audit-non-farm.ts` reports 0 of those ids afterward.

- [ ] **Step 4: Commit the script (backups are git-ignored)**

```bash
git add farm-frontend/src/scripts/remove-farms.ts
git commit -m "feat(scripts): reversible backed-up farm removal"
```

---

## Task 6: Ledger update

**Files:**
- Modify: `docs/assistant/execution-ledger.md`

- [ ] **Step 1: Prepend a dated entry** summarizing: root cause (OSM `shop=farm` mistag + FSA mis-filing, no chain filter), the council outcome, the `isNonFarmChain` precise-signal filter wired into both parsers, the audit + reversible removal scripts, the exact ids removed, and verification (test counts, audit before/after). Note residual: ambiguous rows (Wiltshire Farm Foods, Mwanaka, the genuine "X Farm Foods" shops) left in place pending manual review.

- [ ] **Step 2: Commit**

```bash
git add docs/assistant/execution-ledger.md
git commit -m "docs(ledger): non-farm chain contamination removal + ingest filter"
```

---

## Self-Review

- **Spec coverage:** Prevention (Tasks 2-3, both parsers — closes the OSM pipe the council flagged) ✓; existing-row cleanup (Tasks 4-5, reversible) ✓; ongoing review surface (Task 4 audit) ✓; precise-not-fuzzy detection (Task 1 token + domain) ✓; delete-with-backup over suspend (Task 5) ✓.
- **Placeholder scan:** none — all steps contain real code/commands and expected output.
- **Type consistency:** `isChainName`, `isChainWebsite`, `isNonFarmChain` signatures are identical across Tasks 1-4; `parseOverpass`/`parseFsa` guards both call `isNonFarmChain`; `remove-farms.ts` and `audit-non-farm.ts` both key on Prisma `Farm.id`.
- **Residual risk (from Critic):** a name denylist still misses unknown chains and chains tagged without brand/website; the Task 4 audit is the mitigation but has no automated cadence. Hard-delete relies on the backup being kept; backups live in `.cleanup-backups/` (already git-ignored).
