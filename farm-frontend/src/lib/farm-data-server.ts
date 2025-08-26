import type { FarmShop } from '@/types/farm'
import { dedupeFarms } from './schemas'

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
    
    // Apply comprehensive validation and deduplication
    const { farms: validFarms, stats } = dedupeFarms(farms)
    
    console.log(`📊 Farm data processing:`, stats)
    console.log(`✅ Loaded ${validFarms.length} valid, deduplicated farms from JSON file`)
    
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
