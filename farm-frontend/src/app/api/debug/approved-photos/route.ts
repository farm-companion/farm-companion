import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/debug/approved-photos', request)

  try {
    logger.info('Processing approved photos debug request')

    const { searchParams } = new URL(request.url)
    const farmSlug = searchParams.get('farmSlug')

    if (!farmSlug) {
      logger.warn('Missing farmSlug parameter in debug request')
      throw errors.validation('Missing farmSlug parameter')
    }

    const client = await ensureConnection()

    logger.info('Fetching approved photos for farm', { farmSlug })

    // Get all approved photo IDs for this farm
    const approvedIds = await client.sMembers(`farm:${farmSlug}:photos:approved`)

    // Get photo data for each ID
    const photos = await Promise.all(approvedIds.map(async (id: string) => {
      try {
        const photoData = await client.hGetAll(`photo:${id}`)
        return {
          id,
          data: photoData,
          keys: Object.keys(photoData),
          url: photoData.url,
          status: photoData.status,
          farmSlug: photoData.farmSlug,
          caption: photoData.caption
        }
      } catch (error) {
        logger.error('Error fetching photo data in debug route', { photoId: id }, error as Error)
        return { id, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }))

    logger.info('Approved photos debug request completed', {
      farmSlug,
      approvedCount: approvedIds.length
    })

    return NextResponse.json({
      farmSlug,
      approvedCount: approvedIds.length,
      approvedIds,
      photos
    })

  } catch (error) {
    return handleApiError(error, 'api/debug/approved-photos')
  }
}
