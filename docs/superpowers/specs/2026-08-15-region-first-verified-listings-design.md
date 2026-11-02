# Region-first verified listings: venue classification and real opening hours

Supersedes the venue-classification assumptions in
`2026-05-23-farm-data-pipeline-redesign.md`. That spec treated FSA as a
discovery source of farm shops. It is not. See Evidence.

## Evidence (all measured 2026-08-15, not estimated)

Live data, `/api/farms?limit=2000` (a 2,000-row alphabetical slice of ~3,512):

| Field | Coverage |
|---|---|
| Any contact method | 9.8% (phone 4.8%, website 8.4%, email 0%) |
| Opening hours | 0% |
| Verified | 0% |
| Rating | 0% |
| Any image | 0.3% (7 rows, all AI-generated) |
| Description not the template `"X is a farm shop in Y."` | 16.1% |
| Names containing no retail word at all | **65.2%** |

Google Search Console, ~92 days: **379 clicks**, 2,594 indexed pages, 2,225 not
indexed. The average indexed page earns roughly one click every 20 months.

OpenStreetMap, live Overpass query for UK `shop=farm`: **1,161 elements**,
`opening_hours` 20.4%, phone 14.6%, website 26.6%, postcode 46.6%. Only 233 rows
carry both a name and hours, scattered so thinly that the densest postcode area
holds six.

Recoverable Google Places export (`dist/farms.uk.json`, untracked, also in git at
`71d40af^`): **1,218 records**, place_id 100%, phone 89.7%, website 82.8%,
rating 99.1%, images 96.0%, hours 0%.

## Problem

Three distinct failures, in order of severity.

**1. The listings assert things that are false.** `01-discover` fetches FSA
`businessTypeId=7838`, which is FSA's "Farmers/growers" category. That is a
*producer* classification: it means the business grows or farms things, not that
it has premises the public can enter. The pipeline already carries guards for
symptoms of this (a fishing-vessel name filter, because FSA files commercial
boats under Farmers/growers, and a chain filter with a passing test for
`farmfoods`), but the category itself is the defect. A random sample of live rows
returns "Mr D & Mrs H Harries", "Ben Heath", "B Bluff and Sons", "Ardenlodge
Poultry", "Culquha Farm Ltd (Dairy)". Every one is rendered as "is a farm shop
in [county]". Against a PRODUCT.md whose first principle is that trust is the
product, this is the most serious defect in the codebase.

**2. There are no opening hours, anywhere.** The OPEN NOW filter pill, the status
pill on the map preview card, and the `nextOpening` line are all live UI backed
by 0% data. For the producer rows this is the correct answer, because a wheat
farm has no opening hours.

**3. The enrichment that once existed was retired on a false premise.** Commit
`71d40af` (2026-05-24) removed the Python pipeline stating the TypeScript
pipeline "fully supersedes" it. The TS pipeline's sources are FSA, postcodes.io,
Wikimedia Commons, Geograph, and the LLM APIs. It has no Google Places
integration. The swap traded 1,218 rich records for a larger, emptier set.

## Decisions (user-approved)

- **Inclusion rule: retail, PYO, and market stalls.** A listing must be somewhere
  the public can buy from. Pick-your-own and farmers-market pitches count;
  seasonal-only opening counts. Producers with no public access do not.
- **Region-first.** One launch region, verified properly, rather than 3,512 rows
  improved marginally. At four clicks per day there is no domain authority to
  win national queries, and precision at this scale needs human judgement, which
  only works over a small surface.
- **Google Places is the hours engine, OSM is the free baseline.** OSM alone
  yields 233 usable rows nationally, which makes no query winnable.
- **Unparseable hours yield null, never a guess.**

## Design

### Venue model

Two new nullable fields on `Farm`. The existing `verified: Boolean`, `status`,
`provenance: Json`, `dataSource`, and `lastEnrichedAt` stay as they are.

