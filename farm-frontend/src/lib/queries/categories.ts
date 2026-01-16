/**
 * Category Database Queries
 *
 * Reusable Prisma queries for category-related operations.
 *
 * @example
 * ```tsx
 * import { getAllCategories, getCategoryBySlug } from '@/lib/queries/categories'
 *
 * const categories = await getAllCategories()
 * const category = await getCategoryBySlug('organic-farms')
 * ```
 */

import { prisma } from '@/lib/prisma'

/**
 * Get all categories with farm counts
 */
export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          farms: true,
        },
      },
    },
    orderBy: {
      displayOrder: 'asc',
    },
  })

  return categories.map((cat) => ({
    ...cat,
    farmCount: cat._count.farms,
  }))
}

/**
 * Get a single category by slug with related data
 */
export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          farms: true,
        },
      },
      parent: true,
      children: {
        include: {
          _count: {
            select: {
              farms: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Get farms in a specific category
 */
export async function getFarmsByCategory(
  categorySlug: string,
  options: {
    limit?: number
    offset?: number
    county?: string
    featured?: boolean
  } = {}
) {
  const { limit = 50, offset = 0, county, featured } = options

  const where: any = {
    status: 'active',
    categories: {
      some: {
        category: {
          slug: categorySlug,
        },
      },
    },
  }

  if (county) where.county = county
  if (featured !== undefined) where.featured = featured

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

  // Transform to FarmShop format expected by FarmCard
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

  return { farms, total, hasMore: offset + farms.length < total }
}

/**
 * Get category statistics (top counties, farm count, etc.)
 */
export async function getCategoryStats(categorySlug: string) {
  const farms = await prisma.farm.findMany({
    where: {
      status: 'active',
      categories: {
        some: {
          category: { slug: categorySlug },
        },
      },
    },
    select: {
      county: true,
      verified: true,
      googleRating: true,
    },
  })

  // Count farms by county
  const countyCount = farms.reduce((acc, farm) => {
    acc[farm.county] = (acc[farm.county] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCounties = Object.entries(countyCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([county, count]) => ({ county, count }))

  // Calculate stats
  const verifiedCount = farms.filter((f) => f.verified).length
  const ratedFarms = farms.filter((f) => f.googleRating !== null)
  const avgRating =
    ratedFarms.length > 0
      ? ratedFarms.reduce((sum, f) => sum + Number(f.googleRating), 0) / ratedFarms.length
      : 0

  return {
    total: farms.length,
    verified: verifiedCount,
    averageRating: avgRating,
    topCounties,
  }
}

/**
 * Get related categories (based on farms that have both)
 */
export async function getRelatedCategories(categorySlug: string, limit = 6) {
  // Get farms in this category
  const farmsInCategory = await prisma.farm.findMany({
    where: {
      status: 'active',
      categories: {
        some: {
          category: { slug: categorySlug },
        },
      },
    },
    select: {
      id: true,
    },
  })

  const farmIds = farmsInCategory.map((f) => f.id)

  if (farmIds.length === 0) return []

  // Find other categories these farms belong to
  const relatedCategories = await prisma.category.findMany({
    where: {
      slug: { not: categorySlug },
      farms: {
        some: {
          farmId: { in: farmIds },
        },
      },
    },
    include: {
      _count: {
        select: {
          farms: true,
        },
      },
    },
    take: limit,
  })

  return relatedCategories
}

/**
 * Get top categories (by farm count)
 */
export async function getTopCategories(limit = 12) {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          farms: true,
        },
      },
    },
  })

  return categories
    .filter((cat) => cat._count.farms > 0)
    .sort((a, b) => b._count.farms - a._count.farms)
    .slice(0, limit)
    .map((cat) => ({
      ...cat,
      farmCount: cat._count.farms,
    }))
}

/**
 * Search categories by name
 */
export async function searchCategories(query: string) {
  return prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      _count: {
        select: {
          farms: true,
        },
      },
    },
    take: 10,
  })
}
