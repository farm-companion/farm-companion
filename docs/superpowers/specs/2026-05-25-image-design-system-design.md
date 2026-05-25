# Image Design System — Design Spec

Date: 2026-05-25
Status: Approved-pending-review
Owner: FlowCoder + operator

## Problem

Farm Companion has several image sources but no coherent system deciding which
appears where, so the site feels incoherent and under-premium.

Production inventory (2026-05-25, 3,512 active farms):

- Real photos (`uploadedBy='admin'`, approved): 86 farms only.
- Apothecary illustrations (`uploadedBy='ai_apothecary'`): 1 image total. Never
  generated at scale.
- Pitti illustrations: no DB rows; all 3,512 served via the `pittiFarmImageUrl`
  resolver from Hetzner blob (generated this session). Wired into cards and the
  detail hero as a stopgap (PRs #210/#211) — over-applied.
- CC photos (`uploadedBy='cc'`, all `status='pending'`): 11,752 across 2,372
  farms, but they are 120x120 Geograph geo-search thumbnails (low-res, subject
  not guaranteed to be the farm). DECISION: ignore CC entirely; not premium.

There is a council-approved two-style intent (`farm-hero-image.ts:1-13`,
2026-05-21): Apothecary = per-farm hero, Pitti = place-level surfaces. This spec
realizes it: generate Apothecary at scale and put each style in its place.

## North star

Lead with real photography where it exists; otherwise a single, consistent
branded illustration per surface — never a generic placeholder. One coherent
look. Real photos are rare (86), so Apothecary is effectively the primary
per-farm visual and must look genuinely premium.

## The hierarchy (wherever a farm needs an image)

1. Real owner/admin/user photo.
2. Apothecary illustration (per-farm branded art).
3. Typography-led hero (detail page only; last resort if Apothecary missing).

CC photos are excluded.

## Style roles (approved)

- Apothecary (botanical, per-farm): the illustration fallback on per-farm
  surfaces — cards and detail hero. Generated for every farm without a real
  photo.
- Pitti (railway-poster, scenic): place-level surfaces only — map popover,
  county pages, homepage. Recedes from per-farm cards/detail once Apothecary
  exists.

## Surface map

| Surface | Component | Image priority |
| --- | --- | --- |
| Shop list / find / counties / categories / best / nearby (cards) | `FarmCard` | real photo -> Apothecary |
| Farm detail hero | `FarmPageClient` | real photo -> Apothecary -> typography |
| Map popover / preview | `FarmPreviewCard`, `FarmPopup` | real photo -> Pitti |
| County pages | county components | Pitti (place art) |
| Homepage hero | home components | Pitti (place art) |

## Data-layer / resolver changes

1. Resolver `apothecaryFarmImageUrl(slug)`: returns the Apothecary blob URL
   (`apothecary-farm-illustrations/<slug>/main.webp`), mirroring
   `pittiFarmImageUrl`. Rendered `unoptimized` (pre-optimised Hetzner webp;
   dodges the documented `/_next/image` 400 for that host).
2. `FarmCard`: illustration fallback becomes `apothecaryFarmImageUrl` (was
   `pittiFarmImageUrl` from #210). Priority: `farm.images[0]` (real) -> Apothecary.
3. `FarmPageClient`: detail-hero illustration fallback becomes Apothecary
   (replaces the #211 Pitti fallback); typography remains the final fallback.
   `selectFarmHeroImage` already surfaces `ai_apothecary` from DB rows; the
   resolver covers farms whose Apothecary is blob-only (no DB row), matching the
   Pitti pattern.
4. `FarmPreviewCard` / `FarmPopup`: keep `pittiFarmImageUrl`.

## Phase 1 — Apothecary generation

Goal: every farm without a real photo has a premium Apothecary illustration.

- Confirm the Apothecary generation path: `generate-farm-images.ts` has an
  apothecary style and an Apothecary blob uploader / prompt builder. Add a
  resumable batch (mirror `generate-pitti-batch.ts`: HEAD-skip already-uploaded,
  concurrency pool, progress log) if one does not already exist.
- Sample first: generate ~10 farms and have the operator confirm the premium
  look before the full run (this is the premium gate).
- Target set: active farms with no real (owner/admin/user) approved photo
  (~3,426). Multi-hour Runware spend, like Pitti. Out-of-band; farms show
  Apothecary as it uploads, typography until then.

## Phase 2 — Placement rewire

Goal: realize the surface map.

- `FarmCard`: swap the Pitti fallback for the Apothecary resolver.
- `FarmPageClient`: swap the #211 Pitti hero fallback for Apothecary; keep
  typography as the final fallback.
- `FarmPreviewCard` / `FarmPopup`: keep Pitti (place art).
- County / homepage: confirm Pitti usage; wire if missing.
- Each component change is a small, separately-verifiable slice.

## Phase 3 — Premium treatment

Goal: the polish that makes it feel premium (emil-design-eng principles).

- Consistent hero aspect ratio and `object-cover` framing across surfaces;
  consistent gradient/overlay token for illustration vs photo.
- Restrained motion: image/hero entrance `ease-out` under 300ms; card hover
  `transform`-only; respect `prefers-reduced-motion`; no animation on
  high-frequency actions.
- Aspect-ratio reservation to avoid layout shift; blur-up where it helps.

## Testing

- Unit: resolver URL-shape tests for `apothecaryFarmImageUrl`; `selectFarmHeroImage`
  ordering unchanged but re-verified.
- Apothecary batch: dry-run/sample verification; HEAD-check uploaded blobs.
- Each rewire slice: `tsc --noEmit`, `eslint`, `pnpm test:unit`, `pnpm build`,
  runtime curl proving the expected `<img>` on a sample farm.

## Risks and rollback

- Spend/time: Apothecary batch is billable and multi-hour. Mitigation: sample
  gate before the full run; target only farms lacking a real photo; resumable
  batch.
- Premium bar: AI illustration quality varies. Mitigation: sample-approve the
  look first; the FLUX corner-watermark mitigation (`cropBottomStrip`) from the
  Pitti work applies.
- Visual regression on rewire: a fallback swap could blank a surface.
  Mitigation: per-slice runtime curl; typography hero remains the detail-page
  safety net.

## Out of scope

- CC photos (ignored per decision).
- In-app admin moderation UI.
- JSON-LD `image` enrichment with illustration URLs (deferred).
- Regenerating Pitti (already complete).
