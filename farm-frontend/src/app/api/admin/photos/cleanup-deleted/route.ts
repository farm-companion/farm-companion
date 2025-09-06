import { NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { head } from '@vercel/blob'

export async function POST() {
  try {
    const client = await ensureConnection()
    
    // Get all pending photo IDs
    const pendingIds = await client.lRange('moderation:queue', 0, -1)
    
    // Get all approved photo IDs from all farms
    const farmKeys = await client.keys('farm:*:photos:approved')
    const allApprovedIds = []
    
    for (const farmKey of farmKeys) {
      const approvedIds = await client.sMembers(farmKey)
      allApprovedIds.push(...approvedIds)
    }
    
    const allPhotoIds = [...pendingIds, ...allApprovedIds]
    const deletedPhotos = []
    
    console.log(`Checking ${allPhotoIds.length} photos for deleted blobs...`)
    
    // Check each photo
    for (const photoId of allPhotoIds) {
      try {
        const photoData = await client.hGetAll(`photo:${photoId}`)
        if (!photoData || !photoData.url) continue
        
        // Extract pathname from URL
        const url = photoData.url
        const pathname = url.replace('https://blob.vercel-storage.com/', '')
        
        // Check if file exists in blob storage
        try {
          await head(pathname)
          console.log(`✅ Photo ${photoId} exists in blob storage`)
        } catch {
          console.log(`❌ Photo ${photoId} was deleted from blob storage: ${url}`)
          deletedPhotos.push({
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
    
    // Remove photos that were deleted from blob storage
    for (const photo of deletedPhotos) {
      try {
        // Remove from moderation queue
        await client.lRem('moderation:queue', 0, photo.id)
        
        // Remove from approved photos
        if (photo.farmSlug) {
          await client.sRem(`farm:${photo.farmSlug}:photos:approved`, photo.id)
        }
        
        // Delete photo metadata
        await client.del(`photo:${photo.id}`)
        
        console.log(`🗑️ Removed deleted photo: ${photo.id}`)
      } catch (error) {
        console.error(`Error removing photo ${photo.id}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      checked: allPhotoIds.length,
      deleted: deletedPhotos.length,
      removed: deletedPhotos.length,
      deletedPhotos
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
