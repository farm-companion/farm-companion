// Manifest of farms whose Pitti railway-poster illustration has been
// generated and uploaded to Hetzner blob storage at
// `pitti-farm-images/<slug>/main.webp`.
//
// Slice: 1.1.3d-3 (manifest established empty; operator grows it as
// per-farm Pitti illustrations are generated and uploaded via
// `pnpm generate:pitti farm <slug>` — see `pitti-blob.ts` for the
// upload path convention).
//
// Surface: map popover (`FarmPopup.tsx`, `FarmPreviewCard.tsx`).
// Pitti = PLACE per council assignment; renders only when no admin or
// Apothecary image already represents the farm.
//
// Why a manifest instead of a DB query at render time:
//  - Popover data is sourced from `getFarmData` and friends, which
//    deliberately filter out `ai_pitti` rows on listing surfaces
//    (Slice 1.1.3c Part 2). Threading a popover-only column through
//    every consumer would broaden the diff.
//  - A code-controlled allowlist makes Pitti enrollment a PR-reviewed
//    decision, gates against accidental rendering of partially-baked
//    illustrations, and decouples from the DB backfill cadence
//    (the blob is the source of truth; the DB row is documentation).
//
// Adding a farm after the asset is generated and uploaded:
//   1. Generate: `pnpm generate:pitti farm <slug>` (uploads to Hetzner)
//   2. Visual QA at the direct blob URL
//   3. Add the slug to `PITTI_FARM_IMAGES` below (alphabetical)
//   4. Verify map popover renders the Pitti illustration locally

export const PITTI_FARM_IMAGES: ReadonlySet<string> = new Set<string>([
  // Probe batch (2026-05-25): top-rated farms. Pitti railway-poster
  // illustrations generated via `pnpm generate:pitti farm-header <slug>
  // --county=...` and committed under public/images/pitti/. Grow this set.
  'cumbria-farmers',
  'roots-grocer',
  'ryedale-rare-native-breeds',
  'skelwith-fold-farm',
  'the-egg-shed-farm-shop',
  'town-end-farm-community-store',
])

/**
 * Resolve the Pitti illustration URL for a farm slug, or null if not enrolled.
 * Served as a committed static asset: public/images/pitti/farm-header-<slug>.webp.
 */
export function pittiFarmImageUrl(slug: string): string | null {
  if (!PITTI_FARM_IMAGES.has(slug)) return null
  return `/images/pitti/farm-header-${slug}.webp`
}
