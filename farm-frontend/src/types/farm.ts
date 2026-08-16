import type { FarmHeroImage } from '@/lib/farm-hero-image'
export type { FarmHeroImage }

export interface FarmImage {
  url: string
  alt?: string
  /** Provenance: owner/admin/user = real submitted photo; pipeline/other = CC/illustration. */
  uploadedBy?: string
  /** CC BY attribution string (CC images only). */
  attribution?: string
  /** Original source URL for the CC image (Geograph/Wikimedia). */
  sourceUrl?: string
  /** License identifier, e.g. "CC BY-SA 2.0" (CC images only). */
  license?: string
}

export interface FarmShop {
  id: string
  name: string
  slug: string
  images?: (string | FarmImage)[] // Support both string URLs and {url, alt} objects
  /**
   * Pre-selected hero image (Slice 1.1.3b) used by /shop/[slug] for the
   * full-bleed editorial hero. Null when no admin photo and no
   * Apothecary illustration exist for the farm; the client then
   * renders a typography-led hero instead.
   */
  heroImage?: FarmHeroImage | null
  location: {
    lat: number
    lng: number
    address: string
    city?: string
    county: string
    postcode: string
  }
  hours?: any[] // Allow any hours format
  offerings?: string[]
  /** Amenity IDs for facilities (wheelchair, cafe, pyo, organic, etc.) */
  amenities?: string[]
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  verified?: boolean | string // Allow both boolean and string
  description?: string
  /** Venue classification (2026-08-15): admitted values are 'shop' | 'pyo' | 'market_stall'; null/unset means unknown. */
  venueType?: string | null
  /** Human verification timestamp gating visitability claims; null means unverified. */
  venueVerifiedAt?: Date | string | null
  /** Raw OSM-parsed opening hours JSON (Task 7 gate input); parsed shape is OpeningHours[] when present, distinct from the legacy `hours` field above. */
  openingHours?: unknown
  updatedAt?: string
  distance?: number // Distance in kilometers from user location
  rating?: number | null
}

/**
 * Helper to extract image URL from FarmShop images
 * Handles both string URLs and {url, alt} objects
 */
export function getImageUrl(image: string | FarmImage | undefined): string | undefined {
  if (!image) return undefined
  if (typeof image === 'string') return image
  return image.url
}

