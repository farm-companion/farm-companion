# Image Design System — Design Spec

Date: 2026-05-25
Status: Approved-pending-review
Owner: FlowCoder + operator

## Problem

Farm Companion has five image sources but no coherent system deciding which
appears where. The result feels incoherent and under-premium:

- Real photos (`uploadedBy` in `owner|admin|user`): few farms.
- Creative Commons photos (`uploadedBy='cc'`, harvested from Geograph/Wikimedia
  by the pipeline): 1,000+ exist, but all loaded with `status='pending'`
  (`pipeline/stages/07-load.ts:89`). Every display query filters to
  `status='approved'`, so they are invisible site-wide.
- Apothecary illustrations (`uploadedBy='ai_apothecary'`): sparse; the batch
  sweep was never run at scale.
- Pitti illustrations (`uploadedBy='ai_pitti'`): generated for all 3,426 farms
  this session, and (as a stopgap) wired into cards and the detail hero via
  PRs #210/#211 — over-applied.
- Legacy fake photos (`uploadedBy='ai_generator'`): suppressed everywhere.

There is already a council-approved two-style intent (`farm-hero-image.ts:1-13`,
2026-05-21): Apothecary = per-farm hero, Pitti = place-level surfaces. It was
never realized because Apothecary was never generated and CC photos were
stranded. This spec realizes it properly.

## North star

Real beats rendered. Lead with real photography; illustration is a graceful,
consistent fallback, never a generic placeholder. One coherent look per surface.

## The hierarchy (applied wherever a farm needs an image)

1. Real owner/admin/user photo.
2. QA-approved CC photo (real image of the actual place).
3. Branded illustration (style depends on surface — see surface map).
4. Typography-led hero (detail page only; last resort).

Tiers 1-2 are "real". Tier 3 is the illustration fallback.

## Style roles (approved)

- Apothecary (botanical, per-farm): the farm's owned illustration. Used as the
  illustration fallback on per-farm surfaces (cards, detail hero). Generated for
  every farm that lacks a real/CC photo.
- Pitti (railway-poster, scenic): place-level surfaces only — map popover,
  county pages, homepage. Recedes from per-farm cards/detail once Apothecary
  exists.

## Surface map

| Surface | Component | Image priority |
| --- | --- | --- |
| Shop list / find / counties / categories / best / nearby (cards) | `FarmCard` | real photo -> CC photo -> Apothecary |
| Farm detail hero | `FarmPageClient` | real photo -> CC photo -> Apothecary -> typography |
| Map popover / preview | `FarmPreviewCard`, `FarmPopup` | real photo -> CC photo -> Pitti |
| County pages | county components | Pitti (place art) |
| Homepage hero | home components | Pitti (place art) |

CC photo joins tiers 1-2 once QA-approved; until then surfaces fall through to
the illustration tier.

## Data-layer changes

1. `farm-hero-image.ts` `selectFarmHeroImage`: add `cc` to the real-photo set so
   approved CC photos become the detail hero with `style='photo'`. Keep the
   existing `owner|admin|user` -> photo and `ai_apothecary` -> apothecary rules.
   Remove the synthesised Pitti hero added in #211; replace with an Apothecary
   resolver fallback (see resolvers).
2. `farm-data.ts` `getFarmData` (cards): already includes `cc` (only excludes
   `ai_generator`/`ai_pitti`). No query change needed once CC is approved; the
   card hero priority moves to: `farm.images[0]` (real/cc) -> Apothecary resolver.
3. Resolvers: introduce `apothecaryFarmImageUrl(slug)` returning the Apothecary
   blob URL (`apothecary-farm-illustrations/<slug>/main.webp`), mirroring
   `pittiFarmImageUrl`. Cards and detail hero use the Apothecary resolver as the
   illustration fallback; popover/county/homepage keep `pittiFarmImageUrl`.
   Both render `unoptimized` (pre-optimised Hetzner webp; dodges the documented
   `/_next/image` 400 for that host).

## Phase 1 — CC photo QA and approval

