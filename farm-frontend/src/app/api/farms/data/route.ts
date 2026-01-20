import { NextResponse } from 'next/server'
import { getFarmData } from '@/lib/farm-data'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  const logger = createRouteLogger('api/farms/data')

  try {
    logger.info('Fetching farm data')

    const farms = await getFarmData()

    logger.info('Farm data fetched successfully', {
      total: farms.length
    })

    return NextResponse.json({
      farms,
      total: farms.length,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return handleApiError(error, 'api/farms/data')
  }
}
