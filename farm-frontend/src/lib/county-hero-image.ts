// Hero-image picker for /counties/[slug].
//
// Reuses imagery the site already has rather than generating new county
// illustrations: when a county has no dedicated Pitti illustration in
// PITTI_COUNTY_IMAGES, we surface a representative image from one of the
// county's own farms. Pitti is on nearly every farm, so any county with
// farms is guaranteed a hero.
//
// Precedence (richest first):
//   1. Real photo:           uploadedBy in owner|admin|user
//   2. Apothecary illustration: uploadedBy = ai_apothecary
//   3. Pitti illustration:   uploadedBy = ai_pitti  (coverage fallback)
//
// Excluded: ai_generator and unknown sources (legacy fake-photo rows).

/** Minimal shape required by the picker. Subset of the Prisma Image model. */
export interface CountyHeroImageInput {
  url: string
  uploadedBy: string
  isHero: boolean
  displayOrder: number
}

const REAL_PHOTO_LABELS = new Set(['owner', 'admin', 'user'])

// Lower rank = preferred. Rank 3 means "do not use".
function sourceRank(uploadedBy: string): number {
  if (REAL_PHOTO_LABELS.has(uploadedBy)) return 0
  if (uploadedBy === 'ai_apothecary') return 1
  if (uploadedBy === 'ai_pitti') return 2
  return 3
}

/**
 * Pick the best county hero image URL from a county's farm images, or
 * null when none are usable. Within a source tier, an explicit hero wins,
 * then the lowest displayOrder.
 */
export function pickCountyHeroImage(
  images: ReadonlyArray<CountyHeroImageInput>,
): string | null {
  if (!images || images.length === 0) return null

  const usable = images.filter((i) => sourceRank(i.uploadedBy) < 3)
  if (usable.length === 0) return null

  const best = [...usable].sort((a, b) => {
    const ra = sourceRank(a.uploadedBy)
    const rb = sourceRank(b.uploadedBy)
    if (ra !== rb) return ra - rb
    if (a.isHero !== b.isHero) return a.isHero ? -1 : 1
    return a.displayOrder - b.displayOrder
  })[0]

  return best.url
}
