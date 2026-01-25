import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRouteLogger } from '@/lib/logger'

const logger = createRouteLogger('farms/weekend')

interface WeekendActivity {
  type: 'pyo' | 'market' | 'event' | 'cafe' | 'tour'
  label: string
}

/**
 * GET /api/farms/weekend
 * Returns farms with weekend activities (PYO, markets, cafes, tours).
 * Response is cached for 1 hour.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20)

    // Keywords that indicate weekend-friendly activities
    const weekendKeywords = [
      'pick your own',
      'pyo',
      'farm shop',
      'cafe',
      'coffee',
      'tea room',
      'market',
      'tour',
      'farm tour',
      'family',
      'children',
      'playground',
    ]

    // Fetch farms that are likely to have weekend activities
    const farms = await prisma.farm.findMany({
      where: {
        status: 'active',
        OR: weekendKeywords.map((keyword) => ({
          description: { contains: keyword, mode: 'insensitive' as const },
        })),
      },
      select: {
        slug: true,
        name: true,
        county: true,
        openingHours: true,
        description: true,
        categories: {
          select: {
            category: {
              select: { name: true },
            },
          },
        },
        images: {
          where: { status: 'approved' },
          take: 1,
          orderBy: { displayOrder: 'asc' },
          select: { url: true },
        },
      },
      take: limit * 2, // Fetch extra to filter
      orderBy: { googleRating: 'desc' },
    })

    // Process farms to extract activities
    const weekendFarms = farms
      .map((farm) => {
        const activities: WeekendActivity[] = []
        const categoryNames = farm.categories.map((c) => c.category.name.toLowerCase())
        const descLower = farm.description?.toLowerCase() || ''

        // Check for PYO
        if (
          categoryNames.some((c) => c.includes('pick') || c.includes('pyo')) ||
          descLower.includes('pick your own') ||
          descLower.includes('pyo')
        ) {
          activities.push({ type: 'pyo', label: 'PYO' })
        }

        // Check for cafe
        if (
          categoryNames.some((c) => c.includes('cafe') || c.includes('coffee') || c.includes('tea')) ||
          descLower.includes('cafe') ||
          descLower.includes('tea room')
        ) {
          activities.push({ type: 'cafe', label: 'Cafe' })
        }

        // Check for market
        if (
          categoryNames.some((c) => c.includes('market')) ||
          descLower.includes('farmers market') ||
          descLower.includes('farm market')
        ) {
          activities.push({ type: 'market', label: 'Market' })
        }

        // Check for tour
        if (
          categoryNames.some((c) => c.includes('tour')) ||
          descLower.includes('farm tour') ||
          descLower.includes('tours')
        ) {
          activities.push({ type: 'tour', label: 'Tours' })
        }

        // Default to market if no specific activities found but has farm shop
        if (activities.length === 0) {
          activities.push({ type: 'market', label: 'Farm Shop' })
        }

        // Parse weekend hours from openingHours JSON
        let saturdayHours: string | undefined
        let sundayHours: string | undefined

        if (farm.openingHours && typeof farm.openingHours === 'object') {
          const hours = farm.openingHours as Record<string, unknown>
          if (hours.saturday && typeof hours.saturday === 'string') {
            saturdayHours = hours.saturday
          }
          if (hours.sunday && typeof hours.sunday === 'string') {
            sundayHours = hours.sunday
          }
        }

        return {
          slug: farm.slug,
          name: farm.name,
          county: farm.county,
          image: farm.images[0]?.url || undefined,
          activities: activities.slice(0, 3),
          saturdayHours,
          sundayHours,
        }
      })
      .filter((farm) => farm.activities.length > 0)
      .slice(0, limit)

    logger.info('weekend farms fetched', {
      count: weekendFarms.length,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json(
      { farms: weekendFarms },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    logger.error('failed to fetch weekend farms', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { farms: [], error: 'Failed to fetch weekend farms' },
      { status: 500 }
    )
  }
}
