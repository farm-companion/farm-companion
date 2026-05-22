// Manifest of counties whose Pitti railway-poster illustration has been
// generated and committed to `public/images/pitti/county-<slug>.webp`.
//
// Slice: 1.1.3d-2 (manifest established empty; operator grows it in
// follow-up slices as illustrations are generated via
// `pnpm generate:pitti county <slug>`).
//
// Why a manifest instead of a HEAD-check at render time:
//  - Server Components run on every request; a HEAD request per render
//    would add 50-150ms latency for the >50 counties that will never
//    have a Pitti image (e.g. tiny historic counties with no farms).
//  - File-system existence checks won't work once images move to
//    Hetzner blob storage in a future scaling slice.
//  - A code-controlled allowlist is the single source of truth for
//    "this slug renders the editorial Pitti variant", and changes ride
//    in PRs with the binary asset, so review catches mismatches.
//
// Adding a county after the asset is generated and committed:
//   1. Generate: `pnpm generate:pitti county <slug>`
//   2. Rename the seed-suffixed output to `county-<slug>.webp`
//   3. Move it to `farm-frontend/public/images/pitti/`
//   4. Add the slug to `PITTI_COUNTY_IMAGES` below (alphabetical)
//   5. Verify `/counties/<slug>` renders the Pitti hero locally

export const PITTI_COUNTY_IMAGES: ReadonlySet<string> = new Set<string>([
  // Seed slugs land here as illustrations are generated.
])

/**
 * Resolve the Pitti hero image URL for a county slug, or null if no
 * illustration has been generated for that county yet.
 */
export function pittiCountyImageUrl(slug: string): string | null {
  if (!PITTI_COUNTY_IMAGES.has(slug)) return null
  return `/images/pitti/county-${slug}.webp`
}
