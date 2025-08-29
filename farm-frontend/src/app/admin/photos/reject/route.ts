import { NextRequest, NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { sendPhotoRejectedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const photoId = searchParams.get('id')

  if (!photoId) {
    return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 })
  }

  try {
    // Parse request body for reason
    const data = await req.json().catch(() => ({}))
    const reason = String(data.reason || '').slice(0, 240) // Guard length

    if (!reason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    // Get photo data
    const photoData = await redis.hGetAll(`photo:${photoId}`)
    if (!photoData || Object.keys(photoData).length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Convert Redis hash to object
    const photo: Record<string, string> = {}
    for (const [key, value] of Object.entries(photoData)) {
      photo[key] = String(value)
    }

    // Get admin info (you can enhance this based on your auth system)
    const adminEmail = 'admin@farmcompanion.co.uk' // Replace with actual admin session

    // Use Redis pipeline for atomic operations
    const pipeline = redis.multi()

    // Update photo status to rejected with moderation info
    pipeline.hSet(`photo:${photoId}`, { 
      status: 'rejected', 
      rejectedAt: Date.now(),
      rejectReason: reason,
      moderatedBy: adminEmail
    } as any)

    // Remove from moderation queue
    pipeline.lRem('moderation:queue', 1, photoId)

    // Remove from approved set if present (in case it was approved before)
    pipeline.sRem(`farm:${photo.farmSlug}:photos:approved`, photoId)

    await pipeline.exec()

    // Send rejection email (fire-and-forget)
    ;(async () => {
      try {
        if (photo.authorEmail) {
          // Get farm name from Redis if available
          let farmName = photo.farmSlug
          try {
            const farmData = await redis.get(`farm:${photo.farmSlug}`)
            if (farmData) {
              const farm = JSON.parse(String(farmData))
              farmName = farm.name || farm.title || photo.farmSlug
            }
          } catch (err) {
            console.warn('Could not fetch farm name for rejection email', { farmSlug: photo.farmSlug, error: err })
          }

          const guidelinesUrl = `${process.env.SITE_URL || 'https://www.farmcompanion.co.uk'}/photos/guidelines`

          await sendPhotoRejectedEmail({
            to: photo.authorEmail,
            farmName: farmName,
            farmSlug: photo.farmSlug,
            caption: photo.caption,
            reason,
            guidelinesUrl,
          })
        }
      } catch (err) {
        console.error('Non-fatal: rejected email failed', {
          error: err instanceof Error ? err.message : 'Unknown error',
          photoId,
          farmSlug: photo.farmSlug,
          authorEmail: photo.authorEmail
        })
      }
    })()

    // Redirect back to photos page
    return NextResponse.redirect(new URL('/admin/photos', req.url))
  } catch (error) {
    console.error('Error rejecting photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
