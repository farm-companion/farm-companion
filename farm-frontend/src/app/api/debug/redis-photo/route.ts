import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/debug/redis-photo', request)

  try {
    logger.info('Processing Redis photo debug request')

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('id')

    if (!photoId) {
      logger.warn('Missing photo ID parameter in debug request')
      throw errors.validation('Missing photo ID parameter')
    }

    const client = await ensureConnection()

    logger.info('Fetching photo data from Redis', { photoId })

    // Get the photo data
    const photoData = await client.hGetAll(`photo:${photoId}`)

    // Also check if it's in the moderation queue
    const queuePosition = await client.lPos('moderation:queue', photoId)

    logger.info('Redis photo debug request completed', {
      photoId,
      hasData: !!photoData && Object.keys(photoData).length > 0,
      inQueue: queuePosition !== null,
      queuePosition
    })

    return NextResponse.json({
      photoId,
      photoData,
      photoDataKeys: Object.keys(photoData || {}),
      photoDataValues: Object.values(photoData || {}),
      inQueue: queuePosition !== null,
      queuePosition,
      hasUrl: photoData?.url ? 'YES' : 'NO',
      url: photoData?.url || 'MISSING'
    })

  } catch (error) {
    return handleApiError(error, 'api/debug/redis-photo')
  }
}
