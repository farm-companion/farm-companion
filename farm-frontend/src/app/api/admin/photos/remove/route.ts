import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { revalidatePath } from 'next/cache'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/admin/photos/remove', req)

  try {
    const { searchParams } = new URL(req.url)
    const photoId = searchParams.get('id')

    if (!photoId) {
      throw errors.validation('Missing photo ID')
    }

    logger.info('Processing photo removal', { photoId })

    const client = await ensureConnection()

    // Get photo data
    const photoData = await client.hGetAll(`photo:${photoId}`)
    if (!photoData || Object.keys(photoData).length === 0) {
      logger.warn('Photo not found', { photoId })
      throw errors.notFound('Photo')
    }

    // Convert Redis hash to object
    const photo: Record<string, string> = {}
    for (const [key, value] of Object.entries(photoData)) {
      photo[key] = String(value)
    }

    logger.info('Removing photo', { photoId, farmSlug: photo.farmSlug })

    // Update photo status to removed
    await client.hSet(`photo:${photoId}`, 'status', 'removed')
    await client.hSet(`photo:${photoId}`, 'removedAt', Date.now().toString())

    // Remove from approved photos
    await client.sRem(`farm:${photo.farmSlug}:photos:approved`, photoId)

    // Revalidate the farm page
    revalidatePath(`/shop/${photo.farmSlug}`)

    logger.info('Photo removed successfully', {
      photoId,
      farmSlug: photo.farmSlug
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    return handleApiError(error, 'api/admin/photos/remove')
  }
}