- `venueType`: `shop | pyo | market_stall | producer_no_public_access | unknown`.
  The inclusion rule admits the first three. **Default `unknown` for all
  existing rows.**
- `venueVerifiedAt`: nullable timestamp. Non-null means a human confirmed it.

The existing `verified: Boolean` is currently false on 100% of rows and carries
no defined meaning. It is reserved here for a different question, owner
confirmation of the listing, and is **not** read by either gate below. Only
`venueVerifiedAt` gates claims. If `verified` is still unused when the region
ships, drop it rather than leave two flags that look interchangeable.

### Classification as an evidence graph

Each candidate is a node; each source contributes a typed edge. The verdict is a
function of which edges exist, not of which source arrived last.

| Edge | Signal | What it licenses |
|---|---|---|
| `E1` | OSM `shop=farm` | Retail. Strong. |
| `E2` | OSM `opening_hours` present | Public access with stated times. Strong. |
| `E3` | FSA `businessTypeId=7838` | Production only. Nothing about visitability. |
| `E4` | Name contains a retail lexeme | Weak. Matches 34.8% of rows. |
| | *Lexeme set, fixed and case-insensitive:* `shop`, `farmshop`, `store`, `stores`, `market`, `deli`, `butcher`, `dairy`, `bakery`, `creamery`, `cafe`, `kitchen`, `pantry`, `larder`, `produce`, `nursery`, `garden`. Changing this set changes the 34.8% figure and requires re-measuring. | |
| `E5` | Website mentions visiting, opening times, or a shop | Medium. |
| `E6` | Places retail `type` **and** `regular_opening_hours` | Strong. |
| `E7` | Human confirmation | Authoritative, terminal. |

**Invariant: no path to an admitted `venueType` may consist solely of `E3`.**

This single rule retires the false-claim problem. FSA becomes the corroborating
source its own code comment already claims it is, and stops being load-bearing.

Resolution is tiered rather than weighted, because weights are unfalsifiable and
tiers are testable:

- **Tier A, auto-classify:** `E1 ∧ (E2 ∨ E6)`
- **Tier B, review candidate:** `E1` alone, or `E4 ∧ (E5 ∨ E6)`
- **Tier C, stays `unknown`:** anything reachable only via `E3`
- **`E7` overrides all tiers** and is the only thing that sets `venueVerifiedAt`

Inside the launch region, Tiers A and B both go to human review, so the region
ships at `E7` throughout. Outside the region, **no tier writes `venueType` away
from `unknown`**. Tiers A and B only order the review backlog; they never
auto-admit a listing. This keeps exactly one way for a page to make a claim,
which is a human saying so.

**Integration point.** The pipeline is already a clean DAG:
`01-discover → 02-normalize → 03-geocode → 04-enrich → 05-images → 06-merge → 07-load`.
Classification is a pure module consumed by `06-merge`, not a new stage.
`07-load`'s `buildData` iterates `change.fields` generically, so adding
`venueType` to the mergeable field list (`06-merge.ts:28` and the parallel map at
`:39`) means **`07-load` requires no change** and venue decisions inherit the
existing provenance and field-diff machinery.

### Hours convergence

Two producers, one consumer contract. `formatOpeningStatus` consumes
`{ day, open, close }[]` (`src/lib/opening-hours.ts:1-5`), so both sources
normalize to that shape rather than each inventing one.

- OSM: `opening_hours` string → `parseOsmHours` → `{day, open, close}[]`
- Places: `regular_opening_hours` → `mapPlacesHours` → same shape

`parseOsmHours` supports a documented subset (`Mo-Sa 09:00-17:00`,
`Mo-Su 09:00-17:00`, `24/7`, semicolon-separated rule lists) and returns `null`
for anything else, including seasonal and holiday syntax. A wrong "Open now"
badge sends someone on a wasted drive, which is the exact failure this product
exists to prevent. Silence is cheap; a false green pill is expensive.

