import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCurrentlyOpen } from '@/lib/farm-status'
import { createRouteLogger } from '@/lib/logger'

const logger = createRouteLogger('farms/open-now-count')

/**
 * GET /api/farms/open-now-count
 * Returns the count of farms currently open based on their opening hours.
 * Response is cached for 5 minutes.
 */
export async function GET() {
  const startTime = Date.now()

  try {
    // Fetch farms with opening hours
    const farms = await prisma.farm.findMany({
      where: {
        status: 'active',
        NOT: { openingHours: { equals: undefined } },
      },
      select: {
        id: true,
        openingHours: true,
      },
    })

    // Count currently open farms
    const now = new Date()
    let openCount = 0

    for (const farm of farms) {
      if (farm.openingHours && isCurrentlyOpen(farm.openingHours)) {
        openCount++
      }
    }

    const totalCount = farms.length

    logger.info('open now count calculated', {
      openCount,
      totalCount,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json(
      { openCount, totalCount },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    logger.error('failed to calculate open count', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Return fallback based on time of day
    const hour = new Date().getHours()
    const isBusinessHours = hour >= 9 && hour < 17
    const estimatedOpen = isBusinessHours ? 850 : 120

    return NextResponse.json(
      { openCount: estimatedOpen, totalCount: 1299, estimated: true },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
        },
      }
    )
  }
}
