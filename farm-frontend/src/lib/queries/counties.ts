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

  return counties.map((county) => ({
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
  const farms = rawFarms.map((farm) => ({
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
    images: farm.images.map((img) => img.url),
    verified: farm.verified,
    hours: farm.openingHours as any,
    categories: farm.categories,
  }))

  return { farms, total, hasMore: offset + farms.length < total, countyName }
}

/**
 * Get county statistics
 */
export async function getCountyStats(countySlug: string) {
  const countyName = await getCountyNameFromSlug(countySlug)
  if (!countyName) return null

  const farms = await prisma.farm.findMany({
    where: {
      status: 'active',
      county: countyName,
    },
    select: {
      id: true,
      verified: true,
      featured: true,
      googleRating: true,
      categories: {
        include: {
          category: true,
        },
      },
    },
  })

  // Count farms by category
  const categoryCount: Record<string, { name: string; slug: string; count: number }> = {}

  farms.forEach((farm) => {
    farm.categories.forEach((fc) => {
      const catSlug = fc.category.slug
      if (!categoryCount[catSlug]) {
        categoryCount[catSlug] = {
          name: fc.category.name,
          slug: catSlug,
          count: 0,
        }
      }
      categoryCount[catSlug].count++
    })
  })

  const topCategories = Object.values(categoryCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Calculate stats
  const verifiedCount = farms.filter((f) => f.verified).length
  const featuredCount = farms.filter((f) => f.featured).length
  const ratedFarms = farms.filter((f) => f.googleRating !== null)
  const avgRating =
    ratedFarms.length > 0
      ? ratedFarms.reduce((sum, f) => sum + Number(f.googleRating), 0) / ratedFarms.length
      : 0

  return {
    total: farms.length,
    verified: verifiedCount,
    featured: featuredCount,
    averageRating: avgRating,
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
    .filter((c) => c.slug !== countySlug)
    .sort((a, b) => b.farmCount - a.farmCount)
    .slice(0, limit)

  return related
}

/**
 * Get top counties by farm count
 */
export async function getTopCounties(limit = 20) {
  const counties = await getAllCounties()

  return counties
    .filter((c) => c.farmCount > 0)
    .sort((a, b) => b.farmCount - a.farmCount)
    .slice(0, limit)
}

/**
 * Search counties by name
 */
export async function searchCounties(query: string) {
  const counties = await getAllCounties()

  return counties.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
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
  const match = counties.find((c) => slugifyCounty(c.county) === slug)
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
  return counties.map((county) => ({ slug: county.slug }))
}
