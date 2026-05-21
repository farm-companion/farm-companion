import type { FarmHeroImage } from '@/lib/farm-hero-image'
export type { FarmHeroImage }

export interface FarmImage {
  url: string
  alt?: string
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

