import { z } from 'zod'

// Comprehensive FarmShop schema for validation
export const FarmShopSchema = z.object({
  id: z.string().min(1, 'Farm ID is required'),
  name: z.string().min(2, 'Farm name must be at least 2 characters').max(120, 'Farm name too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  location: z.object({
    lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
    lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
    address: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address too long'),
    city: z.string().max(80, 'City name too long').optional().default(''),
    county: z.string().min(1, 'County is required').max(80, 'County name too long'),
    postcode: z.string().min(1, 'Postcode is required').max(12, 'Postcode too long')
  }),
  hours: z.array(z.object({
    day: z.string().min(1, 'Day is required'),
    open: z.string().min(1, 'Opening time is required'),
    close: z.string().min(1, 'Closing time is required')
  })).optional(),
  offerings: z.array(z.string()).optional(),
  contact: z.object({
    phone: z.string().optional(),
    website: z.string().url('Invalid website URL').optional()
  }).optional(),
  verified: z.boolean().optional().default(false),
  description: z.string().optional(),
  updatedAt: z.string().optional()
})

export type FarmShop = z.infer<typeof FarmShopSchema>

// Deduplication utilities
export function dedupeFarmsBySlug(farms: FarmShop[]): FarmShop[] {
  const seen = new Map<string, string>() // slug -> county
  const deduped: FarmShop[] = []
  
  for (const farm of farms) {
    const existingCounty = seen.get(farm.slug)
    if (!existingCounty) {
      // First farm with this slug
      seen.set(farm.slug, farm.location.county)
      deduped.push(farm)
    } else if (existingCounty !== farm.location.county) {
      // Same slug but different county - likely different farms
      deduped.push(farm)
    }
    // Same slug and county - skip (duplicate)
  }
  
  return deduped
}

export function dedupeFarmsByPostcode(farms: FarmShop[]): FarmShop[] {
  const seen = new Map<string, string>() // postcode -> farm name
  const deduped: FarmShop[] = []
  
  for (const farm of farms) {
    const postcode = farm.location.postcode?.toLowerCase().replace(/\s+/g, '')
    if (postcode) {
      const existingName = seen.get(postcode)
      if (!existingName) {
        // First farm with this postcode
        seen.set(postcode, farm.name)
        deduped.push(farm)
      } else if (existingName !== farm.name) {
        // Different farm name with same postcode - keep it
        deduped.push(farm)
      }
      // Same postcode and name - skip (duplicate)
    } else {
      // Keep farms without postcodes
      deduped.push(farm)
    }
  }
  
  return deduped
}

export function dedupeFarmsByProximity(farms: FarmShop[], maxDistanceMeters: number = 10): FarmShop[] {
  const deduped: FarmShop[] = []
  
  for (const farm of farms) {
    if (!farm.location.lat || !farm.location.lng) {
      deduped.push(farm)
      continue
    }
    
    const isDuplicate = deduped.some(existingFarm => {
      if (!existingFarm.location.lat || !existingFarm.location.lng) return false
      
      const distance = calculateDistance(
        farm.location.lat, farm.location.lng,
        existingFarm.location.lat, existingFarm.location.lng
      )
      
      return distance <= maxDistanceMeters / 1000 // Convert to km
    })
    
    if (!isDuplicate) {
      deduped.push(farm)
    }
  }
  
  return deduped
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Comprehensive deduplication function
export function dedupeFarms(farms: FarmShop[]): { farms: FarmShop[], stats: { original: number, afterSlug: number, afterPostcode: number, afterProximity: number } } {
  const original = farms.length
  
  // Step 1: Remove invalid farms
  const validFarms = farms.filter(farm => {
    try {
      FarmShopSchema.parse(farm)
      return true
    } catch {
      return false
    }
  })
  
  // Step 2: Dedupe by slug
  const afterSlug = dedupeFarmsBySlug(validFarms)
  
  // Step 3: Dedupe by postcode
  const afterPostcode = dedupeFarmsByPostcode(afterSlug)
  
  // Step 4: Dedupe by proximity
  const afterProximity = dedupeFarmsByProximity(afterPostcode)
  
  return {
    farms: afterProximity,
    stats: {
      original,
      afterSlug: afterSlug.length,
      afterPostcode: afterPostcode.length,
      afterProximity: afterProximity.length
    }
  }
}
