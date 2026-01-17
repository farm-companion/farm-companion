/**
 * County Database Queries
 *
 * Reusable Prisma queries for county-related operations.
 *
 * @example
 * ```tsx
 * import { getAllCounties, getFarmsByCounty } from '@/lib/queries/counties'
 *
 * const counties = await getAllCounties()
 * const farms = await getFarmsByCounty('essex')
 * ```
 */

import { prisma } from '@/lib/prisma'

/**
 * Get all unique counties with farm counts
 */
export async function getAllCounties() {
  const counties = await prisma.farm.groupBy({
    by: ['county'],
    where: {
      status: 'active',
    },
    _count: {
      id: true,
    },
    orderBy: {
      county: 'asc',
    },
  })

  return counties.map((county: { county: string; _count: { id: number } }) => ({
    name: county.county,
    slug: slugifyCounty(county.county),
    farmCount: county._count.id,
  }))
}

/**
 * Get farms in a specific county
 */
export async function getFarmsByCounty(
  countySlug: string,
  options: {
    limit?: number
    offset?: number
    category?: string
    featured?: boolean
  } = {}
) {
  const { limit = 50, offset = 0, category, featured } = options

  // First, get the actual county name from slug
  const countyName = await getCountyNameFromSlug(countySlug)
  if (!countyName) {
    return { farms: [], total: 0, hasMore: false, countyName: null }
  }

  const where: any = {
    status: 'active',
    county: countyName,
  }

  if (category) {
    where.categories = {
      some: {
        category: { slug: category },
      },
    }
  }

  if (featured !== undefined) {
    where.featured = featured
  }

  const [rawFarms, total] = await Promise.all([
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
      orderBy: [
        { featured: 'desc' },
        { verified: 'desc' },
        { googleRating: { sort: 'desc', nulls: 'last' } },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.farm.count({ where }),
  ])

  // Transform to FarmShop format
  const farms = rawFarms.map((farm: any) => ({
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
    images: farm.images.map((img: { url: string }) => img.url),
    verified: farm.verified,
    hours: farm.openingHours as any,
    categories: farm.categories,
  }))

  return { farms, total, hasMore: offset + farms.length < total, countyName }
}

/**
 * Get county statistics
 * Optimized: Uses database-level aggregation instead of in-memory iteration
 */
export async function getCountyStats(countySlug: string) {
  const countyName = await getCountyNameFromSlug(countySlug)
  if (!countyName) return null

  // Use Promise.all to run queries in parallel
  const [
    totalCount,
    verifiedCount,
    featuredCount,
    ratingStats,
    categoryStats,
  ] = await Promise.all([
    // Total farms
    prisma.farm.count({
      where: {
        status: 'active',
        county: countyName,
      },
    }),

    // Verified farms count
    prisma.farm.count({
      where: {
        status: 'active',
        county: countyName,
        verified: true,
      },
    }),

    // Featured farms count
    prisma.farm.count({
      where: {
        status: 'active',
        county: countyName,
        featured: true,
      },
    }),

    // Average rating (database-level calculation)
    prisma.farm.aggregate({
      where: {
        status: 'active',
        county: countyName,
        googleRating: { not: null },
      },
      _avg: {
        googleRating: true,
      },
    }),

    // Category counts (database-level grouping)
    prisma.farmCategory.groupBy({
      by: ['categoryId'],
      where: {
        farm: {
          status: 'active',
          county: countyName,
        },
      },
      _count: {
        farmId: true,
      },
      orderBy: {
        _count: {
          farmId: 'desc',
        },
      },
      take: 10,
    }),
  ])

  // Fetch category details for top categories
  const categoryIds = categoryStats.map((c: { categoryId: string }) => c.categoryId)
  const categories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  // Map category details to counts
  const categoryMap = new Map(categories.map((c: any) => [c.id, c]))
  const topCategories = categoryStats
    .map((stat: { categoryId: string; _count: { farmId: number } }) => {
      const category = categoryMap.get(stat.categoryId)
      if (!category) return null
      return {
        name: category.name,
        slug: category.slug,
        count: stat._count.farmId,
      }
    })
    .filter((c): c is { name: string; slug: string; count: number } => c !== null)

  return {
    total: totalCount,
    verified: verifiedCount,
    featured: featuredCount,
    averageRating: ratingStats._avg.googleRating ? Number(ratingStats._avg.googleRating) : 0,
    topCategories,
  }
}

/**
 * Get related/nearby counties
 */
export async function getRelatedCounties(countySlug: string, limit = 6) {
  const countyName = await getCountyNameFromSlug(countySlug)
  if (!countyName) return []

  // Get all counties with farm counts
  const allCounties = await getAllCounties()

  // Filter out current county and sort by farm count
  const related = allCounties
    .filter((c: { slug: string }) => c.slug !== countySlug)
    .sort((a: { farmCount: number }, b: { farmCount: number }) => b.farmCount - a.farmCount)
    .slice(0, limit)

  return related
}

/**
 * Get top counties by farm count
 */
export async function getTopCounties(limit = 20) {
  const counties = await getAllCounties()

  return counties
    .filter((c: { farmCount: number }) => c.farmCount > 0)
    .sort((a: { farmCount: number }, b: { farmCount: number }) => b.farmCount - a.farmCount)
    .slice(0, limit)
}

/**
 * Search counties by name
 */
export async function searchCounties(query: string) {
  const counties = await getAllCounties()

  return counties.filter((c: { name: string }) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
}

/**
 * Get county name from slug
 */
async function getCountyNameFromSlug(slug: string): Promise<string | null> {
  // Get all unique counties
  const counties = await prisma.farm.findMany({
    where: {
      status: 'active',
    },
    distinct: ['county'],
    select: {
      county: true,
    },
  })

  // Find matching county by slug
  const match = counties.find((c: { county: string }) => slugifyCounty(c.county) === slug)
  return match?.county || null
}

/**
 * Slugify county name
 */
function slugifyCounty(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Generate static params for all counties
 */
export async function generateCountyParams() {
  const counties = await getAllCounties()
  return counties.map((county: { slug: string }) => ({ slug: county.slug }))
}