Goal: move good CC photos from `pending` to `approved` so real imagery leads.

- Measure first: counts of `cc` images by `status`, farms with `cc`, farms with
  real photos, the resulting Apothecary gap. (Operator-approved DB read.)
- Vision QA script: for each pending `cc` image, call Claude vision with the
  farm name + county and the image. Return: relevance (does it depict the farm,
  a farm shop, or a clearly rural/agricultural scene for this place?), a quality
  score 1-5, and a verdict. Persist results to a JSON report under
  `.image-qa/cc-review.json` (resumable; never writes the DB in scoring mode).
- Triage: auto-approve clear wins (relevant + quality >= 4), reject clear junk
  (irrelevant or quality <= 2), queue the middle for human review.
- Review surface (MVP): a static HTML/JSON report the operator skims; a follow
  up may upgrade to an in-app admin queue. Approval is applied by a separate
  `--apply` pass that flips `status` for the accepted slug+url set, backed up
  first (reversible), one batch with progress logging.
- `selectFarmHeroImage` learns `cc`; gallery logic unchanged (CC already allowed
  in galleries once approved).

## Phase 2 — Apothecary generation

Goal: every farm without a real/CC photo has an Apothecary illustration.

- Resolver `apothecaryFarmImageUrl(slug)` + (if needed) a dedicated
  `generate-apothecary-batch.ts` mirroring `generate-pitti-batch.ts`
  (resumable HEAD-skip, concurrency pool, progress log), or extend the existing
  `generate-farm-images.ts` apothecary path for batch.
- Sample 10 farms first; operator confirms the premium look (visuals) before the
  full run.
- Target set: active farms with no real photo and no approved CC photo (computed
  after Phase 1). Multi-hour Runware spend, like Pitti. Out-of-band; farms show
  Apothecary as it uploads, Pitti/typography until then.

## Phase 3 — Placement rewire

Goal: realize the surface map.

- `FarmCard`: illustration fallback becomes Apothecary (not Pitti).
- `FarmPageClient`: illustration fallback becomes Apothecary (replaces #211 Pitti
  fallback); typography remains the final fallback.
- `FarmPreviewCard`/`FarmPopup`: keep Pitti.
- County/homepage: confirm Pitti usage; wire if missing.
- Each component change is a small, separately-verifiable slice.

## Phase 4 — Premium treatment

Goal: the polish that makes it feel premium (emil-design-eng principles).

- Consistent hero aspect ratio and `object-cover` framing across surfaces;
  consistent gradient/overlay token for illustration vs photo.
- Tasteful, restrained motion: hero/image entrance with `ease-out` under 300ms;
  card hover `transform`-only; respect `prefers-reduced-motion`; no animation on
  high-frequency actions.
- Aspect-ratio and loading treatment to avoid layout shift; blur-up where it
  helps.

## Testing

- Unit: `selectFarmHeroImage` gains tests for `cc` -> photo and Apothecary
  fallback ordering. Resolver URL shape tests for `apothecaryFarmImageUrl`.
- Vision QA script: unit-test the triage thresholds (pure function over scores).
- Each rewire slice: `tsc --noEmit`, `eslint`, `pnpm test:unit`, `pnpm build`,
  and a runtime curl proving the expected `<img>` on a sample farm.

## Risks and rollback

- CC quality: auto-approval could surface irrelevant images. Mitigation:
  conservative thresholds + human review queue + reversible `--apply` with
  backups. Rollback: flip the approved set back to `pending`.
- Spend/time: Apothecary batch is billable and multi-hour. Mitigation: sample
  gate, target only the gap, resumable batch.
- Visual regression: rewiring fallbacks could blank a surface. Mitigation:
  per-slice runtime curl verification; typography hero remains the detail-page
  safety net.

## Out of scope (for now)

- Full in-app admin moderation UI (Phase 1 ships a report + apply pass; UI is a
  later follow-up).
- JSON-LD `image` enrichment for SEO with illustration URLs (debatable; deferred).
- Regenerating Pitti (already complete).
