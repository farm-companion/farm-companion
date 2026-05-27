import type { FarmShop } from '@/types/farm'
import { prisma } from '@/lib/prisma'
import { selectFarmHeroImage } from '@/lib/farm-hero-image'

// Server-side farm data loading (reads from managed Postgres via Prisma)
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
          // Listing thumbnails: same selector mandate as the /shop hero.
          // Pitti is reserved for PLACE surfaces (homepage/county/popover);
          // ai_generator are legacy fake-photo rows. Both are filtered so a
          // farm whose admin photo or Apothecary illustration isn't flagged
          // isHero still gets the right card art (orderBy promotes the hero
          // when one exists, otherwise falls back to displayOrder).
          where: {
            status: 'approved',
            uploadedBy: { notIn: ['ai_generator', 'ai_pitti'] },
          },
          orderBy: [{ isHero: 'desc' }, { displayOrder: 'asc' }],
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
          address: farm.address ?? '',
          city: farm.city || undefined,
          county: farm.county ?? '',
          postcode: farm.postcode ?? '',
        },
        contact: {
          phone: farm.phone || undefined,
          email: farm.email || undefined,
          website: farm.website || undefined,
        },
        offerings: farm.categories.map((fc) => fc.category.name),
        images: farm.images.length > 0
          ? [farm.images[0].url]
          : undefined,
        verified: farm.verified,
      }))

    return validFarms
  } catch (error) {
    // Return empty array during build when DATABASE_URL is not available.
    // ISR will populate real data on the first request after deployment.
    console.warn(`[farm-data] getFarmData failed (expected during build without DB): ${error}`)
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
    console.warn(`[farm-data] getFarmStats failed (expected during build without DB): ${error}`)
    return { farmCount: 0, countyCount: 0 }
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

    const heroImage = selectFarmHeroImage(farm.images, farm.name)

    // Gallery = real photographs only (owner/admin/user uploads + CC/open
    // data). ALL AI imagery is excluded: an AI illustration in a farm's
    // gallery still implies "this is the farm" (design-law-reconciliation
    // 2026-05-27, DESIGN_BRIEF §2/§6 — gallery is submitted photos, never
    // an illustration). Also excludes the hero (no duplicate render).
    const galleryImages = farm.images
      .filter(img =>
        img.url !== heroImage?.url &&
        img.uploadedBy !== 'ai_pitti' &&
        img.uploadedBy !== 'ai_apothecary' &&
        img.uploadedBy !== 'ai_generator'
      )
      .map(img => img.url)

    return {
      id: farm.id,
      name: farm.name,
      slug: farm.slug,
      description: farm.description || undefined,
      location: {
        lat,
        lng,
        address: farm.address ?? '',
        city: farm.city || undefined,
        county: farm.county ?? '',
        postcode: farm.postcode ?? '',
      },
      contact: {
        phone: farm.phone || undefined,
        email: farm.email || undefined,
        website: farm.website || undefined,
      },
      offerings: farm.categories.map((fc) => fc.category.name),
      images: galleryImages.length > 0 ? galleryImages : undefined,
      heroImage,
      verified: farm.verified,
    }
  } catch (error) {
    console.warn(`[farm-data] getFarmBySlug failed (expected during build without DB): ${error}`)
    return null
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
