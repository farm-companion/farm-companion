export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface UploadResponse {
  uploadedImages: {
    id: string
    url: string
    alt: string
    width: number
    height: number
    size: number
    format: string
  }[]
  totalUploaded: number
  totalSize: number
  metadata: {
    produceSlug: string
    month: number
    uploadedAt: string
  }
}

export interface ImageListResponse {
  images: {
    id: string
    url: string
    alt: string
    width: number
    height: number
    size: number
    format: string
    uploadedAt: string
    isPrimary: boolean
  }[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface MetadataResponse {
  produce: {
    slug: string
    name: string
    monthsInSeason: number[]
    peakMonths: number[]
    totalImages: number
    lastUpdated: string
    imageCounts: {
      [month: number]: number
    }
  }
  images: {
    id: string
    url: string
    alt: string
    isPrimary: boolean
  }[]
}

export interface StatsResponse {
  stats: {
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
}

export interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
  timestamp: string
}

export type ApiError = {
  message: string
  code: string
  status: number
}
