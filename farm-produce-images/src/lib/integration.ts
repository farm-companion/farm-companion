import { FarmFrontendProduce, IntegrationConfig, SyncResult, ImageSyncRequest, ProduceSyncStatus } from '@/types/integration'
import { getProduceStats } from '@/lib/database'

export class FarmFrontendIntegration {
  private config: IntegrationConfig

  constructor(config: IntegrationConfig) {
    this.config = config
  }

  async fetchFarmFrontendProduce(): Promise<FarmFrontendProduce[]> {
    try {
      const response = await fetch(`${this.config.farmFrontendUrl}/api/produce`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch produce data: ${response.status}`)
      }

      const data = await response.json()
      return data.produce || []
    } catch (error) {
      console.error('Error fetching farm frontend produce:', error)
      throw new Error(`Failed to fetch produce data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async syncProduceImages(produceSlug: string, month: number): Promise<SyncResult> {
    try {
      // Fetch produce data from farm-frontend
      const produceData = await this.fetchFarmFrontendProduce()
      const produce = produceData.find(p => p.slug === produceSlug)

      if (!produce) {
        return {
          success: false,
          syncedImages: 0,
          errors: [`Produce '${produceSlug}' not found in farm-frontend`],
          timestamp: new Date().toISOString(),
        }
      }

      // Filter images for the specified month
      const monthImages = produce.images.filter((_, index) => {
        // This is a simplified logic - in practice, you'd need to determine
        // which images belong to which month based on your data structure
        return true // For now, sync all images
      })

      if (monthImages.length === 0) {
        return {
          success: true,
          syncedImages: 0,
          errors: [],
          timestamp: new Date().toISOString(),
        }
      }

      // Convert to sync request format
      const syncRequest: ImageSyncRequest = {
        produceSlug,
        month,
        images: monthImages.map((img, index) => ({
          src: img.src,
          alt: img.alt,
          isPrimary: index === 0, // First image is primary
        })),
        metadata: {
          description: `Images for ${produce.name} in month ${month}`,
          tags: [produce.name, `month-${month}`, 'seasonal'],
        },
      }

      // Sync images to our system
      const syncResponse = await this.syncImagesToSystem(syncRequest)

      return {
        success: syncResponse.success,
        syncedImages: syncResponse.uploadedImages.length,
        errors: syncResponse.errors,
        timestamp: syncResponse.timestamp,
      }
    } catch (error) {
      console.error('Error syncing produce images:', error)
      return {
        success: false,
        syncedImages: 0,
        errors: [`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        timestamp: new Date().toISOString(),
      }
    }
  }

  private async syncImagesToSystem(syncRequest: ImageSyncRequest): Promise<ImageSyncResponse> {
    try {
      const uploadedImages = []
      const errors = []

      for (const image of syncRequest.images) {
        try {
          // Download image from farm-frontend
          const imageResponse = await fetch(image.src)
          if (!imageResponse.ok) {
            errors.push(`Failed to download image: ${image.src}`)
            continue
          }

          const imageBlob = await imageResponse.blob()
          const file = new File([imageBlob], `image-${Date.now()}.jpg`, { type: imageBlob.type })

          // Upload to our system
          const formData = new FormData()
          formData.append('images', file)
          formData.append('produceSlug', syncRequest.produceSlug)
          formData.append('month', syncRequest.month.toString())
          formData.append('alt', image.alt)
          formData.append('isPrimary', image.isPrimary?.toString() || 'false')
          if (syncRequest.metadata) {
            formData.append('metadata', JSON.stringify(syncRequest.metadata))
          }

          const uploadResponse = await fetch(`${this.config.apiBaseUrl}/api/upload`, {
            method: 'POST',
            body: formData,
          })

          if (!uploadResponse.ok) {
            errors.push(`Failed to upload image: ${image.src}`)
            continue
          }

          const uploadResult = await uploadResponse.json()
          if (uploadResult.success && uploadResult.data?.uploadedImages) {
            uploadedImages.push(...uploadResult.data.uploadedImages)
          }
        } catch (error) {
          errors.push(`Error processing image ${image.src}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return {
        success: uploadedImages.length > 0,
        uploadedImages,
        errors,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error syncing images to system:', error)
      return {
        success: false,
        uploadedImages: [],
        errors: [`System sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        timestamp: new Date().toISOString(),
      }
    }
  }

  async getSyncStatus(produceSlug?: string): Promise<ProduceSyncStatus[]> {
    try {
      const stats = await getProduceStats()
      const produceData = await this.fetchFarmFrontendProduce()

      const statuses: ProduceSyncStatus[] = []

      for (const produce of produceData) {
        if (produceSlug && produce.slug !== produceSlug) {
          continue
        }

        const totalImages = stats.imagesByProduce[produce.slug] || 0
        const imagesByMonth: { [month: number]: number } = {}

        // Calculate images by month (simplified)
        for (let month = 1; month <= 12; month++) {
          imagesByMonth[month] = Math.floor(totalImages / 12) // Simplified distribution
        }

        statuses.push({
          produceSlug: produce.slug,
          totalImages,
          imagesByMonth,
          lastSync: stats.lastUpload,
          syncStatus: totalImages > 0 ? 'completed' : 'pending',
          errors: [],
        })
      }

      return statuses
    } catch (error) {
      console.error('Error getting sync status:', error)
      return []
    }
  }

  async validateIntegration(): Promise<{ valid: boolean; errors: string[] }> {
    const errors = []

    try {
      // Test farm-frontend connection
      const produceData = await this.fetchFarmFrontendProduce()
      if (produceData.length === 0) {
        errors.push('No produce data found in farm-frontend')
      }
    } catch (error) {
      errors.push(`Farm-frontend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      // Test our API connection
      const response = await fetch(`${this.config.apiBaseUrl}/api/stats`)
      if (!response.ok) {
        errors.push(`API connection failed: ${response.status}`)
      }
    } catch (error) {
      errors.push(`API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

// Default configuration
export const defaultIntegrationConfig: IntegrationConfig = {
  farmFrontendUrl: process.env.FARM_FRONTEND_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  syncInterval: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
}

// Create default integration instance
export const farmFrontendIntegration = new FarmFrontendIntegration(defaultIntegrationConfig)
