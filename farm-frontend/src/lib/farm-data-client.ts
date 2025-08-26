import type { FarmShop } from '@/types/farm'
import { dedupeFarms } from './schemas'

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
    
    // Apply comprehensive validation and deduplication
    const { farms: validFarms, stats } = dedupeFarms(farms)
    
    console.log('📊 Farm data processing:', stats)
    console.log('✅ Valid farms after validation and deduplication:', validFarms.length, 'out of', farms.length)
    
    return validFarms
  } catch (error) {
    console.error('Failed to fetch farm data:', error)
    throw error
  }
}
