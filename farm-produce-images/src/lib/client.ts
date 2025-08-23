import { ApiResponse, UploadResponse, ImageListResponse, MetadataResponse, StatsResponse } from '@/types/api'
import { ImageSyncRequest, SyncResult, ProduceSyncStatus } from '@/types/integration'

export class ProduceImagesClient {
  private baseUrl: string

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001') {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Upload images
  async uploadImages(
    files: File[],
    produceSlug: string,
    month: number,
    alt: string,
    isPrimary: boolean = false,
    metadata?: any
  ): Promise<UploadResponse> {
    const formData = new FormData()
    
    files.forEach(file => {
      formData.append('images', file)
    })
    
    formData.append('produceSlug', produceSlug)
    formData.append('month', month.toString())
    formData.append('alt', alt)
    formData.append('isPrimary', isPrimary.toString())
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `Upload failed: ${response.status}`)
    }

    return data.data
  }

  // List images
  async listImages(params: {
    produceSlug?: string
    month?: number
    format?: 'jpeg' | 'png' | 'webp'
    isPrimary?: boolean
    limit?: number
    offset?: number
  } = {}): Promise<ImageListResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await this.request<ImageListResponse>(`/api/images?${searchParams.toString()}`)
    return response.data!
  }

  // Get metadata
  async getMetadata(produceSlug: string, month?: number): Promise<MetadataResponse> {
    const searchParams = new URLSearchParams({ produceSlug })
    if (month) {
      searchParams.append('month', month.toString())
    }

    const response = await this.request<MetadataResponse>(`/api/metadata?${searchParams.toString()}`)
    return response.data!
  }

  // Update metadata
  async updateMetadata(produceSlug: string, updates: {
    name?: string
    monthsInSeason?: number[]
    peakMonths?: number[]
  }): Promise<void> {
    await this.request('/api/metadata', {
      method: 'PUT',
      body: JSON.stringify({ produceSlug, ...updates }),
    })
  }

  // Get statistics
  async getStats(): Promise<StatsResponse> {
    const response = await this.request<StatsResponse>('/api/stats')
    return response.data!
  }

  // Sync with farm-frontend
  async syncWithFarmFrontend(syncRequest: ImageSyncRequest): Promise<SyncResult> {
    const response = await this.request<SyncResult>('/api/sync', {
      method: 'POST',
      body: JSON.stringify(syncRequest),
    })
    return response.data!
  }

  // Get sync status
  async getSyncStatus(produceSlug?: string): Promise<ProduceSyncStatus[]> {
    const searchParams = produceSlug ? `?produceSlug=${produceSlug}` : ''
    const response = await this.request<ProduceSyncStatus[]>(`/api/sync/status${searchParams}`)
    return response.data!
  }

  // Validate integration
  async validateIntegration(): Promise<{ valid: boolean; errors: string[] }> {
    const response = await this.request<{ valid: boolean; errors: string[] }>('/api/integration/validate')
    return response.data!
  }

  // Utility functions
  async getImagesForMonth(month: number): Promise<ImageListResponse> {
    return this.listImages({ month })
  }

  async getImagesForProduce(produceSlug: string): Promise<ImageListResponse> {
    return this.listImages({ produceSlug })
  }

  async getPrimaryImages(produceSlug?: string): Promise<ImageListResponse> {
    return this.listImages({ produceSlug, isPrimary: true })
  }

  async getImagesByFormat(format: 'jpeg' | 'png' | 'webp'): Promise<ImageListResponse> {
    return this.listImages({ format })
  }

  // Batch operations
  async uploadMultipleProduce(
    uploads: Array<{
      files: File[]
      produceSlug: string
      month: number
      alt: string
      isPrimary?: boolean
      metadata?: any
    }>
  ): Promise<UploadResponse[]> {
    const results = []
    
    for (const upload of uploads) {
      try {
        const result = await this.uploadImages(
          upload.files,
          upload.produceSlug,
          upload.month,
          upload.alt,
          upload.isPrimary,
          upload.metadata
        )
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload for ${upload.produceSlug}:`, error)
        results.push({
          uploadedImages: [],
          totalUploaded: 0,
          totalSize: 0,
          metadata: {
            produceSlug: upload.produceSlug,
            month: upload.month,
            uploadedAt: new Date().toISOString(),
          },
        })
      }
    }
    
    return results
  }

  // Error handling utilities
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt === maxRetries) {
          throw lastError
        }
        
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
    
    throw lastError!
  }
}

// Create default client instance
export const produceImagesClient = new ProduceImagesClient()

// Export convenience functions
export const uploadImages = produceImagesClient.uploadImages.bind(produceImagesClient)
export const listImages = produceImagesClient.listImages.bind(produceImagesClient)
export const getMetadata = produceImagesClient.getMetadata.bind(produceImagesClient)
export const getStats = produceImagesClient.getStats.bind(produceImagesClient)
export const syncWithFarmFrontend = produceImagesClient.syncWithFarmFrontend.bind(produceImagesClient)
