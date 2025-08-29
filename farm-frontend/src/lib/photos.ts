import redis, { ensureConnection } from './redis'
import { head } from '@vercel/blob'

export type ApprovedPhoto = {
  id: string
  farmSlug: string
  url: string
  caption?: string
  authorName?: string
  createdAt?: number
  approvedAt?: number
  status: 'approved'
}

export async function getApprovedPhotosBySlug(slug: string): Promise<ApprovedPhoto[]> {
  try {
    const client = await ensureConnection();
    
    // Get all approved photo IDs for this farm
    const ids = await client.sMembers(`farm:${slug}:photos:approved`)
    if (!ids?.length) return []

    // Fetch photo metadata for all IDs
    const metas = await Promise.all(
      ids.map(async (id: string) => {
        try {
          const photoData = await client.hGetAll(`photo:${id}`)
          return photoData || null
        } catch (err) {
          console.warn('Failed to fetch photo metadata', { photoId: id, error: err })
          return null
        }
      })
    )

    // Filter out null results and transform to ApprovedPhoto format
    const photos = metas
      .filter(Boolean)
      .map((photoData: any) => ({
        id: photoData.id,
        farmSlug: photoData.farmSlug,
        url: photoData.url,
        caption: photoData.caption,
        authorName: photoData.authorName,
        createdAt: photoData.createdAt ? parseInt(photoData.createdAt) : undefined,
        approvedAt: photoData.approvedAt ? parseInt(photoData.approvedAt) : undefined,
        status: 'approved' as const
      }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    return photos
  } catch (error) {
    console.error('Error fetching approved photos', { farmSlug: slug, error })
    return []
  }
}

/**
 * Get approved photos that actually exist in blob storage
 * This filters out photos that were deleted from blob storage but still exist in Redis
 */
export async function getValidApprovedPhotosBySlug(slug: string): Promise<ApprovedPhoto[]> {
  try {
    const client = await ensureConnection();
    
    // Get all approved photo IDs for this farm
    const ids = await client.sMembers(`farm:${slug}:photos:approved`)
    if (!ids?.length) return []

    // Fetch photo metadata for all IDs
    const metas = await Promise.all(
      ids.map(async (id: string) => {
        try {
          const photoData = await client.hGetAll(`photo:${id}`)
          return photoData || null
        } catch (err) {
          console.warn('Failed to fetch photo metadata', { photoId: id, error: err })
          return null
        }
      })
    )

    // Filter out null results and transform to ApprovedPhoto format
    const photos = metas
      .filter(Boolean)
      .map((photoData: any) => ({
        id: photoData.id,
        farmSlug: photoData.farmSlug,
        url: photoData.url,
        caption: photoData.caption,
        authorName: photoData.authorName,
        createdAt: photoData.createdAt ? parseInt(photoData.createdAt) : undefined,
        approvedAt: photoData.approvedAt ? parseInt(photoData.approvedAt) : undefined,
        status: 'approved' as const
      }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    // Verify each photo actually exists in blob storage
    const validPhotos = await Promise.all(
      photos.map(async (photo) => {
        try {
          // Extract pathname from URL
          const pathname = photo.url.replace('https://blob.vercel-storage.com/', '')
          
          // Check if file exists in blob storage
          await head(pathname)
          return photo
        } catch (error) {
          console.warn('Photo not found in blob storage, removing from display', { 
            photoId: photo.id, 
            url: photo.url,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return null
        }
      })
    )

    // Filter out null results (photos that don't exist in blob storage)
    return validPhotos.filter(Boolean) as ApprovedPhoto[]
  } catch (error) {
    console.error('Error fetching valid approved photos', { farmSlug: slug, error })
    return []
  }
}

export async function getPhotoById(id: string): Promise<ApprovedPhoto | null> {
  try {
    const client = await ensureConnection();
    
    const photoData = await client.hGetAll(`photo:${id}`)
    if (!photoData) return null

    return {
      id: photoData.id,
      farmSlug: photoData.farmSlug,
      url: photoData.url,
      caption: photoData.caption,
      authorName: photoData.authorName,
      createdAt: photoData.createdAt ? parseInt(photoData.createdAt) : undefined,
      approvedAt: photoData.approvedAt ? parseInt(photoData.approvedAt) : undefined,
      status: 'approved' as const
    }
  } catch (error) {
    console.error('Error fetching photo by ID', { photoId: id, error })
    return null
  }
}

export async function getPendingPhotos(): Promise<any[]> {
  try {
    const client = await ensureConnection();
    
    const pendingIds = await client.lRange('moderation:queue', 0, -1)
    if (!pendingIds?.length) return []

    const photos = await Promise.all(
      pendingIds.map(async (id: string) => {
        try {
          const photoData = await client.hGetAll(`photo:${id}`)
          return photoData || null
        } catch (err) {
          console.warn('Failed to fetch pending photo metadata', { photoId: id, error: err })
          return null
        }
      })
    )

    return photos.filter(Boolean)
  } catch (error) {
    console.error('Error fetching pending photos', { error })
    return []
  }
}
