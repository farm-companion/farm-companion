import { NextRequest, NextResponse } from 'next/server'
import redis, { ensureConnection } from '@/lib/redis'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const photoId = searchParams.get('id')
    
    if (!photoId) {
      return NextResponse.json({ error: 'Missing photo ID parameter' }, { status: 400 })
    }

    const client = await ensureConnection()
    
    // Get the photo data
    const photoData = await client.hGetAll(`photo:${photoId}`)
    
    // Also check if it's in the moderation queue
    const queuePosition = await client.lPos('moderation:queue', photoId)
    
    return NextResponse.json({
      photoId,
      photoData,
      photoDataKeys: Object.keys(photoData || {}),
      photoDataValues: Object.values(photoData || {}),
      inQueue: queuePosition !== null,
      queuePosition,
      hasUrl: photoData?.url ? 'YES' : 'NO',
      url: photoData?.url || 'MISSING'
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
