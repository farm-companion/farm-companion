export interface FarmFrontendProduce {
  slug: string
  name: string
  images: {
    src: string
    alt: string
  }[]
  monthsInSeason: number[]
  peakMonths: number[]
  nutritionPer100g: {
    kcal: number
    protein: number
    carbs: number
    sugars: number
    fiber: number
    fat: number
  }
  selectionTips: string[]
  storageTips: string[]
  prepIdeas: string[]
  recipeChips: {
    title: string
    url: string
    description: string
  }[]
  aliases: string[]
}

export interface IntegrationConfig {
  farmFrontendUrl: string
  apiBaseUrl: string
  syncInterval: number // milliseconds
  retryAttempts: number
  retryDelay: number // milliseconds
}

export interface SyncResult {
  success: boolean
  syncedImages: number
  errors: string[]
  timestamp: string
}

export interface ImageSyncRequest {
  produceSlug: string
  month: number
  images: {
    src: string
    alt: string
    isPrimary?: boolean
  }[]
  metadata?: {
    description?: string
    tags?: string[]
    location?: string
    photographer?: string
  }
}

export interface ImageSyncResponse {
  success: boolean
  uploadedImages: {
    id: string
    url: string
    alt: string
    width: number
    height: number
    size: number
    format: string
  }[]
  errors: string[]
  timestamp: string
}

export interface ProduceSyncStatus {
  produceSlug: string
  totalImages: number
  imagesByMonth: {
    [month: number]: number
  }
  lastSync: string
  syncStatus: 'pending' | 'in_progress' | 'completed' | 'failed'
  errors: string[]
}
