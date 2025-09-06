import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
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

    // Update photo status to removed
    await client.hSet(`photo:${photoId}`, 'status', 'removed')
    await client.hSet(`photo:${photoId}`, 'removedAt', Date.now().toString())

    // Remove from approved photos
    await client.sRem(`farm:${photo.farmSlug}:photos:approved`, photoId)

    // Revalidate the farm page
    revalidatePath(`/shop/${photo.farmSlug}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
