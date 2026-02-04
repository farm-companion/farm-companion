import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRouteLogger } from '@/lib/logger'

const logger = createRouteLogger('farms/backfill-hours')

/**
 * Typical UK farm shop opening hours.
 * Mon-Sat 09:00-17:30, Sun 10:00-16:00.
 *
 * Stored in the array format that normalizeOpeningHours() parses:
 * [{day: 'Monday', open: '09:00', close: '17:30'}, ...]
 */
const DEFAULT_UK_FARM_HOURS = [
  { day: 'Monday', open: '09:00', close: '17:30' },
  { day: 'Tuesday', open: '09:00', close: '17:30' },
  { day: 'Wednesday', open: '09:00', close: '17:30' },
  { day: 'Thursday', open: '09:00', close: '17:30' },
  { day: 'Friday', open: '09:00', close: '17:30' },
  { day: 'Saturday', open: '09:00', close: '17:00' },
  { day: 'Sunday', open: '10:00', close: '16:00' },
]

/**
 * POST /api/farms/backfill-hours
 * Populates opening hours for all active farms that have no hours data.
 * Protected by a simple secret check. Idempotent: skips farms that already
 * have non-empty opening hours.
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  // Simple auth: require BACKFILL_SECRET env var or admin header
  const authHeader = request.headers.get('x-backfill-secret')
  const secret = process.env.BACKFILL_SECRET
  if (secret && authHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find farms with null or empty opening hours
    const farms = await prisma.farm.findMany({
      where: { status: 'active' },
      select: { id: true, openingHours: true },
    })

    let updated = 0
    let skipped = 0

    for (const farm of farms) {
      const hours = farm.openingHours
      // Skip farms that already have valid hours
      if (hours && Array.isArray(hours) && hours.length > 0) {
        skipped++
        continue
      }
      if (hours && typeof hours === 'object' && !Array.isArray(hours) && Object.keys(hours).length > 0) {
        skipped++
        continue
      }

      await prisma.farm.update({
        where: { id: farm.id },
        data: { openingHours: DEFAULT_UK_FARM_HOURS },
      })
      updated++
    }

    const durationMs = Date.now() - startTime

    logger.info('backfill hours complete', { updated, skipped, durationMs })

    return NextResponse.json({ updated, skipped, durationMs })
  } catch (error) {
    logger.error('backfill hours failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Backfill failed', detail: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
