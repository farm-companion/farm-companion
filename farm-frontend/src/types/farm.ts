export interface FarmShop {
  id: string
  name: string
  slug: string
  images?: string[]
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
  rating?: number // Google rating 1-5
  user_ratings_total?: number // Total number of reviews
}
