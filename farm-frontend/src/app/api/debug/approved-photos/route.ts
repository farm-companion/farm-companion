import { NextRequest, NextResponse } from 'next/server'
import redis, { ensureConnection } from '@/lib/redis'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const farmSlug = searchParams.get('farmSlug')
    
    if (!farmSlug) {
      return NextResponse.json({ error: 'Missing farmSlug parameter' }, { status: 400 })
    }

    const client = await ensureConnection()
    
    // Get all approved photo IDs for this farm
    const approvedIds = await client.sMembers(`farm:${farmSlug}:photos:approved`)
    
    // Get photo data for each ID
    const photos = await Promise.all(approvedIds.map(async (id: string) => {
      try {
        const photoData = await client.hGetAll(`photo:${id}`)
        return {
          id,
          data: photoData,
          keys: Object.keys(photoData),
          url: photoData.url,
          status: photoData.status,
          farmSlug: photoData.farmSlug,
          caption: photoData.caption
        }
      } catch (error) {
        return { id, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }))

    return NextResponse.json({
      farmSlug,
      approvedCount: approvedIds.length,
      approvedIds,
      photos
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