### The two gates

**Claim gate.** Visitability language, including the "is a farm shop" sentence,
renders only when `venueType ∈ {shop, pyo, market_stall} ∧ venueVerifiedAt IS NOT NULL`.
Otherwise the page states only what is known: a registered food producer in the
county, with no claim of access.

**Index gate**, layered above it. A page is indexable only when the claim gate
passes **and** it carries parsed opening hours, or at least two of the following
substantive fields: `phone`, `website`, a non-template `description`, one or more
`offerings` beyond the default "Farm Shops" tag, or a non-AI-generated image.
Counting is over that closed list; nothing else qualifies.

### Retroactive correction

Forward-only fixes do not help, because the false claims are already live and
indexed. Because `venueType` defaults to `unknown`, the claim gate silences every
unverified page the moment it ships. A targeted backfill then nulls descriptions
matching exactly `^(.+?) is a farm shop in (.+?)\.$` where `venueType = 'unknown'`,
preserving prior values so the operation is replayable in reverse. That pattern
was measured at 83.8% of descriptions, so this is a precise operation over a
known set, not a heuristic sweep.

### Region selection

The first implementation task, executed as a deterministic query, not a guess:
rank candidate regions by OSM `shop=farm` rows carrying `opening_hours`,
overlapped against recovered Place IDs and current row density. Target **60 to
150 candidate rows**, which is one working day of human verification at a few
minutes each, and enough listings for a county page to be genuinely useful.
Below 60 the page is too thin to compete; above 150 verification slips past a
day and the region stops being a fast proof. Re-runnable if the first region
falls outside that band.

## Files

- `prisma/schema.prisma`: two nullable fields plus migration
- `src/scripts/pipeline/lib/classify-venue.ts` (new, pure) and its test
- `src/scripts/pipeline/lib/parse-osm-hours.ts` (new, pure) and its test
- `src/scripts/pipeline/stages/06-merge.ts`: call the classifier, extend the
  mergeable field list
- `src/scripts/pipeline/sources/places.ts` (new): Place ID restore and hours fetch
- `src/lib/farm-claims.ts` (new, pure): the claim gate predicate, consumed by
  `shop/[slug]` and the map preview card
- `scripts/backfill-null-false-descriptions.ts` (new, reversible)

## Verification

- `classifyVenue`: table-driven across evidence combinations, plus a property
  test asserting no `E3`-only input ever returns an admitted type. That test is
  the trust rule made executable.
- `parseOsmHours`: fixtures taken from the live Overpass pull, including
  adversarial values, asserting `null` for unsupported syntax rather than a
  partial parse.
- Claim gate: truth table over `venueType × venueVerifiedAt × field count`.
- `tsc --noEmit` exit 0, `npm run test:unit` green, `next build` exit 0,
  `npx impeccable detect` exit 0.
- Manual: the region's county page judged by hand against the current top three
  Google results for "farm shops in [region]".

## Risk and rollback

Every element is additive: two nullable columns, two pure modules, one classifier
call inside merge, two render conditionals. Reverting the commit restores current
behaviour. The description backfill retains prior values and replays backwards.

Failure modes: a Place ID returning `NOT_FOUND` clears `googlePlaceId` and flags
for rematch rather than silently retaining stale fields (the IDs are about a year
old, so expect some); a Places quota or billing failure degrades the run to
OSM-only rather than aborting, matching how `01-discover` already handles an
Overpass failure.

Legal posture: `place_id` may be stored indefinitely. Every other Places field is
treated as a short-lived cache on a refresh cycle, and photos are never
persisted. This also matches the previously observed production issue of expiring
`googlePhotoRef` URLs.

## Out of scope

The other ~3,300 records, the user contribution loop, seasonal produce mapping,
and the map data-layer performance work (the 1.06 MB payload and client-side
clustering of 2,000 points). Each depends on this landing first, and each gets
its own spec.
