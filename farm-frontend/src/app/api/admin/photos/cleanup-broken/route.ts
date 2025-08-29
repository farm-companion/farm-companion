import { NextRequest, NextResponse } from 'next/server'
import redis, { ensureConnection } from '@/lib/redis'
import { head } from '@vercel/blob'

export async function POST(req: NextRequest) {
  try {
    const client = await ensureConnection()
    
    // Get all pending photo IDs
    const pendingIds = await client.lRange('moderation:queue', 0, -1)
    
    // Get all approved photo IDs
    const approvedIds = await client.sMembers('farm:priory-farm-shop:photos:approved')
    
    const allPhotoIds = [...pendingIds, ...approvedIds]
    const brokenPhotos = []
    
    // Check each photo
    for (const photoId of allPhotoIds) {
      try {
        const photoData = await client.hGetAll(`photo:${photoId}`)
        if (!photoData || !photoData.url) continue
        
        // Extract pathname from URL
        const url = photoData.url
        const pathname = url.replace('https://blob.vercel-storage.com/', '')
        
        // Check if file exists
        try {
          await head(pathname)
          console.log(`Photo ${photoId} exists: ${url}`)
        } catch (error) {
          console.log(`Photo ${photoId} is broken: ${url}`)
          brokenPhotos.push({
            id: photoId,
            url: photoData.url,
            farmSlug: photoData.farmSlug,
            status: photoData.status
          })
        }
      } catch (error) {
        console.error(`Error checking photo ${photoId}:`, error)
      }
    }
    
    // Remove broken photos
    for (const photo of brokenPhotos) {
      try {
        // Remove from moderation queue
        await client.lRem('moderation:queue', 0, photo.id)
        
        // Remove from approved photos
        if (photo.farmSlug) {
          await client.sRem(`farm:${photo.farmSlug}:photos:approved`, photo.id)
        }
        
        // Delete photo metadata
        await client.del(`photo:${photo.id}`)
        
        console.log(`Removed broken photo: ${photo.id}`)
      } catch (error) {
        console.error(`Error removing photo ${photo.id}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      checked: allPhotoIds.length,
      broken: brokenPhotos.length,
      removed: brokenPhotos.length,
      brokenPhotos
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
