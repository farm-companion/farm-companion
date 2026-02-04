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
  try {
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
  } catch (error) {
    console.warn(`[categories] getAllCategories failed (expected during build without DB): ${error}`)
    return []
  }
}

/**
 * Get a single category by slug with related data
 */
export async function getCategoryBySlug(slug: string) {
  try {
    return await prisma.category.findUnique({
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
  } catch (error) {
    console.warn(`[categories] getCategoryBySlug failed (expected during build without DB): ${error}`)
    return null
  }
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

  try {
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
  } catch (error) {
    console.warn(`[categories] getFarmsByCategory failed (expected during build without DB): ${error}`)
    return { farms: [], total: 0, hasMore: false }
  }
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
  try {
    const categoryWhere = {
      status: 'active' as const,
      categories: {
        some: {
          category: { slug: categorySlug },
        },
      },
    }

    // Use parallel database aggregations instead of in-memory processing
    const [total, verified, avgRating, countyStats] = await Promise.all([
      // Total count
      prisma.farm.count({ where: categoryWhere }),

      // Verified count
      prisma.farm.count({
        where: {
          ...categoryWhere,
          verified: true,
        },
      }),

      // Average rating
      prisma.farm.aggregate({
        where: {
          ...categoryWhere,
          googleRating: { not: null },
        },
        _avg: {
          googleRating: true,
        },
      }),

      // Top counties by farm count
      prisma.farm.groupBy({
        by: ['county'],
        where: categoryWhere,
        _count: {
          county: true,
        },
        orderBy: {
          _count: {
            county: 'desc',
          },
        },
        take: 10,
      }),
    ])

    const topCounties = countyStats.map((stat: { county: string; _count: { county: number } }) => ({
      county: stat.county,
      count: stat._count.county,
    }))

    return {
      total,
      verified,
      averageRating: avgRating._avg.googleRating ? Number(avgRating._avg.googleRating) : 0,
      topCounties,
    }
  } catch (error) {
    console.warn(`[categories] getCategoryStats failed (expected during build without DB): ${error}`)
    return { total: 0, verified: 0, averageRating: 0, topCounties: [] }
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
  try {
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
  } catch (error) {
    console.warn(`[categories] getRelatedCategories failed (expected during build without DB): ${error}`)
    return []
  }
}

/**
 * Get top categories (by farm count)
 * Optimized: Uses database-level filtering, sorting, and limiting
 */
export async function getTopCategories(limit = 12) {
  try {
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

    return categories.map((cat) => ({
      ...cat,
      farmCount: cat._count.farms,
    }))
  } catch (error) {
    console.warn(`[categories] getTopCategories failed (expected during build without DB): ${error}`)
    return []
  }
}

/**
 * Search categories by name
 */
export async function searchCategories(query: string) {
  try {
    return await prisma.category.findMany({
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
  } catch (error) {
    console.warn(`[categories] searchCategories failed (expected during build without DB): ${error}`)
    return []
  }
}
