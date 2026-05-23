# Farm Data Pipeline Redesign — Design Spec

> Status: **IMPLEMENTED (slices A-J) on branch `feat/farm-data-pipeline`, 2026-05-23.** CANONICAL pending the two operator steps in §14 (a live `--dry-run` over real data, then retiring the Python `farm-pipeline/`). Authored 2026-05-23 by FlowCoder; plan at `docs/superpowers/plans/2026-05-23-farm-data-pipeline-redesign.md`.
> Brainstorm/design approved verbally at the end of session 2026-05-23 20:15 (see `context/handover-2026-05-23-2015.md` "Decisions"). Operator decisions locked in the plan: fuzzy match 150m + 0.85 name similarity (same-postcode only); attribution via `/data-attributions` page + footer link.
>
> **Supersedes:** ledger **Queue 32 (Farm Pipeline Enrichment & Database Integration)** and `docs/assistant/farm-enrichment-plan.md`. Both describe the Google-Places-crawl approach this redesign retires. See §12 Plan Reconciliation.

---

## §1 Problem and intent

### 1.1 Why we are redesigning

The current farm-data path is a Python crawler (`farm-pipeline/`, ~30 Python modules) that calls Google Places, writes `farms.uk.json`, and is loaded into Postgres by `farm-frontend/src/scripts/import-farms.ts`. It is weak on four axes:

1. **Discovery is Google-bound.** Coverage depends on what Google Places returns for ad-hoc text/nearby queries. It misses farms with no Google presence, is rate-limited and metered, and the Places ToS restricts how long we may store and how we may display the data.
2. **Photos are legally fragile.** Google photo references expire (stored as `googlePhotoRef`, fetched on demand with a 23h cache in `lib/google-photos.ts`), the ToS forbids permanent storage, and using them shifts the product's visual identity onto Google imagery.
3. **The load clobbers curated data.** `import-farms.ts --force` blind-overwrites every field of an existing row (see `import-farms.ts:344-355`); without `--force` it skips the row entirely. There is no field-level notion of "this value was set by an owner, do not touch it." There is no provenance.
4. **Two languages, two environments.** Python pipeline plus TypeScript frontend means a cross-repo copy step, a separate `.venv`, and a dual-toolchain footgun for every contributor.

### 1.2 What we are building

A single TypeScript pipeline under `farm-frontend/src/scripts/pipeline/`, sourcing from **free, openly-licensed UK datasets first**, that:

- Discovers farm shops from **OpenStreetMap (Overpass)** and the **FSA Food Hygiene Rating** dataset, not Google.
- Geocodes and validates with **postcodes.io**.
- Sources photos from **Geograph** and **Wikimedia Commons** (Creative Commons), ranked **below** owner/user uploads and **above** AI illustration; AI (Pitti/Apothecary) remains the guaranteed fallback.
- Treats **Google as a "free-first, decide later" seam** used only to fill opening-hours gaps, behind a feature flag, never for discovery or photos.
- Carries **field-level provenance** on every farm and **never clobbers curated data** during merge.
- **Loads dry-run-first**, idempotently, with a structured change report. No blind `--force`. No `prisma migrate dev`.

### 1.3 Non-goals

- Not rebuilding the AI image generators (`generate-farm-images.ts`, Pitti/Apothecary). They stay; the pipeline only decides *when* AI is the chosen image (fallback) and records that choice.
- Not changing the public site, routes, or rendering. This is a data-acquisition and load redesign only.
- Not migrating app hosting or the DB. Backing services stay on Coolify/Hetzner; the app stays on Vercel (per the ledger Production Infrastructure block).

---

## §2 Operating principles

1. **Open data first, paid data last.** Every byte we can get from OSM, FSA, postcodes.io, Geograph, and Wikimedia, we get there. Google is the last resort for one narrow gap (hours) and is off by default.
2. **Curated data is sacred.** Anything a human owner/admin/user set wins over anything a machine fetched. The merge proves this with tests before it touches a row.
3. **Provenance is recorded, not implied.** Every field knows where it came from and when. A future reader (or a future merge) can reason about precedence without archaeology.
4. **Dry-run is the default mental model.** Loads produce a diff first. A human or a guard approves before writes happen. There is no "blind overwrite everything" switch.
5. **Idempotent and resumable.** Re-running any stage on the same inputs yields the same outputs. Stages persist intermediate artifacts so a failure resumes, not restarts.
6. **One language, one toolchain.** TypeScript + `tsx`, `node:test`, Prisma. The Python `farm-pipeline` is retired at the end (Slice J), not modernised.
7. **Licensing is a first-class constraint.** OSM (ODbL) and Geograph (CC BY-SA) carry attribution and share-alike obligations. We capture attribution at fetch time and surface it; §6.4 and §11 track the open legal questions.

