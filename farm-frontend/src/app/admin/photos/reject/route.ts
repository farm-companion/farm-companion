import { NextRequest, NextResponse } from 'next/server'
import redis from '@/lib/redis'

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

    // Use Redis pipeline for atomic operations
    const pipeline = redis.multi()

    // Update photo status to rejected
    pipeline.hSet(`photo:${photoId}`, { status: 'rejected', rejectedAt: Date.now() } as any)

    // Remove from moderation queue
    pipeline.lRem('moderation:queue', 1, photoId)

    await pipeline.exec()

    // Redirect back to photos page
    return NextResponse.redirect(new URL('/admin/photos', req.url))
  } catch (error) {
    console.error('Error rejecting photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
