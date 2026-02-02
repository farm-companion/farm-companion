import type { FarmShop } from '@/types/farm'
import { prisma } from '@/lib/prisma'

// Server-side farm data loading (reads from Supabase via Prisma)
export async function getFarmData(): Promise<FarmShop[]> {
  try {
    const farms = await prisma.farm.findMany({
      where: {
        status: 'active',
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        images: {
          where: {
            status: 'approved',
            isHero: true,
          },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Transform Prisma Farm model to FarmShop type
    const validFarms: FarmShop[] = farms
      .filter((farm) => {
        // Validate coordinates
        const lat = Number(farm.latitude)
        const lng = Number(farm.longitude)
        if (!lat || !lng) return false
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false
        if (lat === 0 && lng === 0) return false
        return true
      })
      .map((farm) => ({
        id: farm.id,
        name: farm.name,
        slug: farm.slug,
        description: farm.description || undefined,
        location: {
          lat: Number(farm.latitude),
          lng: Number(farm.longitude),
          address: farm.address,
          city: farm.city || undefined,
          county: farm.county,
          postcode: farm.postcode,
        },
        contact: {
          phone: farm.phone || undefined,
          email: farm.email || undefined,
          website: farm.website || undefined,
        },
        offerings: farm.categories.map((fc) => fc.category.name),
        images: farm.images.length > 0
          ? [farm.images[0].url]
          : (farm.imageUrl ? [farm.imageUrl] : undefined),
        verified: farm.verified,
      }))

    return validFarms
  } catch (error) {
    throw new Error(`Failed to load farm data from database: ${error}`)
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
    throw new Error(`Failed to get farm stats: ${error}`)
  }
}

// Get a single farm by slug (for individual farm pages)
export async function getFarmBySlug(slug: string): Promise<FarmShop | null> {
  try {
    const farm = await prisma.farm.findFirst({
      where: {
        slug,
        status: 'active',
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        images: {
          where: {
            status: 'approved',
          },
          orderBy: {
            isHero: 'desc',
          },
        },
      },
    })

    if (!farm) return null

    // Validate coordinates
    const lat = Number(farm.latitude)
    const lng = Number(farm.longitude)
    if (!lat || !lng || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null
    }

    return {
      id: farm.id,
      name: farm.name,
      slug: farm.slug,
      description: farm.description || undefined,
      location: {
        lat,
        lng,
        address: farm.address,
        city: farm.city || undefined,
        county: farm.county,
        postcode: farm.postcode,
      },
      contact: {
        phone: farm.phone || undefined,
        email: farm.email || undefined,
        website: farm.website || undefined,
      },
      offerings: farm.categories.map((fc) => fc.category.name),
      images: farm.images.length > 0 ? farm.images.map((img) => img.url) : undefined,
      verified: farm.verified,
    }
  } catch (error) {
    throw new Error(`Failed to load farm by slug: ${error}`)
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
