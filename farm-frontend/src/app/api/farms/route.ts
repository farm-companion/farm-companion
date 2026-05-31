import { NextRequest, NextResponse } from 'next/server'
import type { FarmShop } from '@/types/farm'
import { performanceMiddleware } from '@/lib/performance-middleware'
import { CACHE_NAMESPACES, CACHE_TTL } from '@/lib/cache-manager'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'
import { mapFarmImages } from './_image'

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
  }
}>

// Enhanced GET endpoint with filtering using Prisma
async function farmsHandler(request: NextRequest) {
  const logger = createRouteLogger('api/farms', request)

  try {
    logger.info('Processing farms data request')

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const query = searchParams.get('q')?.toLowerCase()
    const county = searchParams.get('county')
    const category = searchParams.get('category')
    const bbox = searchParams.get('bbox') // "west,south,east,north"
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build Prisma where clause
    const where: Prisma.FarmWhereInput = {
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

    // Bounding box filter (geographic bounds)
    if (bbox) {
      const [west, south, east, north] = bbox.split(',').map(Number)
      where.AND = [
        { latitude: { gte: south, lte: north } },
        { longitude: { gte: west, lte: east } }
      ]
    }

    logger.info('Fetching farms with filters', {
      query,
      county,
      category,
      bbox,
      limit,
      offset
    })

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

    // Transform farms to match expected format
    const transformedFarms = farms.map((farm: FarmWithRelations) => ({
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
      images: mapFarmImages(farm.images, farm.name),
      verified: farm.verified,
      rating: farm.googleRating ? Number(farm.googleRating) : null,
      user_ratings_total: farm.googleReviewsCount || 0,
      updatedAt: farm.updatedAt.toISOString()
    }))

    logger.info('Farms data request completed successfully', {
      farmCount: transformedFarms.length,
      total,
      offset,
      limit
    })

    return NextResponse.json({
      farms: transformedFarms,
      total,
      offset,
      limit,
      facets: {
        counties: countyFacets.map(c => c.county).filter((c): c is string => c !== null),
        categories: categoryFacets
          .filter(c => c._count.farms > 0)
          .map(c => c.slug)
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return handleApiError(error, 'api/farms')
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
    const bbox = searchParams.get('bbox') || ''
    const limit = searchParams.get('limit') || '100'
    const offset = searchParams.get('offset') || '0'
    
    return `farms:${query}:${county}:${category}:${bbox}:${limit}:${offset}`
  },
  CACHE_TTL.MEDIUM
)(farmsHandler)
