import { NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'

export async function GET() {
  try {
    const client = await ensureConnection()
    
    // Get all pending photo IDs
    const pendingIds = await client.lRange('moderation:queue', 0, -1)
    
    // Get photo data for each ID
    const photos = await Promise.all(pendingIds.map(async (id: string) => {
      try {
        const photoData = await client.hGetAll(`photo:${id}`)
        return {
          id,
          data: photoData,
          keys: Object.keys(photoData),
          url: photoData.url,
          farmSlug: photoData.farmSlug,
          caption: photoData.caption
        }
      } catch (error) {
        return { id, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }))

    return NextResponse.json({
      pendingCount: pendingIds.length,
      pendingIds,
      photos
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
