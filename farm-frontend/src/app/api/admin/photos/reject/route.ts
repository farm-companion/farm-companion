import { NextRequest, NextResponse } from 'next/server'
import redis, { ensureConnection } from '@/lib/redis'
// import { sendPhotoRejectedEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const photoId = searchParams.get('id')

    if (!photoId) {
      return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 })
    }

    const client = await ensureConnection()

    // Get photo data
    const photoData = await client.hGetAll(`photo:${photoId}`)
    if (!photoData || Object.keys(photoData).length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Convert Redis hash to object
    const photo: Record<string, string> = {}
    for (const [key, value] of Object.entries(photoData)) {
      photo[key] = String(value)
    }

    // Update photo status to rejected
    await client.hSet(`photo:${photoId}`, 'status', 'rejected')
    await client.hSet(`photo:${photoId}`, 'rejectedAt', Date.now().toString())

    // Remove from pending photos
    await client.sRem(`farm:${photo.farmSlug}:photos:pending`, photoId)
    
    // Add to global rejected photos list
    await client.lPush('photos:rejected', photoId)

    // Remove from moderation queue
    await client.lRem('moderation:queue', 0, photoId)

    // Revalidate the farm page
    revalidatePath(`/shop/${photo.farmSlug}`)

    // TODO: Send rejection email when PhotoRejected template is implemented
    // if (photo.authorEmail) {
    //   await sendPhotoRejectedEmail({
    //     to: photo.authorEmail,
    //     farmName: photo.farmSlug, // TODO: Get actual farm name
    //     farmSlug: photo.farmSlug,
    //     rejectReason: 'Photo did not meet our guidelines', // TODO: Add reason input
    //     photoUrl: photo.url,
    //     caption: photo.caption
    //   })
    // }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error rejecting photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
