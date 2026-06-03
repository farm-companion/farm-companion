import type { FarmImage, FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'

/**
 * Farm imagery resolution shared by the map surfaces (FarmListCard,
 * FarmPreviewCard, ClusterPreview), extracted from FarmListCard (M2) so every
 * surface agrees on what counts as a real photo and what the branded
 * monogram fallback shows.
 *
 * Hierarchy (hybrid-by-confidence): an owner/admin/user photo is full
 * documentary imagery; a CC photo (has attribution) is full imagery plus an
 * attribution cue; anything else (unattributed pipeline image, legacy string
 * URL, no image) falls back to the typographic monogram tile.
 */

/** Owner-grade provenance: a real submitted photo ("this is the farm"). */
export const OWNER_PROVENANCE = new Set(['owner', 'admin', 'user'])

export type FarmImageryKind = 'owner' | 'cc' | 'none'

export interface FarmImagery {
  kind: FarmImageryKind
  /** Resolved image URL; present iff kind is not 'none'. */
  url?: string
  /** The underlying image record, for attribution rendering. */
  image?: FarmImage
}

/** Coerce the legacy string-or-FarmImage first image into a FarmImage shape. */
export function firstImage(farm: Pick<FarmShop, 'images'>): FarmImage | undefined {
  const raw = farm.images?.[0]
  if (!raw) return undefined
  return typeof raw === 'string' ? { url: raw } : raw
}

/** Short, human source label for a CC attribution affordance. */
export function shortSource(img: FarmImage): string {
  if (img.sourceUrl) {
    try {
      return new URL(img.sourceUrl).hostname.replace(/^www\./, '')
    } catch {
      // fall through to the attribution string
    }
  }
  return (img.attribution ?? 'source').split(/[,(]/)[0].trim().slice(0, 24)
}

/**
 * Editorial monogram for the no-photo fallback tile: up to two initials drawn
 * from the leading significant words. A standalone "&" connector is ignored, a
 * leading digit is kept, and odd/empty names degrade to the first character or
 * a neutral mark so the tile is never blank.
 */
export function farmMonogram(name: string): string {
  const words = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter((w) => w && w !== '&')
  if (words.length === 0) return '·'
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}

/** Resolve a farm's display imagery per the confidence hierarchy above. */
export function resolveFarmImagery(farm: Pick<FarmShop, 'images'>): FarmImagery {
  const image = firstImage(farm)
  const url = image ? getImageUrl(image) : undefined
  if (!url || !image) return { kind: 'none' }
  if (image.uploadedBy && OWNER_PROVENANCE.has(image.uploadedBy)) {
    return { kind: 'owner', url, image }
  }
  if (image.attribution) return { kind: 'cc', url, image }
  return { kind: 'none' }
}
