export interface FarmProduce {
  name: string
  slug: string
  seasonStart: number
  seasonEnd: number
  icon?: string | null
  isPYO?: boolean
}

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
  produce?: FarmProduce[] // Seasonal produce available at this farm
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  verified?: boolean | string // Allow both boolean and string
  description?: string
  updatedAt?: string
  distance?: number // Distance in kilometers from user location
}
