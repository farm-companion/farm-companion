import { NextRequest, NextResponse } from 'next/server'
import type { FarmShop } from '@/types/farm'
import { performanceMiddleware } from '@/lib/performance-middleware'
import { CACHE_NAMESPACES, CACHE_TTL } from '@/lib/cache-manager'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  getViewportCached,
  cacheViewportFarms,
  getTileCacheStats,
  invalidateTilesForLocation,
} from '@/lib/viewport-cache'
import { decodeGeohashBounds } from '@/lib/geohash'

interface FarmShopData {
  name: string
  slug: string
  location: {
    lat: number
    lng: number
    address: string
    city?: string
    county: string
    postcode: string
  }
  contact: {
    website?: string
    email?: string
    phone?: string
  }
  hours: Array<{
    day: string
    open: string
    close: string
  }>
  offerings?: string[]
  story?: string
  images: Array<{
    id: string
    name: string
    size: number
    type: string
  }>
  verified: boolean
  verification: {
    method: string
    timestamp: string
  }
  seasonal: string[]
  updatedAt: string
}

// Prisma query result type with all relations
type FarmWithRelations = Prisma.FarmGetPayload<{
  include: {
    categories: {
      include: {
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    }
    images: true
    produce: {
      include: {
        produce: {
          select: {
            name: true,
            slug: true,
            seasonStart: true,
            seasonEnd: true,
            icon: true
          }
        }
      }
    }
  }
}>

// Enhanced GET endpoint with filtering using Prisma
async function farmsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const query = searchParams.get('q')?.toLowerCase()
    const county = searchParams.get('county')
    const category = searchParams.get('category')
    const produce = searchParams.get('produce') // Filter by produce slug
    const bbox = searchParams.get('bbox') // "west,south,east,north"
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build Prisma where clause
    const where: any = {
      status: 'active', // Only return active farms
    }

    // Text search (searches name, address, county, postcode)
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { county: { contains: query, mode: 'insensitive' } },
        { postcode: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    // County filter
    if (county) {
      where.county = county
    }

    // Category filter (through junction table)
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category
          }
        }
      }
    }

    // Produce filter (through FarmProduce junction table)
    if (produce) {
      where.produce = {
        some: {
          available: true,
          produce: {
            slug: produce
          }
        }
      }
    }

    // Bounding box filter with tile caching
    let useTileCache = false
    let tileCacheResult: Awaited<ReturnType<typeof getViewportCached>> | null = null

    if (bbox) {
      const [west, south, east, north] = bbox.split(',').map(Number)

      // Only use tile cache for bbox queries without text search (q parameter)
      // Text search requires full-text matching which doesn't work with tiles
      if (!query) {
        useTileCache = true
        tileCacheResult = await getViewportCached({
          minLat: south,
          maxLat: north,
          minLng: west,
          maxLng: east,
          filters: { category, produce, county },
        })
      }

      // Add bbox filter for direct queries or uncached tiles
      where.AND = [
        { latitude: { gte: south, lte: north } },
        { longitude: { gte: west, lte: east } }
      ]
    }

    // Query database with filters and pagination
    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        where,
        include: {
          categories: {
            include: {
              category: {
                select: {
                  name: true,
                  slug: true
                }
              }
            }
          },
          images: {
            where: { status: 'approved' },
            take: 3,
            orderBy: { displayOrder: 'asc' }
          },
          produce: {
            where: { available: true },
            include: {
              produce: {
                select: {
                  name: true,
                  slug: true,
                  seasonStart: true,
                  seasonEnd: true,
                  icon: true
                }
              }
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: [
          { featured: 'desc' }, // Featured farms first
          { verified: 'desc' }, // Then verified farms
          { googleRating: 'desc' }, // Then by rating
          { name: 'asc' } // Then alphabetically
        ]
      }),
      prisma.farm.count({ where })
    ])

    // Get facets for filtering UI
    const [countyFacets, categoryFacets] = await Promise.all([
      prisma.farm.groupBy({
        by: ['county'],
        where: { status: 'active' },
        _count: true,
        orderBy: { county: 'asc' }
      }),
      prisma.category.findMany({
        select: {
          name: true,
          slug: true,
          _count: {
            select: {
              farms: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })
    ])

    // Transform database farms to match expected format
    const transformFarm = (farm: FarmWithRelations) => ({
      id: farm.id,
      name: farm.name,
      slug: farm.slug,
      description: farm.description,
      location: {
        lat: Number(farm.latitude),
        lng: Number(farm.longitude),
        address: farm.address,
        city: farm.city || '',
        county: farm.county,
        postcode: farm.postcode
      },
      contact: {
        phone: farm.phone,
        email: farm.email,
        website: farm.website
      },
      hours: farm.openingHours || [],
      offerings: farm.categories.map(fc => fc.category.name),
      images: farm.images.map(img => ({
        url: img.url,
        alt: img.altText || farm.name
      })),
      produce: farm.produce.map(fp => ({
        name: fp.produce.name,
        slug: fp.produce.slug,
        seasonStart: fp.produce.seasonStart,
        seasonEnd: fp.produce.seasonEnd,
        icon: fp.produce.icon,
        isPYO: fp.isPYO
      })),
      verified: farm.verified,
      rating: farm.googleRating ? Number(farm.googleRating) : null,
      user_ratings_total: farm.googleReviewsCount || 0,
      updatedAt: farm.updatedAt.toISOString()
    })

    const transformedFarms = farms.map(transformFarm)

    // Handle tile cache integration
    let finalFarms = transformedFarms
    let cacheHitRate = 0

    if (useTileCache && tileCacheResult) {
      const { cachedFarms, uncachedTiles, allTiles, cacheHitRate: hitRate } = tileCacheResult
      cacheHitRate = hitRate

      if (cachedFarms.length > 0 && uncachedTiles.length === 0) {
        // Full cache hit - use cached data directly
        finalFarms = cachedFarms as typeof transformedFarms
      } else if (uncachedTiles.length > 0) {
        // Partial cache hit or miss - cache the fetched farms for uncached tiles
        await cacheViewportFarms(
          transformedFarms,
          uncachedTiles,
          { category, produce, county }
        )

        // Merge cached farms with newly fetched farms, dedupe by id
        const farmMap = new Map<string, typeof transformedFarms[0]>()
        for (const farm of cachedFarms as typeof transformedFarms) {
          farmMap.set(farm.id, farm)
        }
        for (const farm of transformedFarms) {
          farmMap.set(farm.id, farm)
        }
        finalFarms = Array.from(farmMap.values())
      }
    }

    // Get tile cache stats for monitoring
    const tileStats = useTileCache ? getTileCacheStats() : null

    return NextResponse.json({
      farms: finalFarms,
      total: useTileCache ? finalFarms.length : total,
      offset,
      limit,
      facets: {
        counties: countyFacets.map(c => c.county),
        categories: categoryFacets
          .filter(c => c._count.farms > 0)
          .map(c => c.slug)
      },
      timestamp: new Date().toISOString(),
      // Include cache stats for monitoring (only in development or with debug flag)
      ...(process.env.NODE_ENV === 'development' && tileStats ? {
        _cache: {
          hitRate: cacheHitRate.toFixed(1) + '%',
          stats: tileStats
        }
      } : {})
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error serving farm data:', error)
    return NextResponse.json(
      { error: 'Failed to load farm data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const farmData: FarmShopData = await request.json()

    // Validate required fields
    if (!farmData.name || !farmData.location?.address || !farmData.location?.county || !farmData.location?.postcode) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, county, and postcode are required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (farmData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(farmData.contact.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate website format if provided
    if (farmData.contact.website && !/^https?:\/\/.+/.test(farmData.contact.website)) {
      return NextResponse.json(
        { error: 'Website must start with http:// or https://' },
        { status: 400 }
      )
    }

    // Validate coordinates if provided
    if (farmData.location.lat && (farmData.location.lat < 49 || farmData.location.lat > 61)) {
      return NextResponse.json(
        { error: 'Latitude must be within UK bounds (49-61)' },
        { status: 400 }
      )
    }
    if (farmData.location.lng && (farmData.location.lng < -8 || farmData.location.lng > 2)) {
      return NextResponse.json(
        { error: 'Longitude must be within UK bounds (-8 to 2)' },
        { status: 400 }
      )
    }

    // Validate postcode format (basic UK postcode validation)
    if (farmData.location.postcode && !/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(farmData.location.postcode)) {
      return NextResponse.json(
        { error: 'Please enter a valid UK postcode' },
        { status: 400 }
      )
    }

    // Check for duplicates in database
    const existingByName = await prisma.farm.findFirst({
      where: { name: { equals: farmData.name, mode: 'insensitive' } }
    })

    if (existingByName) {
      return NextResponse.json(
        { error: 'A farm with this name already exists' },
        { status: 409 }
      )
    }

    const existingByAddress = await prisma.farm.findFirst({
      where: {
        AND: [
          { address: { equals: farmData.location.address, mode: 'insensitive' } },
          { postcode: { equals: farmData.location.postcode, mode: 'insensitive' } }
        ]
      }
    })

    if (existingByAddress) {
      return NextResponse.json(
        { error: 'A farm at this address already exists' },
        { status: 409 }
      )
    }

    // Generate unique slug
    const baseSlug = farmData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    let slug = baseSlug
    let counter = 1

    // Ensure slug is unique
    while (await prisma.farm.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create farm in database (status: pending for admin approval)
    const newFarm = await prisma.farm.create({
      data: {
        name: farmData.name,
        slug,
        description: farmData.story || null,
        address: farmData.location.address,
        city: farmData.location.city || null,
        county: farmData.location.county,
        postcode: farmData.location.postcode,
        latitude: farmData.location.lat || 0,
        longitude: farmData.location.lng || 0,
        phone: farmData.contact.phone || null,
        email: farmData.contact.email || null,
        website: farmData.contact.website || null,
        openingHours: farmData.hours || null,
        verified: false,
        featured: false,
        status: 'pending', // Requires admin approval
      },
      include: {
        categories: true,
        images: true
      }
    })

    // Invalidate viewport tile cache for this location
    if (farmData.location.lat && farmData.location.lng) {
      await invalidateTilesForLocation(farmData.location.lat, farmData.location.lng)
    }

    // Transform to match expected format
    const responseData = {
      id: newFarm.id,
      slug: newFarm.slug,
      name: newFarm.name,
      location: {
        lat: Number(newFarm.latitude),
        lng: Number(newFarm.longitude),
        address: newFarm.address,
        city: newFarm.city || '',
        county: newFarm.county,
        postcode: newFarm.postcode
      },
      contact: {
        phone: newFarm.phone,
        email: newFarm.email,
        website: newFarm.website
      },
      hours: newFarm.openingHours || [],
      offerings: [],
      description: newFarm.description || '',
      images: [],
      verified: false,
      updatedAt: newFarm.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Farm submission received successfully. It will be reviewed by our team before being published.',
      farm: responseData
    }, { status: 201 })

  } catch (error) {
    console.error('Error processing farm submission:', error)
    return NextResponse.json(
      { error: 'Failed to process farm submission' },
      { status: 500 }
    )
  }
}

// Export with performance middleware
export const GET = performanceMiddleware.cached(
  CACHE_NAMESPACES.FARMS,
  (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const county = searchParams.get('county') || ''
    const category = searchParams.get('category') || ''
    const produce = searchParams.get('produce') || ''
    const bbox = searchParams.get('bbox') || ''
    const limit = searchParams.get('limit') || '100'
    const offset = searchParams.get('offset') || '0'

    return `farms:${query}:${county}:${category}:${produce}:${bbox}:${limit}:${offset}`
  },
  CACHE_TTL.MEDIUM
)(farmsHandler)
