import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { head } from '@vercel/blob'
import { getCurrentUser } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/admin/photos/cleanup-deleted', request)

  try {
    logger.info('Processing deleted photos cleanup request')

    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized deleted photos cleanup attempt')
      throw errors.authorization('Unauthorized')
    }

    const client = await ensureConnection()

    // Get all pending photo IDs
    const pendingIds = await client.lRange('moderation:queue', 0, -1)

    // Get all approved photo IDs from all farms
    const farmKeys = await client.keys('farm:*:photos:approved')
    const allApprovedIds = []

    for (const farmKey of farmKeys) {
      const approvedIds = await client.sMembers(farmKey)
      allApprovedIds.push(...approvedIds)
    }

    const allPhotoIds = [...pendingIds, ...allApprovedIds]
    const deletedPhotos = []

    logger.info('Starting deleted photo detection', {
      totalPhotos: allPhotoIds.length,
      pendingCount: pendingIds.length,
      approvedCount: allApprovedIds.length,
      farmKeysCount: farmKeys.length
    })

    // Check each photo
    for (const photoId of allPhotoIds) {
      try {
        const photoData = await client.hGetAll(`photo:${photoId}`)
        if (!photoData || !photoData.url) continue

        // Extract pathname from URL
        const url = photoData.url
        const pathname = url.replace('https://blob.vercel-storage.com/', '')

        // Check if file exists in blob storage
        try {
          await head(pathname)
          logger.info('Photo exists in blob storage', { photoId })
        } catch {
          logger.warn('Photo deleted from blob storage', { photoId, url })
          deletedPhotos.push({
            id: photoId,
            url: photoData.url,
            farmSlug: photoData.farmSlug,
            status: photoData.status
          })
        }
      } catch (error) {
        logger.error('Error checking photo', { photoId }, error as Error)
      }
    }

    logger.info('Deleted photo detection completed', {
      deletedCount: deletedPhotos.length
    })

    // Remove photos that were deleted from blob storage
    for (const photo of deletedPhotos) {
      try {
        // Remove from moderation queue
        await client.lRem('moderation:queue', 0, photo.id)

        // Remove from approved photos
        if (photo.farmSlug) {
          await client.sRem(`farm:${photo.farmSlug}:photos:approved`, photo.id)
        }

        // Delete photo metadata
        await client.del(`photo:${photo.id}`)

        logger.info('Removed deleted photo', { photoId: photo.id, url: photo.url })
      } catch (error) {
        logger.error('Error removing photo', { photoId: photo.id }, error as Error)
      }
    }

    logger.info('Deleted photos cleanup completed', {
      checked: allPhotoIds.length,
      deleted: deletedPhotos.length,
      removed: deletedPhotos.length
    })

    return NextResponse.json({
      success: true,
      checked: allPhotoIds.length,
      deleted: deletedPhotos.length,
      removed: deletedPhotos.length,
      deletedPhotos
    })

  } catch (error) {
    return handleApiError(error, 'api/admin/photos/cleanup-deleted')
  }
}
