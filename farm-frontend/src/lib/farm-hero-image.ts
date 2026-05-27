// Hero-image selector for /shop/[slug].
//
// Imagery law (design-law-reconciliation 2026-05-27, DESIGN_BRIEF §2): an AI
// illustration must never hero a farm page — that implies "this is what this
// farm looks like", a claim we cannot back. Only a real submitted photograph
// earns the photo-led hero. Absent one, the hero is the name (typographic
// default), which the caller renders.
//
// Selection order:
//   1. Real submitted photo: uploadedBy in owner|admin|user  -> 'photo'
//   2. null -> caller renders the typographic hero (no image)
//
// Explicitly excluded as farm-page heroes (all AI imagery):
//   - ai_apothecary, ai_pitti: branded illustration, allowed on
//     homepage/county/seasonal surfaces (Layer 1/4), never the /shop hero.
//   - ai_generator: legacy fake-photo rows.
//
// Slice: 2.1 (typographic-default farm hero)

/**
 * Minimal shape required by the selector. Compatible with the Prisma
 * Image model (subset of fields).
 */
export interface FarmHeroImageInput {
  url: string
  altText?: string | null
  isHero: boolean
  displayOrder: number
  uploadedBy: string
  createdAt?: Date
}

/**
 * What the page receives. `style` tells the client which presentation
 * tone to use (a real photo can be rendered tighter; an illustration
 * deserves more breathing room and a different overlay treatment).
 */
export interface FarmHeroImage {
  url: string
  alt: string
  // The selector only ever returns 'photo'. The 'apothecary' | 'pitti'
  // members are retained for other surfaces (cards, county, popovers) that
  // still render branded illustration — they are never a farm-page hero.
  style: 'photo' | 'apothecary' | 'pitti'
}

const ADMIN_PHOTO_LABELS = new Set(['owner', 'admin', 'user'])

/**
 * Pick the hero image for a farm.
 *
 * Returns null when there is no admin-uploaded photo and no Apothecary
 * illustration. The caller is expected to render a typography-led hero
 * in that case (serif title plus kicker, no image).
 */
export function selectFarmHeroImage(
  images: ReadonlyArray<FarmHeroImageInput>,
  farmName: string,
): FarmHeroImage | null {
  if (!images || images.length === 0) return null

  const sorted = [...images].sort((a, b) => {
    if (a.isHero !== b.isHero) return a.isHero ? -1 : 1
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder
    const aTime = a.createdAt?.getTime() ?? 0
    const bTime = b.createdAt?.getTime() ?? 0
    return bTime - aTime
  })

  const adminPhoto = sorted.find(img => ADMIN_PHOTO_LABELS.has(img.uploadedBy))
  if (adminPhoto) {
    return {
      url: adminPhoto.url,
      alt: adminPhoto.altText || `${farmName} farm shop`,
      style: 'photo',
    }
  }

  // No real photo: caller renders the typographic hero. Apothecary/Pitti/
  // ai_generator rows are deliberately not promoted to the farm hero.
  return null
}
