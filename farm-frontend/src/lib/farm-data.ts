import type { FarmShop } from '@/types/farm'

// Server-side farm data loading (reads directly from JSON file)
export async function getFarmData(): Promise<FarmShop[]> {
  try {
    // Use dynamic import to avoid ESLint issues
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // Read farm data directly from the JSON file
    const farmsPath = path.join(process.cwd(), 'data', 'farms.json')
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
export async function getFarmStats() {
  try {
    const farms = await getFarmData()
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

// Client-side farm data fetching (for map page only)
export async function fetchFarmDataClient(): Promise<FarmShop[]> {
  try {
    const response = await fetch('/api/farms?limit=2000', { 
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch farms data: ${response.status} ${response.statusText}`)
    }
    
    const farms = await response.json()
    return farms.filter((farm: FarmShop) => {
      if (!farm.location) return false
      
      const { lat, lng } = farm.location
      
      // Validate coordinates
      if (lat === null || lng === null || lat === undefined || lng === undefined) return false
      if (typeof lat !== 'number' || typeof lng !== 'number') return false
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false
      if (lat === 0 && lng === 0) return false
      
      return true
    })
  } catch (error) {
    console.error('Failed to fetch farm data:', error)
    throw error
  }
}
