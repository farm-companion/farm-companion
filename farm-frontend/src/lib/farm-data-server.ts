import type { FarmShop } from '@/types/farm'
import { prisma } from '@/lib/prisma'

// Server-side only farm data loading (reads from database)
export async function getFarmDataServer(): Promise<FarmShop[]> {
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
        images: farm.images.length > 0 ? [farm.images[0].url] : undefined,
        verified: farm.verified,
      }))

    console.log(`✅ Loaded ${validFarms.length} valid farms from database`)

    return validFarms
  } catch (error) {
    console.error('Error loading farm data from database:', error)
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
