import { NextRequest, NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { sendPhotoApprovedEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const photoId = searchParams.get('id')

  if (!photoId) {
    return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 })
  }

  try {
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

    // Update photo status to approved with moderation info
    pipeline.hSet(`photo:${photoId}`, { 
      status: 'approved', 
      approvedAt: Date.now(),
      moderatedBy: adminEmail
    } as any)

    // Add to farm's approved photos set
    pipeline.sAdd(`farm:${photo.farmSlug}:photos:approved`, photoId)

    // Remove from moderation queue
    pipeline.lRem('moderation:queue', 1, photoId)

    await pipeline.exec()

    // Revalidate the farm page
    revalidatePath(`/shop/${photo.farmSlug}`)

    // Send approval email (fire-and-forget)
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
            console.warn('Could not fetch farm name for approval email', { farmSlug: photo.farmSlug, error: err })
          }

          await sendPhotoApprovedEmail({
            to: photo.authorEmail,
            farmName: farmName,
            farmSlug: photo.farmSlug,
            photoUrl: photo.url,
            caption: photo.caption,
          })
        }
      } catch (err) {
        console.error('Non-fatal: approved email failed', {
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
    console.error('Error approving photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
