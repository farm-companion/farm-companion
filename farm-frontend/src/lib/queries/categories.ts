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

  return categories.map((cat: { _count: { farms: number } }) => ({
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
): Promise<{
  farms: Array<{
    id: string
    name: string
    slug: string
    description?: string
    location: {
      lat: number
      lng: number
      address: string
      city?: string
      county: string
      postcode: string
    }
    contact: {
      phone?: string
      email?: string
      website?: string
    }
    images: string[]
    verified: boolean
    hours: any
    categories: any[]
  }>
  total: number
  hasMore: boolean
}> {
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

  return { farms, total, hasMore: offset + farms.length < total }
}

/**
 * Get category statistics (top counties, farm count, etc.)
 */
export async function getCategoryStats(categorySlug: string): Promise<{
  total: number
  verified: number
  averageRating: number
  topCounties: Array<{ county: string; count: number }>
}> {
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
  const countyCount = farms.reduce((acc: Record<string, number>, farm: { county: string }) => {
    acc[farm.county] = (acc[farm.county] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCounties = Object.entries(countyCount)
    .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
    .slice(0, 10)
    .map(([county, count]: [string, number]) => ({ county, count }))

  // Calculate stats
  const verifiedCount = farms.filter((f: any) => f.verified).length
  const ratedFarms = farms.filter((f: any) => f.googleRating !== null)
  const avgRating =
    ratedFarms.length > 0
      ? ratedFarms.reduce((sum: number, f: any) => sum + Number(f.googleRating), 0) / ratedFarms.length
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
 * Optimized: Uses single aggregation query instead of two separate queries
 */
export async function getRelatedCategories(categorySlug: string, limit = 6): Promise<Array<{
  id: string
  name: string
  slug: string
  icon: string | null
  _count: {
    farms: number
  }
}>> {
  // First, get the category ID from slug
  const targetCategory = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  })

  if (!targetCategory) return []

  // Use aggregation to find categories that share the most farms with target category
  // This finds farm-category pairs where the farm also has the target category
  const relatedCategoryStats = await prisma.farmCategory.groupBy({
    by: ['categoryId'],
    where: {
      categoryId: { not: targetCategory.id },
      farm: {
        status: 'active',
        categories: {
          some: {
            categoryId: targetCategory.id,
          },
        },
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
    take: limit,
  })

  // Fetch category details for the related categories
  const categoryIds = relatedCategoryStats.map((stat: { categoryId: string }) => stat.categoryId)
  if (categoryIds.length === 0) return []

  const categories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
    },
    include: {
      _count: {
        select: {
          farms: {
            where: {
              farm: { status: 'active' },
            },
          },
        },
      },
    },
  })

  // Sort categories by the overlap count (preserve the order from aggregation)
  const categoryMap = new Map(categories.map((c: any) => [c.id, c]))
  const sortedCategories = relatedCategoryStats
    .map((stat: { categoryId: string }) => categoryMap.get(stat.categoryId))
    .filter((c): c is typeof categories[number] => c !== undefined)

  return sortedCategories
}

/**
 * Get top categories (by farm count)
 * Optimized: Uses database-level filtering, sorting, and limiting
 */
export async function getTopCategories(limit = 12) {
  const categories = await prisma.category.findMany({
    where: {
      farms: {
        some: {
          farm: {
            status: 'active',
          },
        },
      },
    },
    include: {
      _count: {
        select: {
          farms: {
            where: {
              farm: {
                status: 'active',
              },
            },
          },
        },
      },
    },
    orderBy: {
      farms: {
        _count: 'desc',
      },
    },
    take: limit,
  })

  return categories.map((cat: { _count: { farms: number } }) => ({
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
