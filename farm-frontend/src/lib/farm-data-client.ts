import type { FarmShop } from '@/types/farm'

// Client-side farm data fetching (for map page only)
export async function fetchFarmDataClient(): Promise<FarmShop[]> {
  try {
    console.log('🔍 Fetching farm data from /data/farms.uk.json')
    const response = await fetch('/data/farms.uk.json', { 
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch farms data: ${response.status} ${response.statusText}`)
    }
    
    const farms = await response.json()
    console.log('🔍 Raw farm data loaded:', farms.length, 'farms')
    
    const validFarms = farms.filter((farm: FarmShop) => {
      if (!farm.location) {
        console.warn('❌ Farm missing location:', farm.id, farm.name)
        return false
      }
      
      const { lat, lng } = farm.location
      
      // Validate coordinates
      if (lat === null || lng === null || lat === undefined || lng === undefined) {
        console.warn('❌ Farm has null/undefined coordinates:', farm.id, farm.name, { lat, lng })
        return false
      }
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.warn('❌ Farm has non-number coordinates:', farm.id, farm.name, { lat, lng, latType: typeof lat, lngType: typeof lng })
        return false
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('❌ Farm has invalid coordinate range:', farm.id, farm.name, { lat, lng })
        return false
      }
      if (lat === 0 && lng === 0) {
        console.warn('❌ Farm has zero coordinates:', farm.id, farm.name)
        return false
      }
      
      return true
    })
    
    console.log('✅ Valid farms after filtering:', validFarms.length, 'out of', farms.length)
    return validFarms
  } catch (error) {
    console.error('Failed to fetch farm data:', error)
    throw error
  }
}
