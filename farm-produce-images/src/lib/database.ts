import { createClient } from 'redis'
import { z } from 'zod'
import { ProduceImage, ProduceMetadata, ProduceStats } from '@/types/produce'

// Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

// Connect to Redis
redis.on('error', (err) => console.error('Redis Client Error', err))
redis.on('connect', () => console.log('✅ Connected to Redis'))

// Ensure connection
if (!redis.isOpen) {
  redis.connect().catch(console.error)
}

const ImageMetadataSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  alt: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  size: z.number().positive(),
  format: z.enum(['jpeg', 'png', 'webp']),
  uploadedAt: z.string(),
  month: z.number().min(1).max(12),
  produceSlug: z.string(),
  isPrimary: z.boolean(),
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    location: z.string().optional(),
    photographer: z.string().optional(),
  }).optional(),
})

export async function saveImageMetadata(image: ProduceImage): Promise<void> {
  try {
    // Validate image data
    const validatedImage = ImageMetadataSchema.parse(image)
    
    // Save individual image metadata
    const imageKey = `image:${image.id}`
    await redis.set(imageKey, JSON.stringify(validatedImage))
    
    // Add to produce images list
    const produceImagesKey = `produce:${image.produceSlug}:images`
    await redis.lPush(produceImagesKey, image.id)
    
    // Add to month images list
    const monthImagesKey = `month:${image.month}:images`
    await redis.lPush(monthImagesKey, image.id)
    
    // Update produce metadata
    await updateProduceMetadata(image.produceSlug, image.month)
    
    console.log(`Image metadata saved: ${image.id}`)
  } catch (error) {
    console.error('Error saving image metadata:', error)
    throw new Error(`Failed to save image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getImageMetadata(imageId: string): Promise<ProduceImage | null> {
  try {
    const imageKey = `image:${imageId}`
    const imageData = await redis.get(imageKey)
    if (!imageData) return null
    
    return JSON.parse(imageData) as ProduceImage
  } catch (error) {
    console.error('Error getting image metadata:', error)
    return null
  }
}

export async function deleteImageMetadata(imageId: string): Promise<void> {
  try {
    const image = await getImageMetadata(imageId)
    if (!image) {
      throw new Error(`Image ${imageId} not found`)
    }
    
    // Remove from individual image storage
    const imageKey = `image:${imageId}`
    await redis.del(imageKey)
    
    // Remove from produce images list
    const produceImagesKey = `produce:${image.produceSlug}:images`
    await redis.lRem(produceImagesKey, 1, imageId)
    
    // Remove from month images list
    const monthImagesKey = `month:${image.month}:images`
    await redis.lRem(monthImagesKey, 1, imageId)
    
    // Update produce metadata
    await updateProduceMetadata(image.produceSlug, image.month)
    
    console.log(`Image metadata deleted: ${imageId}`)
  } catch (error) {
    console.error('Error deleting image metadata:', error)
    throw new Error(`Failed to delete image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getProduceImages(
  produceSlug: string,
  month?: number
): Promise<ProduceImage[]> {
  try {
    const produceImagesKey = `produce:${produceSlug}:images`
    const imageIds = await redis.lRange(produceImagesKey, 0, -1)
    
    const images: ProduceImage[] = []
    for (const imageId of imageIds) {
      const image = await getImageMetadata(imageId)
      if (image && (!month || image.month === month)) {
        images.push(image)
      }
    }
    
    return images.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  } catch (error) {
    console.error('Error getting produce images:', error)
    return []
  }
}

export async function getMonthImages(_month: number): Promise<ProduceImage[]> {
  try {
          const monthImagesKey = `month:${_month}:images`
    const imageIds = await redis.lRange(monthImagesKey, 0, -1)
    
    const images: ProduceImage[] = []
    for (const imageId of imageIds) {
      const image = await getImageMetadata(imageId)
      if (image) {
        images.push(image)
      }
    }
    
    return images.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  } catch (error) {
    console.error('Error getting month images:', error)
    return []
  }
}

export async function updateProduceMetadata(produceSlug: string, month: number): Promise<void> {
  try {
    const images = await getProduceImages(produceSlug)
    
    // Count images by month
    const imageCounts: { [month: number]: number } = {}
    for (let m = 1; m <= 12; m++) {
      imageCounts[m] = images.filter(img => img.month === m).length
    }
    
    const metadata: ProduceMetadata = {
      slug: produceSlug,
      name: produceSlug.charAt(0).toUpperCase() + produceSlug.slice(1), // Basic name generation
      monthsInSeason: [], // Would be populated from external data
      peakMonths: [], // Would be populated from external data
      totalImages: images.length,
      lastUpdated: new Date().toISOString(),
      imageCounts,
    }
    
    const metadataKey = `produce:${produceSlug}:metadata`
    await redis.set(metadataKey, JSON.stringify(metadata))
  } catch (error) {
    console.error('Error updating produce metadata:', error)
  }
}

export async function getProduceStats(): Promise<ProduceStats> {
  try {
    const statsKey = 'stats:produce'
    const cachedStats = await redis.get(statsKey)
    
    if (cachedStats) {
      return JSON.parse(cachedStats) as ProduceStats
    }
    
    // Calculate fresh stats
    const allImages: ProduceImage[] = []
    for (let month = 1; month <= 12; month++) {
      const monthImages = await getMonthImages(month)
      allImages.push(...monthImages)
    }
    
    const stats: ProduceStats = {
      totalImages: allImages.length,
      totalSize: allImages.reduce((sum, img) => sum + img.size, 0),
      imagesByMonth: {},
      imagesByProduce: {},
      storageUsed: allImages.reduce((sum, img) => sum + img.size, 0),
      lastUpload: allImages.length > 0 
        ? allImages.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0].uploadedAt
        : new Date().toISOString(),
    }
    
    // Calculate by month
    for (let month = 1; month <= 12; month++) {
      stats.imagesByMonth[month] = allImages.filter(img => img.month === month).length
    }
    
    // Calculate by produce
    const produceSlugs = [...new Set(allImages.map(img => img.produceSlug))]
    for (const slug of produceSlugs) {
      stats.imagesByProduce[slug] = allImages.filter(img => img.produceSlug === slug).length
    }
    
    // Cache for 1 hour
    await redis.setEx(statsKey, 3600, JSON.stringify(stats))
    
    return stats
  } catch (error) {
    console.error('Error getting produce stats:', error)
    return {
      totalImages: 0,
      totalSize: 0,
      imagesByMonth: {},
      imagesByProduce: {},
      storageUsed: 0,
      lastUpload: new Date().toISOString(),
    }
  }
}
