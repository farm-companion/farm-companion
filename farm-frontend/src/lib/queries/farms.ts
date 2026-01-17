/**
 * Farm Database Queries
 *
 * Reusable Prisma queries for farm-related operations.
 * All queries are optimized with proper includes and where clauses.
 *
 * @example
 * ```tsx
 * import { getFarmBySlug, searchFarms } from '@/lib/queries/farms'
 *
 * // Get single farm
 * const farm = await getFarmBySlug('manor-farm-shop')
 *
 * // Search farms
 * const results = await searchFarms({
 *   query: 'organic',
 *   county: 'Essex',
 *   limit: 20
 * })
 * ```
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Get a single farm by its slug
 * Includes categories, products, images, and approved reviews
 */
export async function getFarmBySlug(slug: string) {
  return prisma.farm.findUnique({
    where: { slug, status: 'active' },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      products: {
        orderBy: { name: 'asc' },
      },
      images: {
        where: { status: 'approved' },
        orderBy: { displayOrder: 'asc' },
      },
      reviews: {
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
}

/**
 * Search farms with filters and pagination
 */
export interface SearchFarmsParams {
  query?: string
  county?: string
  city?: string
  category?: string
  verified?: boolean
  featured?: boolean
  limit?: number
  offset?: number
  orderBy?: 'name' | 'rating' | 'newest'
}

export async function searchFarms(params: SearchFarmsParams) {
  const {
    query,
    county,
    city,
    category,
    verified,
    featured,
    limit = 20,
    offset = 0,
    orderBy = 'name',
  } = params

  const where: Prisma.FarmWhereInput = {
    status: 'active',
  }

  // Full-text search
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { county: { contains: query, mode: 'insensitive' } },
    ]
  }

  // Location filters
  if (county) where.county = county
  if (city) where.city = city

  // Category filter
  if (category) {
    where.categories = {
      some: {
        category: { slug: category },
      },
    }
  }

  // Status filters
  if (verified !== undefined) where.verified = verified
  if (featured !== undefined) where.featured = featured

  // Determine order
  let orderByClause: Prisma.FarmOrderByWithRelationInput = { name: 'asc' }
  if (orderBy === 'rating') {
    orderByClause = { googleRating: { sort: 'desc', nulls: 'last' } }
  } else if (orderBy === 'newest') {
    orderByClause = { createdAt: 'desc' }
  }

  // Execute query with pagination
  const [farms, total] = await Promise.all([
    prisma.farm.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        images: {
          where: { status: 'approved', isHero: true },
          take: 1,
        },
      },
      orderBy: orderByClause,
      take: limit,
      skip: offset,
    }),
    prisma.farm.count({ where }),
  ])

  return {
    farms,
    total,
    hasMore: offset + farms.length < total,
  }
}

/**
 * Get farms by county
 */
export async function getFarmsByCounty(county: string, limit = 20) {
  return prisma.farm.findMany({
    where: {
      county,
      status: 'active',
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      images: {
        where: { status: 'approved', isHero: true },
        take: 1,
      },
    },
    orderBy: [{ featured: 'desc' }, { googleRating: { sort: 'desc', nulls: 'last' } }],
    take: limit,
  })
}

/**
 * Get featured farms
 */
export async function getFeaturedFarms(limit = 6) {
  return prisma.farm.findMany({
    where: {
      featured: true,
      status: 'active',
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      images: {
        where: { status: 'approved', isHero: true },
        take: 1,
      },
    },
    orderBy: { googleRating: { sort: 'desc', nulls: 'last' } },
    take: limit,
  })
}

/**
 * Get farms near coordinates (requires raw SQL for geospatial query)
 */
export async function getFarmsNearby(lat: number, lng: number, radiusKm = 10, limit = 20) {
  // Using Haversine formula for distance calculation
  const farms = await prisma.$queryRaw<Array<any>>`
    SELECT
      *,
      (
        6371 * acos(
          cos(radians(${lat})) *
          cos(radians(latitude::float)) *
          cos(radians(longitude::float) - radians(${lng})) +
          sin(radians(${lat})) *
          sin(radians(latitude::float))
        )
      ) as distance
    FROM farms
    WHERE status = 'active'
    HAVING distance < ${radiusKm}
    ORDER BY distance ASC
    LIMIT ${limit}
  `

  return farms
}

/**
 * Get all counties with farm count
 */
export async function getCountiesWithCounts() {
  const counties = await prisma.farm.groupBy({
    by: ['county'],
    where: { status: 'active' },
    _count: true,
    orderBy: {
      _count: {
        county: 'desc',
      },
    },
  })

  return counties.map((item) => ({
    county: item.county,
    count: item._count,
  }))
}

/**
 * Get farm statistics
 */
export async function getFarmStats() {
  const [total, verified, featured, byCounty] = await Promise.all([
    prisma.farm.count({ where: { status: 'active' } }),
    prisma.farm.count({ where: { status: 'active', verified: true } }),
    prisma.farm.count({ where: { status: 'active', featured: true } }),
    prisma.farm.groupBy({
      by: ['county'],
      where: { status: 'active' },
      _count: true,
    }),
  ])

  return {
    total,
    verified,
    featured,
    counties: byCounty.length,
  }
}
