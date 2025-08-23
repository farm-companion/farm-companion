export interface ProduceImage {
  id: string
  url: string
  alt: string
  width: number
  height: number
  size: number
  format: 'jpeg' | 'png' | 'webp'
  uploadedAt: string
  month: number // 1-12
  produceSlug: string
  isPrimary: boolean
  metadata?: {
    description?: string
    tags?: string[]
    location?: string
    photographer?: string
  }
}

export interface ProduceMetadata {
  slug: string
  name: string
  monthsInSeason: number[] // 1-12
  peakMonths: number[] // 1-12
  totalImages: number
  lastUpdated: string
  imageCounts: {
    [month: number]: number
  }
}

export interface ProduceUploadRequest {
  produceSlug: string
  month: number
  images: File[]
  metadata?: {
    description?: string
    tags?: string[]
    location?: string
    photographer?: string
  }
}

export interface ProduceSearchFilters {
  month?: number
  produceSlug?: string
  format?: 'jpeg' | 'png' | 'webp'
  isPrimary?: boolean
  limit?: number
  offset?: number
}

export interface ProduceStats {
  totalImages: number
  totalSize: number
  imagesByMonth: {
    [month: number]: number
  }
  imagesByProduce: {
    [slug: string]: number
  }
  storageUsed: number
  lastUpload: string
}
