import { NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'

export async function GET() {
  try {
    const client = await ensureConnection()
    
    // Get all pending photos
    const pendingIds = await client.lRange('moderation:queue', 0, -1)
    
    const photos = await Promise.all(pendingIds.map(async (id: string) => {
      try {
        const photoData = await client.hGetAll(`photo:${id}`)
        if (!photoData || Object.keys(photoData).length === 0) return null
        
        // Convert Redis hash to object
        const photo: Record<string, string> = {}
        for (const [key, value] of Object.entries(photoData)) {
          photo[key] = String(value)
        }
        
        return photo
      } catch (error) {
        console.error('Error fetching photo data:', { photoId: id, error })
        return null
      }
    }))

    const validPhotos = photos.filter(Boolean)
    
    // Also get some approved photos
    const approvedPhotos = []
    const farmKeys = await client.keys('farm:*:photos:approved')
    
    for (const farmKey of farmKeys.slice(0, 5)) { // Limit to first 5 farms
      const photoIds = await client.sMembers(farmKey)
      for (const photoId of photoIds.slice(0, 3)) { // Limit to first 3 photos per farm
        try {
          const photoData = await client.hGetAll(`photo:${photoId}`)
          if (photoData && Object.keys(photoData).length > 0) {
            const photo: Record<string, string> = {}
            for (const [key, value] of Object.entries(photoData)) {
              photo[key] = String(value)
            }
            approvedPhotos.push(photo)
          }
        } catch (error) {
          console.error('Error fetching approved photo data:', { photoId, error })
        }
      }
    }
    
    return NextResponse.json({
      pending: validPhotos,
      approved: approvedPhotos.slice(0, 10), // Limit to 10 approved photos
      totalPending: validPhotos.length,
      totalApproved: approvedPhotos.length
    })

  } catch (error) {
    console.error('Error listing photos:', error)
    return NextResponse.json({
      error: 'internal-server-error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