---

## §3 Architecture

### 3.1 Directory layout (new)

```
farm-frontend/src/scripts/pipeline/
  types.ts                  # shared contracts: RawFarmCandidate, MergedFarm, FieldProvenance, ChangeSet, RunReport
  config.ts                 # source endpoints, rate limits, feature flags (GOOGLE_HOURS_SEAM, etc.)
  lib/
    http.ts                 # fetch wrapper: retries, exponential backoff, rate limiting, structured logging
    log.ts                  # structured JSON logger (stage, source, level, counts)
    geo.ts                  # haversine, bbox, UK bounds (reuse shared/lib if present)
  sources/
    overpass.ts             # OSM Overpass client (shop=farm in UK)
    fsa.ts                  # FSA Food Hygiene Rating API client
    postcodes.ts            # postcodes.io geocode + reverse lookup
    geograph.ts             # Geograph CC photo search
    wikimedia.ts            # Wikimedia Commons CC photo search
    google-hours.ts         # OPTIONAL hours-only seam, flag-gated, off by default
  stages/
    01-discover.ts          # sources -> raw candidates (artifact: .pipeline/01-discover.json)
    02-normalize.ts         # raw candidates -> normalized + deduped (artifact: 02-normalize.json)
    03-geocode.ts           # fill/validate coords, county, city (artifact: 03-geocode.json)
    04-enrich.ts            # opening hours, offerings/categories (artifact: 04-enrich.json)
    05-images.ts            # rank + attach CC photos / AI fallback marker (artifact: 05-images.json)
    06-merge.ts             # diff against live DB using merge policy -> ChangeSet (artifact: 06-merge.json)
    07-load.ts              # apply ChangeSet, dry-run-first, idempotent, RunReport
  policy/
    merge-policy.ts         # PURE functions: field precedence, never-clobber, change-set builder
    merge-policy.test.ts    # node:test — written FIRST (Slice B)
  run.ts                    # orchestrator: chain stages, --from/--to, --dry-run, --limit
```

### 3.2 Data flow

```
OSM Overpass ─┐
FSA API ──────┼─> 01 discover ─> 02 normalize+dedupe ─> 03 geocode ─> 04 enrich ─> 05 images ─> 06 merge ─> 07 load ─> Postgres
postcodes.io ─┘                                          (postcodes)    (hours/cats)  (Geograph/      (vs live DB,   (dry-run
Geograph ──────────────────────────────────────────────────────────────────────── Wikimedia/AI)    field-level    first)
Wikimedia ──────────────────────────────────────────────────────────────────────────────────────── never-clobber)
Google (hours seam, flag-gated, 04 only) ─────────────────────────────┘
```

Each stage reads the prior stage's JSON artifact from `.pipeline/` and writes its own. This makes every boundary inspectable and every stage independently re-runnable (`run.ts --from 03 --to 04`).

### 3.3 Toolchain

