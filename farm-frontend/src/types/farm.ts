export interface FarmImage {
  url: string
  alt?: string
}

export interface FarmShop {
  id: string
  name: string
  slug: string
  images?: (string | FarmImage)[] // Support both string URLs and {url, alt} objects
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

