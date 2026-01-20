import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/debug/photos', request)

  try {
    logger.info('Processing photos debug request')

    const client = await ensureConnection()

    // Get all pending photo IDs
    const pendingIds = await client.lRange('moderation:queue', 0, -1)

    logger.info('Fetching pending photos data', { pendingCount: pendingIds.length })

    // Get photo data for each ID
    const photos = await Promise.all(pendingIds.map(async (id: string) => {
      try {
        const photoData = await client.hGetAll(`photo:${id}`)
        return {
          id,
          data: photoData,
          keys: Object.keys(photoData),
          url: photoData.url,
          farmSlug: photoData.farmSlug,
          caption: photoData.caption
        }
      } catch (error) {
        logger.error('Error fetching photo data in debug route', { photoId: id }, error as Error)
        return { id, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }))

    logger.info('Photos debug request completed', {
      pendingCount: pendingIds.length,
      photosRetrieved: photos.length
    })

    return NextResponse.json({
      pendingCount: pendingIds.length,
      pendingIds,
      photos
    })

  } catch (error) {
    return handleApiError(error, 'api/debug/photos')
  }
}
