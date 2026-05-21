// Hero-image selector for /shop/[slug] under the Pitti + Apothecary
// two-style visual system (council-approved 2026-05-21).
//
// Selection order:
//   1. Real admin photo: uploadedBy in owner|admin|user
//   2. Apothecary illustration: uploadedBy = ai_apothecary
//   3. null, caller renders a typography-led hero with no image
//
// Explicitly excluded:
//   - uploadedBy = ai_pitti: Pitti is reserved for hero, county, and
//     popover surfaces; it is not the per-farm /shop hero.
//   - uploadedBy = ai_generator: legacy fake-photo rows queued for
//     suppression in Slice 1.1.3c.
//
// Slice: 1.1.3b

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
  style: 'photo' | 'apothecary'
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

  const apothecary = sorted.find(img => img.uploadedBy === 'ai_apothecary')
  if (apothecary) {
    return {
      url: apothecary.url,
      alt: apothecary.altText || `${farmName} botanical illustration`,
      style: 'apothecary',
    }
  }

  return null
}
