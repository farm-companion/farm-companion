// Produce Images Integration
// Connects farm-frontend admin with farm-produce-images API

import { PRODUCE } from '@/data/produce'
import type { Produce } from '@/data/produce'

export interface ProduceImageUpload {
  produceSlug: string
  month: number
  images: File[]
  alt: string
  isPrimary?: boolean
  metadata?: {
    description?: string
    tags?: string[]
    location?: string
    photographer?: string
  }
}

export interface ProduceImageResponse {
  id: string
  url: string
  alt: string
  width: number
  height: number
  size: number
  format: string
  uploadedAt: string
  isPrimary: boolean
}

export interface ProduceUploadResult {
  success: boolean
  uploadedImages: ProduceImageResponse[]
  totalUploaded: number
  totalSize: number
  errors: string[]
}

export interface ProduceStats {
  totalImages: number
  totalSize: number
  imagesByMonth: { [month: number]: number }
  imagesByProduce: { [slug: string]: number }
  storageUsed: number
  lastUpload: string
}

// API Configuration
const PRODUCE_IMAGES_API_URL = 'https://farm-produce-images-e26nfxge7-abdur-rahman-morris-projects.vercel.app'

// Upload images to produce-images system
export async function uploadProduceImages(upload: ProduceImageUpload): Promise<ProduceUploadResult> {
  try {
    console.log('🚀 Starting upload to:', `${PRODUCE_IMAGES_API_URL}/api/upload`)
    console.log('📦 Upload data:', { produceSlug: upload.produceSlug, month: upload.month, imagesCount: upload.images.length })
    
    const formData = new FormData()
    
    upload.images.forEach(file => {
      formData.append('images', file)
    })
    
    formData.append('produceSlug', upload.produceSlug)
    formData.append('month', upload.month.toString())
    formData.append('alt', upload.alt)
    formData.append('isPrimary', upload.isPrimary?.toString() || 'false')
    
    if (upload.metadata) {
      formData.append('metadata', JSON.stringify(upload.metadata))
    }

    console.log('📤 Sending request...')
    const response = await fetch(`${PRODUCE_IMAGES_API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    console.log('📥 Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Upload failed:', errorData)
      throw new Error(errorData.error || `Upload failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Upload successful:', data)
    
    return {
      success: data.success,
      uploadedImages: data.data?.uploadedImages || [],
      totalUploaded: data.data?.totalUploaded || 0,
      totalSize: data.data?.totalSize || 0,
      errors: [],
    }
  } catch (error) {
    console.error('💥 Error uploading produce images:', error)
    return {
      success: false,
      uploadedImages: [],
      totalUploaded: 0,
      totalSize: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

// Get produce images from the system
export async function getProduceImages(
  produceSlug?: string,
  month?: number
): Promise<ProduceImageResponse[]> {
  try {
    const params = new URLSearchParams()
    if (produceSlug) params.append('produceSlug', produceSlug)
    if (month) params.append('month', month.toString())

    const response = await fetch(`${PRODUCE_IMAGES_API_URL}/api/images?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.status}`)
    }

    const data = await response.json()
    return data.data?.images || []
  } catch (error) {
    console.error('Error fetching produce images:', error)
    return []
  }
}

// Get system statistics
export async function getProduceStats(): Promise<ProduceStats | null> {
  try {
    const response = await fetch(`${PRODUCE_IMAGES_API_URL}/api/stats`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`)
    }

    const data = await response.json()
    return data.data?.stats || null
  } catch (error) {
    console.error('Error fetching produce stats:', error)
    return null
  }
}

// Get produce metadata
export async function getProduceMetadata(produceSlug: string, month?: number) {
  try {
    const params = new URLSearchParams({ produceSlug })
    if (month) params.append('month', month.toString())

    const response = await fetch(`${PRODUCE_IMAGES_API_URL}/api/metadata?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`)
    }

    const data = await response.json()
    return data.data || null
  } catch (error) {
    console.error('Error fetching produce metadata:', error)
    return null
  }
}

// Validate integration
export async function validateProduceIntegration(): Promise<{ valid: boolean; errors: string[] }> {
  const errors = []

  try {
    // Test API connection
    const response = await fetch(`${PRODUCE_IMAGES_API_URL}/api/stats`)
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

// Helper functions
export function getProduceBySlug(slug: string): Produce | undefined {
  return PRODUCE.find(p => p.slug === slug)
}

export function getAllProduce(): Produce[] {
  return PRODUCE
}

export function getProduceInSeason(month: number): Produce[] {
  return PRODUCE.filter(p => p.monthsInSeason?.includes(month))
}

export function getProduceAtPeak(month: number): Produce[] {
  return PRODUCE.filter(p => p.peakMonths?.includes(month))
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || 'Unknown'
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}
