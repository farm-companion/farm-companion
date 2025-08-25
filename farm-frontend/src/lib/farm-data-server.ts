import type { FarmShop } from '@/types/farm'

// Server-side only farm data loading (won't be bundled in client)
export async function getFarmDataServer(): Promise<FarmShop[]> {
  try {
    // Use dynamic import to avoid client bundling
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // Read farm data directly from the JSON file
    const farmsPath = path.join(process.cwd(), 'public', 'data', 'farms.uk.json')
    const farmsData = await fs.readFile(farmsPath, 'utf-8')
    const farms = JSON.parse(farmsData)
    
    // Filter and validate farms
    const validFarms = farms.filter((farm: FarmShop) => {
      if (!farm.name || !farm.location?.address) return false
      
      // Validate coordinates if present
      if (farm.location.lat && farm.location.lng) {
        const { lat, lng } = farm.location
        if (typeof lat !== 'number' || typeof lng !== 'number') return false
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false
        if (lat === 0 && lng === 0) return false
      }
      
      return true
    })
    
    console.log(`📊 Loaded ${validFarms.length} valid farms from JSON file`)
    return validFarms
  } catch (error) {
    console.error('Error loading farm data from JSON file:', error)
    return []
  }
}

// Utility function to get farm stats
export async function getFarmStatsServer() {
  try {
    const farms = await getFarmDataServer()
    const counties = new Set(farms.map((farm: FarmShop) => farm.location?.county).filter(Boolean))
    
    return {
      farmCount: farms.length,
      countyCount: counties.size
    }
  } catch (error) {
    console.warn('Error getting farm stats:', error)
    return { farmCount: 0, countyCount: 0 }
  }
}
