import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
// import { sendPhotoApprovedEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'
import { trackContentChange, createFarmChangeEvent } from '@/lib/content-change-tracker'

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

    // Check current approved photo count for this farm
    const approvedPhotoIds = await client.sMembers(`farm:${photo.farmSlug}:photos:approved`)
    const currentCount = approvedPhotoIds.length
    const maxPhotos = 5 // Hard limit per farm

    let replacedPhotoId: string | null = null
    let replacedPhotoData: Record<string, string> | null = null

    // If farm has reached the limit, replace the oldest photo
    if (currentCount >= maxPhotos) {
      console.log(`Farm ${photo.farmSlug} has ${currentCount} photos, replacing oldest...`)
      
      // Get all approved photos for this farm with their creation dates
      const approvedPhotos = await Promise.all(
        approvedPhotoIds.map(async (id: string) => {
          try {
            const data = await client.hGetAll(`photo:${id}`)
            if (data && Object.keys(data).length > 0) {
              return {
                id,
                createdAt: parseInt(data.createdAt || '0'),
                data
              }
            }
            return null
          } catch (error) {
            console.error(`Error fetching photo ${id} data:`, error)
            return null
          }
        })
      )

      // Filter out null results and sort by creation date (oldest first)
      const validPhotos = approvedPhotos.filter(Boolean).sort((a, b) => a!.createdAt - b!.createdAt)
      
      if (validPhotos.length > 0) {
        // Get the oldest photo
        const oldestPhoto = validPhotos[0]!
        replacedPhotoId = oldestPhoto.id
        replacedPhotoData = oldestPhoto.data
        
        console.log(`Replacing oldest photo ${replacedPhotoId} (created: ${new Date(oldestPhoto.createdAt).toISOString()})`)
        
        // Remove the oldest photo from approved set
        await client.sRem(`farm:${photo.farmSlug}:photos:approved`, replacedPhotoId)
        
        // Update the replaced photo status to 'replaced'
        await client.hSet(`photo:${replacedPhotoId}`, 'status', 'replaced')
        await client.hSet(`photo:${replacedPhotoId}`, 'replacedAt', Date.now().toString())
        await client.hSet(`photo:${replacedPhotoId}`, 'replacedBy', photoId)
        
        // Remove from global approved photos list
        await client.lRem('photos:approved', 0, replacedPhotoId)
        
        // Add to global replaced photos list
        await client.lPush('photos:replaced', replacedPhotoId)
      }
    }

    // Update new photo status to approved
    await client.hSet(`photo:${photoId}`, 'status', 'approved')
    await client.hSet(`photo:${photoId}`, 'approvedAt', Date.now().toString())
    
    // Add metadata about replacement if applicable
    if (replacedPhotoId) {
      await client.hSet(`photo:${photoId}`, 'replacedPhoto', replacedPhotoId)
    }

    // Move from pending to approved
    await client.sRem(`farm:${photo.farmSlug}:photos:pending`, photoId)
    await client.sAdd(`farm:${photo.farmSlug}:photos:approved`, photoId)
    
    // Add to global approved photos list
    await client.lPush('photos:approved', photoId)

    // Remove from moderation queue
    await client.lRem('moderation:queue', 0, photoId)

    // Revalidate the farm page
    revalidatePath(`/shop/${photo.farmSlug}`)

    // Track content change and notify Bing IndexNow (fire-and-forget)
    ;(async () => {
      try {
        const changeEvent = createFarmChangeEvent(
          'photo_approval',
          photo.farmSlug
        )
        
        const result = await trackContentChange(changeEvent)
        if (result.success) {
          console.log(`🚀 Content change tracked (photo approved): ${result.notificationsSent} Bing notifications sent`)
        } else {
          console.warn(`⚠️ Content change tracking failed: ${result.errors.join(', ')}`)
        }
      } catch (error) {
        console.error('Error tracking content change:', error)
        // Don't fail the main operation if content change tracking fails
      }
    })()

    // TODO: Send approval email when PhotoApproved template is implemented
    // if (photo.authorEmail) {
    //   await sendPhotoApprovedEmail({
    //     to: photo.authorEmail,
    //     farmName: photo.farmSlug, // TODO: Get actual farm name
    //     farmSlug: photo.farmSlug,
    //     photoUrl: photo.url,
    //     caption: photo.caption,
    //     replacedPhoto: replacedPhotoData ? {
    //       id: replacedPhotoId,
    //       caption: replacedPhotoData.caption,
    //       authorName: replacedPhotoData.authorName
    //     } : undefined
    //   })
    // }

    return NextResponse.json({ 
      success: true,
      replacedPhoto: replacedPhotoId ? {
        id: replacedPhotoId,
        caption: replacedPhotoData?.caption,
        authorName: replacedPhotoData?.authorName
      } : null
    })

  } catch (error) {
    console.error('Error approving photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
