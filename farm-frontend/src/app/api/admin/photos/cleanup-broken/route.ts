import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { head } from '@vercel/blob'
import { getCurrentUser } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

/**
 * Batch process items with controlled concurrency
 */
async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 20
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
  }

  return results
}

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

    // Get all approved photo IDs from all farms
    const farmKeys = await client.keys('farm:*:photos:approved')

    logger.info('Fetching approved photos from farms', {
      farmCount: farmKeys.length,
      pendingCount: pendingIds.length
    })

    // Batch fetch all approved photo IDs using pipeline
    const pipeline = client.pipeline()
    for (const farmKey of farmKeys) {
      pipeline.sMembers(farmKey)
    }
    const farmResults = await pipeline.exec()

    // Flatten approved IDs from pipeline results
    const allApprovedIds: string[] = []
    if (farmResults) {
      for (const [err, ids] of farmResults) {
        if (!err && Array.isArray(ids)) {
          allApprovedIds.push(...ids)
        }
      }
    }

    const allPhotoIds = [...pendingIds, ...allApprovedIds]

    logger.info('Fetching photo metadata', {
      totalPhotos: allPhotoIds.length,
      pendingCount: pendingIds.length,
      approvedCount: allApprovedIds.length
    })

    // Batch fetch all photo metadata using pipeline
    const photoPipeline = client.pipeline()
    for (const photoId of allPhotoIds) {
      photoPipeline.hGetAll(`photo:${photoId}`)
    }
    const photoResults = await photoPipeline.exec()

    // Build photo data map
    const photoDataMap: Record<string, any> = {}
    if (photoResults) {
      for (let i = 0; i < photoResults.length; i++) {
        const [err, data] = photoResults[i]
        if (!err && data && typeof data === 'object' && Object.keys(data).length > 0) {
          photoDataMap[allPhotoIds[i]] = data
        }
      }
    }

    logger.info('Checking blob storage existence', {
      photosWithMetadata: Object.keys(photoDataMap).length
    })

    // Check blob storage existence with controlled concurrency (20 at a time)
    const photosToCheck = Object.entries(photoDataMap)
      .filter(([_, data]) => data.url)
      .map(([id, data]) => ({ id, data }))

    const blobCheckResults = await batchProcess(
      photosToCheck,
      async ({ id, data }) => {
        try {
          const pathname = data.url.replace('https://blob.vercel-storage.com/', '')
          await head(pathname)
          return { id, exists: true, data }
        } catch {
          return { id, exists: false, data }
        }
      },
      20 // Check 20 blobs concurrently
    )

    // Find broken photos
    const brokenPhotos = blobCheckResults
      .filter(result => !result.exists)
      .map(result => ({
        id: result.id,
        url: result.data.url,
        farmSlug: result.data.farmSlug,
        status: result.data.status,
      }))

    logger.info('Broken photo detection completed', {
      checked: allPhotoIds.length,
      broken: brokenPhotos.length
    })

    if (brokenPhotos.length === 0) {
      logger.info('No broken photos found')
      return NextResponse.json({
        success: true,
        checked: allPhotoIds.length,
        broken: 0,
        removed: 0,
        brokenPhotos: [],
      })
    }

    // Remove broken photos using pipeline for atomic operations
    const deletionPipeline = client.pipeline()
    for (const photo of brokenPhotos) {
      deletionPipeline.lRem('moderation:queue', 0, photo.id)
      if (photo.farmSlug) {
        deletionPipeline.sRem(`farm:${photo.farmSlug}:photos:approved`, photo.id)
      }
      deletionPipeline.del(`photo:${photo.id}`)
    }

    await deletionPipeline.exec()

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
      brokenPhotos,
    })
  } catch (error) {
    return handleApiError(error, 'api/admin/photos/cleanup-broken')
  }
}
