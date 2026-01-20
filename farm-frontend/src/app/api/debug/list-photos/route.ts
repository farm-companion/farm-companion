import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/debug/list-photos', request)

  try {
    logger.info('Processing list photos debug request')

    const client = await ensureConnection()

    // Get all pending photos
    const pendingIds = await client.lRange('moderation:queue', 0, -1)

    logger.info('Fetching pending photos', { pendingCount: pendingIds.length })

    const photos = await Promise.all(pendingIds.map(async (id: string) => {
      try {
        const photoData = await client.hGetAll(`photo:${id}`)
        if (!photoData || Object.keys(photoData).length === 0) return null

        // Convert Redis hash to object
        const photo: Record<string, string> = {}
        for (const [key, value] of Object.entries(photoData)) {
          photo[key] = String(value)
        }

        return photo
      } catch (error) {
        logger.error('Error fetching pending photo data', { photoId: id }, error as Error)
        return null
      }
    }))

    const validPhotos = photos.filter(Boolean)

    // Also get some approved photos
    const approvedPhotos = []
    const farmKeys = await client.keys('farm:*:photos:approved')

    logger.info('Fetching approved photos sample', { farmKeysCount: farmKeys.length })

    for (const farmKey of farmKeys.slice(0, 5)) { // Limit to first 5 farms
      const photoIds = await client.sMembers(farmKey)
      for (const photoId of photoIds.slice(0, 3)) { // Limit to first 3 photos per farm
        try {
          const photoData = await client.hGetAll(`photo:${photoId}`)
          if (photoData && Object.keys(photoData).length > 0) {
            const photo: Record<string, string> = {}
            for (const [key, value] of Object.entries(photoData)) {
              photo[key] = String(value)
            }
            approvedPhotos.push(photo)
          }
        } catch (error) {
          logger.error('Error fetching approved photo data', { photoId }, error as Error)
        }
      }
    }

    logger.info('List photos debug request completed', {
      pendingCount: validPhotos.length,
      approvedSampleCount: approvedPhotos.length
    })

    return NextResponse.json({
      pending: validPhotos,
      approved: approvedPhotos.slice(0, 10), // Limit to 10 approved photos
      totalPending: validPhotos.length,
      totalApproved: approvedPhotos.length
    })

  } catch (error) {
    return handleApiError(error, 'api/debug/list-photos')
  }
}
