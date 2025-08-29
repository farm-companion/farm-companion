import redis from './redis'

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
    // Get all approved photo IDs for this farm
    const ids = await redis.smembers<string>(`farm:${slug}:photos:approved`)
    if (!ids?.length) return []

    // Fetch photo metadata for all IDs
    const metas = await Promise.all(
      ids.map(async (id) => {
        try {
          const photoData = await redis.hgetall(`photo:${id}`)
          return photoData ? JSON.parse(String(photoData)) : null
        } catch (err) {
          console.warn('Failed to fetch photo metadata', { photoId: id, error: err })
          return null
        }
      })
    )

    // Filter and transform to ApprovedPhoto type
    return metas
      .filter(m => m && m.status === 'approved')
      .map(m => ({
        id: String(m.id),
        farmSlug: String(m.farmSlug),
        url: String(m.url),
        caption: m.caption || '',
        authorName: m.authorName || '',
        createdAt: Number(m.createdAt || 0),
        approvedAt: Number(m.approvedAt || 0),
        status: 'approved' as const,
      }))
      .sort((a, b) => (b.approvedAt || b.createdAt) - (a.approvedAt || a.createdAt))
  } catch (error) {
    console.error('Error fetching approved photos', { farmSlug: slug, error })
    return []
  }
}

// Get a single photo by ID
export async function getPhotoById(id: string): Promise<ApprovedPhoto | null> {
  try {
    const photoData = await redis.hgetall(`photo:${id}`)
    if (!photoData) return null

    const photo = JSON.parse(String(photoData))
    if (photo.status !== 'approved') return null

    return {
      id: String(photo.id),
      farmSlug: String(photo.farmSlug),
      url: String(photo.url),
      caption: photo.caption || '',
      authorName: photo.authorName || '',
      createdAt: Number(photo.createdAt || 0),
      approvedAt: Number(photo.approvedAt || 0),
      status: 'approved' as const,
    }
  } catch (error) {
    console.error('Error fetching photo by ID', { photoId: id, error })
    return null
  }
}

// Get pending photos for moderation
export async function getPendingPhotos(): Promise<any[]> {
  try {
    const pendingIds = await redis.lrange<string>('moderation:queue', 0, -1)
    if (!pendingIds?.length) return []

    const photos = await Promise.all(
      pendingIds.map(async (id) => {
        try {
          const photoData = await redis.hgetall(`photo:${id}`)
          return photoData ? JSON.parse(String(photoData)) : null
        } catch (err) {
          console.warn('Failed to fetch pending photo', { photoId: id, error: err })
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
