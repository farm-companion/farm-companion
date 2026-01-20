import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { head } from '@vercel/blob'
import { getCurrentUser } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/admin/photos/cleanup-broken', request)

  try {
    logger.info('Processing broken photos cleanup request')

    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized broken photos cleanup attempt')
      throw errors.authorization('Unauthorized')
    }

    const client = await ensureConnection()

    // Get all pending photo IDs
    const pendingIds = await client.lRange('moderation:queue', 0, -1)

    // Get all approved photo IDs
    const approvedIds = await client.sMembers('farm:priory-farm-shop:photos:approved')

    const allPhotoIds = [...pendingIds, ...approvedIds]
    const brokenPhotos = []

    logger.info('Starting broken photo detection', {
      totalPhotos: allPhotoIds.length,
      pendingCount: pendingIds.length,
      approvedCount: approvedIds.length
    })

    // Check each photo
    for (const photoId of allPhotoIds) {
      try {
        const photoData = await client.hGetAll(`photo:${photoId}`)
        if (!photoData || !photoData.url) continue

        // Extract pathname from URL
        const url = photoData.url
        const pathname = url.replace('https://blob.vercel-storage.com/', '')

        // Check if file exists
        try {
          await head(pathname)
          logger.info('Photo exists in blob storage', { photoId, url })
        } catch {
          logger.warn('Photo broken in blob storage', { photoId, url })
          brokenPhotos.push({
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

    logger.info('Broken photo detection completed', {
      brokenCount: brokenPhotos.length
    })

    // Remove broken photos
    for (const photo of brokenPhotos) {
      try {
        // Remove from moderation queue
        await client.lRem('moderation:queue', 0, photo.id)

        // Remove from approved photos
        if (photo.farmSlug) {
          await client.sRem(`farm:${photo.farmSlug}:photos:approved`, photo.id)
        }

        // Delete photo metadata
        await client.del(`photo:${photo.id}`)

        logger.info('Removed broken photo', { photoId: photo.id, url: photo.url })
      } catch (error) {
        logger.error('Error removing photo', { photoId: photo.id }, error as Error)
      }
    }

    logger.info('Broken photos cleanup completed', {
      checked: allPhotoIds.length,
      broken: brokenPhotos.length,
      removed: brokenPhotos.length
    })

    return NextResponse.json({
      success: true,
      checked: allPhotoIds.length,
      broken: brokenPhotos.length,
      removed: brokenPhotos.length,
      brokenPhotos
    })

  } catch (error) {
    return handleApiError(error, 'api/admin/photos/cleanup-broken')
  }
}