- Runtime: `tsx` (already used by every script in `src/scripts/`).
- Tests: `node:test` (the project's existing harness; `pnpm test:unit`). No new test framework.
- ORM: Prisma (existing client).
- HTTP: native `fetch` wrapped by `lib/http.ts`. No new HTTP dependency unless a source SDK is unavoidable (one-dependency-per-slice rule applies).

---

## §4 Data sources

For each source: what it gives us, why, how we query it, its limits, and its licence.

### 4.1 OpenStreetMap — Overpass API (primary discovery)

- **Gives:** farm-shop locations and tags (`shop=farm`, often `name`, `addr:*`, `opening_hours`, `website`, `phone`, `organic`, `produce`).
- **Query:** Overpass QL for `node/way/relation["shop"="farm"]` within the UK bounding boxes (split by region to stay under Overpass limits). Also consider `shop=greengrocer` + `farm=*` as a secondary, lower-confidence signal (flagged, not auto-merged).
- **Limits:** public Overpass instances rate-limit aggressively; `lib/http.ts` must throttle (1 request / few seconds), back off on 429/504, and we cache responses to `.pipeline/`. Prefer a single regioned sweep, not per-farm calls.
- **Licence:** **ODbL.** Attribution required ("© OpenStreetMap contributors") and **share-alike applies to the derived database.** See §11 open question OL-1.
- **Match key:** `osmType:osmId` (e.g. `node:12345`).

### 4.2 FSA Food Hygiene Rating (primary discovery + verification)

- **Gives:** registered food businesses (many farm shops/farms register), with business name, address, postcode, local-authority, business type, and a hygiene rating. Confirms a business is **real and operating**.
- **Query:** FSA ratings API (`api.ratings.food.gov.uk`), filter by business type (e.g. "Retailers - other", "Farmers/growers") and region; paginate.
- **Limits:** documented public API; still throttle and cache. Business-type taxonomy is coarse, so FSA is a *corroborating* and *address-quality* source more than a precise farm filter.
- **Licence:** **Open Government Licence (OGL).** Attribution required, no share-alike. Cleanest source legally.
- **Match key:** `FHRSID`.

### 4.3 postcodes.io (geocode + validate)

- **Gives:** lat/lng, validated postcode, admin county/district, ward for a UK postcode; reverse lookup (lat/lng -> nearest postcode + admin areas).
- **Why:** fills missing coordinates and derives `county`/`city` consistently, replacing the Python `postcode_validator.py`.
- **Limits:** generous public rate limits; bulk endpoint (`POST /postcodes`) takes up to 100 at a time, so batch.
- **Licence:** OGL-family (ONS/OS OpenData). Attribution courtesy. No key required.

### 4.4 Geograph (photos, ranked above AI)

- **Gives:** geographically-tagged real photos of places across the UK, many near or of farm shops.
- **Why:** real CC photography is better than AI illustration for a place surface when an owner/user has not supplied one.
- **Licence:** **CC BY-SA 2.0.** Attribution + share-alike. Capture photographer, title, and source URL at fetch time.
- **Match:** nearest photos within radius of farm coordinates; rank by proximity + title relevance; manual/heuristic confidence gate before attaching.

### 4.5 Wikimedia Commons (photos, ranked above AI)

- **Gives:** CC-licensed images; some farm shops / named farms have Commons media.
- **Licence:** **varies per file** (CC0, CC BY, CC BY-SA, PD). Must read each file's licence template; reject anything non-commercial or no-derivatives. Capture licence + attribution + source URL per image.
- **Match:** Commons API geosearch + title search.

### 4.6 Google — opening-hours seam only (flag-gated, off by default)

- **Gives:** opening hours for farms where OSM `opening_hours` is absent.
- **Constraints:** **discovery and photos via Google are out.** Only `04-enrich.ts` may call it, only for the hours field, only when `GOOGLE_HOURS_SEAM=true`. Default off. "Free-first, decide later": we ship the seam disabled and decide later whether the hours coverage justifies the metered calls and ToS storage limits.

### 4.7 Source precedence (for discovery and field values)

```
curated (owner/admin/user)  >  FSA (OGL, verified-real)  >  OSM (rich tags)  >  derived/inferred (geocode, heuristics)  >  Google (hours seam only)
```

This precedence is encoded in the merge policy (§6) and is the single source of truth for "who wins."

---

## §5 Provenance model

### 5.1 Why field-level

A farm row is assembled from many sources and edited by humans over time. To "never clobber curated data" the merge must know, per field, *who set it and when*. A single `dataSource` column is not enough because `name` might be owner-edited while `openingHours` came from OSM.

### 5.2 Storage (additive schema change)

Add to `model Farm` (all nullable/defaulted, so additive and `db push`-safe):

```prisma
// Provenance & matching (pipeline redesign, 2026-05-23)
provenance     Json?     // { "<field>": { "source": "owner|user|admin|fsa|osm|google|derived", "at": ISO8601 } }
osmId          String?   @db.VarChar(40)   // "node:123" | "way:456"
fsaId          String?   @db.VarChar(40)   // FHRSID
dataSource     String?   @db.VarChar(20)   // primary discovery source for the row
lastEnrichedAt DateTime?
@@index([osmId])
@@index([fsaId])
```

Add to `model Image` (additive):

```prisma
license     String? @db.VarChar(40)   // e.g. "CC-BY-SA-2.0", "OGL", "CC0"
sourceUrl   String? @db.VarChar(500)  // canonical source page for attribution
attribution String? @db.VarChar(255)  // generalises the existing googleAttribution; keep googleAttribution too
// extend allowed `source` values: 'google' | 'runware' | 'upload' | 'geograph' | 'wikimedia'
```

`uploadedBy` already encodes human-vs-AI provenance for images (`owner|admin|user|ai_pitti|ai_apothecary|ai_generator`); the redesign adds non-Google CC sources to `source` and records `license`/`attribution`/`sourceUrl`.

### 5.3 Migration approach (hard constraint)

The live DB has **no Prisma migration history** (it is `db push` / manual-SQL managed; the handover flags `migrate dev` as unsafe). Therefore:

- Schema changes ship as **additive, nullable** columns applied with `pnpm prisma db push` (or reviewed manual `ALTER TABLE ... ADD COLUMN`), **never** `prisma migrate dev`.
- The Slice-A schema change is verified beforehand by extending the existing `check-image-schema.ts` probe (read-only) to report the new columns' presence, run against the live host.

---

## §6 Merge policy (the heart — Slice B, TDD-first)

### 6.1 Inputs and output

```ts
mergeFarm(existing: DbFarm | null, incoming: NormalizedCandidate): FarmChange
```

- `existing`: the current DB row (with its `provenance`), or null for a new farm.
- `incoming`: the pipeline's assembled candidate, each field tagged with its source.
- `FarmChange`: `{ action: 'create' | 'update' | 'noop', fields: FieldDiff[], provenanceNext: Provenance }` where each `FieldDiff` is `{ field, from, to, reason }`.

`mergeFarm` is **pure** (no DB, no IO). It is unit-tested exhaustively before any stage uses it.

### 6.2 Rules

1. **Never clobber higher-precedence provenance.** For each field, compare the incoming source's precedence (§4.7) to the existing field's recorded provenance. Write only if incoming precedence >= existing precedence, OR the existing value is empty/null.
2. **Curated always wins.** If existing provenance for a field is `owner|admin|user`, machine sources never overwrite it. They may fill it only if it is empty.
3. **Empty does not overwrite non-empty from an equal-or-higher source.** A blank incoming value never erases a populated field.
4. **Provenance is updated on every accepted write** to `{ source, at: now }`.
5. **Coordinates are special:** never overwrite valid existing coordinates with derived/geocoded ones; only fill when missing or when incoming is from a strictly higher-precedence source.
6. **Status/verified are curated-by-default:** machine sources may set them on create but never flip them on update (mirrors the current `import-farms.ts` intent at lines 350-353, made explicit and tested).
7. **Categories are additive:** the pipeline may add category links from OSM/FSA tags but never removes existing ones (matches current additive behaviour).

### 6.3 Matching (which existing row, if any)

Match an incoming candidate to an existing farm in this order, first hit wins:
1. `osmId` exact, 2. `fsaId` exact, 3. `googlePlaceId` exact (legacy rows), 4. `slug` exact, 5. fuzzy: name similarity AND haversine distance < 150 m. Unmatched -> create.

### 6.4 Image merge

- Ranking for the chosen hero / gallery: `owner > user > geograph|wikimedia (CC) > ai_pitti|ai_apothecary > ai_generator (suppressed)`.
- Never delete or demote an owner/user image.
- CC images attach only with `license`, `attribution`, `sourceUrl` populated; missing attribution = do not attach.
- If no human or CC image clears the confidence gate, mark the farm as **AI-fallback eligible** (the existing generators fill it; the pipeline does not generate images itself).

---

## §7 Stage contracts

Each stage: input artifact -> output artifact, with a one-line guarantee.

| Stage | Input | Output | Guarantee |
|-------|-------|--------|-----------|
| 01-discover | source APIs | `RawFarmCandidate[]` | every candidate carries its source + source id; raw responses cached |
| 02-normalize | 01 | `NormalizedCandidate[]` | common shape; intra/inter-source duplicates collapsed with a recorded merge reason |
| 03-geocode | 02 | `NormalizedCandidate[]` | every candidate has valid UK coords + county; postcodes validated |
| 04-enrich | 03 | `NormalizedCandidate[]` | opening hours + offerings/categories filled where available; Google seam only if flagged |
| 05-images | 04 | `NormalizedCandidate[]` | each candidate has ranked image candidates with licence/attribution, or AI-fallback flag |
| 06-merge | 05 + live DB | `ChangeSet` | per-farm `FarmChange` using §6 policy; no writes |
| 07-load | 06 | `RunReport` | dry-run prints the diff; live applies idempotently; never blind-overwrites |

`RunReport`: `{ created, updated, noop, skipped, imagesAttached, categoriesLinked, errors, byField: Record<field, count> }` written to `.pipeline/run-report-<ts>.json`.

---

## §8 Safety, idempotency, observability

- **Dry-run-first:** `07-load` requires `--apply` to write; default is dry-run printing the `ChangeSet` diff. No `--force` flag exists.
- **No destructive DB ops:** additive `db push` only; never `migrate dev`; never `DROP`/`TRUNCATE`; never delete owner/user data.
- **Idempotent:** re-running 07 on an unchanged `ChangeSet` yields all-`noop`.
- **Retries/backoff (folds in Queue 7 hardening):** `lib/http.ts` retries idempotent GETs with exponential backoff + jitter, honours `Retry-After`, caps attempts, and logs each retry.
- **Structured logging:** `lib/log.ts` emits one JSON line per stage with `{ stage, source, level, counts, durationMs }`. No `console.log` soup.
- **Pinned, reproducible:** any new dep is pinned (Queue 7); the orchestrator records the exact source endpoints and query versions in the `RunReport`.

---

## §9 Slice breakdown (A–J) mapped to stages

Sized to the CLAUDE.md work-unit rules (<= 8 files, <= 300 changed LOC, <= 1 new dep per slice). Each is independently shippable and verifiable. Full TDD task detail will be written into the implementation plan (next step) for all ten.

| Slice | Title | Stage(s) | Core deliverable | Tests |
|-------|-------|----------|------------------|-------|
| **A** | Types + schema + provenance | foundation | `pipeline/types.ts`; additive Farm/Image columns via `db push`; extend `check-image-schema.ts` probe | probe asserts new columns present |
| **B** | Merge policy (TDD-first) | policy | `policy/merge-policy.ts` pure functions for §6 rules + matching + change-set | `merge-policy.test.ts` — written first, exhaustive precedence/never-clobber cases |
| **C** | Discover: OSM + FSA | 01 | `sources/overpass.ts`, `sources/fsa.ts`, `lib/http.ts`, `lib/log.ts`, `stages/01-discover.ts` | client parse tests on captured fixtures; http retry/backoff test |
| **D** | Normalize + dedupe | 02 | `stages/02-normalize.ts` + dedupe helpers | pure dedupe tests (same farm from OSM+FSA collapses) |
| **E** | Geocode | 03 | `sources/postcodes.ts`, `stages/03-geocode.ts` | postcode validation + reverse-lookup parse tests on fixtures |
| **F** | Enrich (hours, offerings) | 04 | `stages/04-enrich.ts`, `sources/google-hours.ts` (flag-gated, default off) | offering->category mapping tests; seam-disabled test |
| **G** | Images (CC sourcing + rank) | 05 | `sources/geograph.ts`, `sources/wikimedia.ts`, `stages/05-images.ts` | ranking tests; "no attribution = not attached" test; AI-fallback flag test |
| **H** | Merge stage (wire policy to DB) | 06 | `stages/06-merge.ts` | integration test: fixture candidates + fake DB rows -> expected ChangeSet |
| **I** | Load (dry-run-first apply) | 07 | `stages/07-load.ts` | dry-run prints diff/no writes; idempotent re-run = all noop (against a test DB or mocked client) |
| **J** | Orchestrator + retire Python | run | `pipeline/run.ts` (`--from/--to/--dry-run/--limit/--apply`); retire `farm-pipeline/`; docs; ledger | end-to-end dry-run on a small `--limit`; Python retirement documented |

Ordering rationale: A and B are the foundation (types + the tested policy) so every later slice composes against fixed contracts. C–G build the read side (no DB writes). H–I build the write side. J wires and retires.

---

## §10 Testing strategy

- **Pure-first:** merge policy, dedupe, ranking, offering-mapping, and parsers are pure functions tested with `node:test` against captured JSON fixtures in `pipeline/__fixtures__/`. No live API calls in tests.
- **Fixtures over network:** each source client ships a small captured-response fixture; client tests parse the fixture. Live calls happen only in manual `run.ts` dry-runs.
- **Load safety tested without the prod DB:** `07-load` logic is tested via a mocked Prisma client (or a disposable local DB) asserting dry-run = zero writes and idempotent re-run = all-noop.
- **Coverage target:** the policy module (Slice B) and dedupe/ranking are the highest-value targets; aim for exhaustive branch coverage there, lighter on thin IO wrappers.

---

## §11 Open questions and risks

- **OL-1 (licensing, blocking before public mixing):** OSM is ODbL (share-alike on the derived DB) and Geograph is CC BY-SA. Confirm our attribution surface (a `/data-attributions` page or footer credit) and whether ODbL share-alike obliges us to publish the derived farm dataset. **Action:** legal/operator confirmation before Slice G ships CC images publicly; the pipeline can build and dry-run regardless.
- **OL-2:** FSA business-type taxonomy is coarse; FSA alone over-includes non-farm food retailers. Mitigation: FSA corroborates OSM `shop=farm` and improves address quality; FSA-only candidates are flagged low-confidence, not auto-created.
- **R-1 (matching false-merges):** fuzzy name+distance matching (§6.3 rule 5) could merge two distinct nearby farms. Mitigation: tight 150 m radius + name similarity threshold; log every fuzzy match for review; never fuzzy-match across different `postcode`.
- **R-2 (Overpass rate limits):** a UK-wide sweep may hit public-instance limits. Mitigation: regioned queries, throttle + cache, and tolerate partial runs (resumable stages).
- **R-3 (no rollback on load):** writes are additive and never delete curated data, but a bad enrich could still write wrong machine values. Mitigation: dry-run-first is mandatory; `RunReport.byField` makes a bad field obvious; provenance lets a later run correct it.

---

## §12 Plan reconciliation (integrating this into the overall plan)

This redesign must replace, not sit beside, the stale plan. The reconciliation (applied to `docs/assistant/execution-ledger.md` alongside this spec):

1. **Queue 32 (Farm Pipeline Enrichment) -> SUPERSEDED.** Mark it superseded by this spec. Its Google-Places-crawl approach, `google-photos.ts`, `import-farms.ts --force`, and the unsafe `prisma migrate dev` "next step" are explicitly retired here. `farm-enrichment-plan.md` is likewise superseded.
2. **Map-a11y arc (Slices 2.1–2.8) -> recorded as a closed track.** The arc is complete in the running log but was never represented in the numbered queue; the Open Work Snapshot is refreshed to show it done (2.8 pending commit) rather than "Claude-side: none right now."
3. **Open Work Snapshot refreshed** to name this pipeline redesign as the current active arc (spec in review, plan pending) and to carry the live open threads from the 2026-05-23 handover (MapLibreShell 659-line extraction; the likely-dead `markerState`/`popoverPosition` scaffolding; the stale duplicate ledger at `farm-frontend/docs/assistant/execution-ledger.md`).

---

## §13 Rejected alternatives

- **Keep/modernise the Python `farm-pipeline`.** Rejected: cross-repo copy step + dual-env footgun; no benefit over unifying in TS where the load, schema, and image generators already live.
- **Google NearbySearch for discovery.** Rejected: incomplete coverage, metered cost, and ToS storage/display restrictions.
- **Google Photos for imagery.** Rejected: ToS forbids permanent storage, references expire, and it shifts the product's visual identity onto Google.
- **Single `dataSource` column instead of field-level provenance.** Rejected: cannot express owner-edited `name` + OSM `openingHours` on the same row, which is exactly what "never clobber curated data" requires.
- **One mega-load with `--force`.** Rejected: the current blind overwrite is the specific failure this redesign exists to remove.

---

## §14 Definition of done

- All ten slices A–J shipped; Python `farm-pipeline/` retired; `import-farms.ts` superseded by `pipeline/run.ts`.
- A live `run.ts --dry-run` over the full UK sweep produces a `RunReport` an operator can read, and a subsequent `--apply` is idempotent on re-run.
- Provenance is populated on every pipeline-touched farm; no owner/user field was overwritten (verified via `RunReport.byField` + spot check).
- Ledger reconciled per §12; this spec moved from DRAFT to CANONICAL.
