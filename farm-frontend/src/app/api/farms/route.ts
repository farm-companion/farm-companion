import { NextRequest, NextResponse } from 'next/server'
import type { FarmShop } from '@/types/farm'
import { performanceMiddleware } from '@/lib/performance-middleware'
import { CACHE_NAMESPACES, CACHE_TTL } from '@/lib/cache-manager'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

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
      images: farm.images.map(img => ({
        url: img.url,
        alt: img.altText || farm.name
      })),
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
        counties: countyFacets.map(c => c.county),
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

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/farms', request)

  try {
    logger.info('Processing farm submission')

    const farmData: FarmShopData = await request.json()

    // Validate required fields
    if (!farmData.name || !farmData.location?.address || !farmData.location?.county || !farmData.location?.postcode) {
      logger.warn('Missing required fields in farm submission', {
        hasName: !!farmData.name,
        hasAddress: !!farmData.location?.address,
        hasCounty: !!farmData.location?.county,
        hasPostcode: !!farmData.location?.postcode
      })
      throw errors.validation('Missing required fields: name, address, county, and postcode are required')
    }

    // Validate email format if provided
    if (farmData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(farmData.contact.email)) {
      logger.warn('Invalid email format in farm submission', { email: farmData.contact.email })
      throw errors.validation('Invalid email format')
    }

    // Validate website format if provided
    if (farmData.contact.website && !/^https?:\/\/.+/.test(farmData.contact.website)) {
      logger.warn('Invalid website format in farm submission', { website: farmData.contact.website })
      throw errors.validation('Website must start with http:// or https://')
    }

    // Validate coordinates if provided
    if (farmData.location.lat && (farmData.location.lat < 49 || farmData.location.lat > 61)) {
      logger.warn('Latitude out of UK bounds', { lat: farmData.location.lat })
      throw errors.validation('Latitude must be within UK bounds (49-61)')
    }
    if (farmData.location.lng && (farmData.location.lng < -8 || farmData.location.lng > 2)) {
      logger.warn('Longitude out of UK bounds', { lng: farmData.location.lng })
      throw errors.validation('Longitude must be within UK bounds (-8 to 2)')
    }

    // Validate postcode format (basic UK postcode validation)
    if (farmData.location.postcode && !/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(farmData.location.postcode)) {
      logger.warn('Invalid postcode format', { postcode: farmData.location.postcode })
      throw errors.validation('Please enter a valid UK postcode')
    }

    // Check for duplicates in database
    logger.info('Checking for duplicate farms', { name: farmData.name })

    const existingByName = await prisma.farm.findFirst({
      where: { name: { equals: farmData.name, mode: 'insensitive' } }
    })

    if (existingByName) {
      logger.warn('Duplicate farm name detected', {
        name: farmData.name,
        existingSlug: existingByName.slug
      })
      throw errors.conflict('A farm with this name already exists')
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
      logger.warn('Duplicate farm address detected', {
        address: farmData.location.address,
        postcode: farmData.location.postcode,
        existingSlug: existingByAddress.slug
      })
      throw errors.conflict('A farm at this address already exists')
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

    logger.info('Creating new farm in database', {
      name: farmData.name,
      slug,
      county: farmData.location.county
    })

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

    logger.info('Farm submission completed successfully', {
      farmId: newFarm.id,
      farmSlug: newFarm.slug,
      farmName: newFarm.name,
      status: 'pending'
    })

    return NextResponse.json({
      success: true,
      message: 'Farm submission received successfully. It will be reviewed by our team before being published.',
      farm: responseData
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error, 'api/farms[POST]')
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
