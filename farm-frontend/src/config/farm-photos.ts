// Farm Photos System Configuration
// PuredgeOS 3.0 Compliant Photo Management

export const FARM_PHOTOS_CONFIG = {
  // API URL for the farm-photos system
  // The farm-photos service runs on its own port
  API_URL: process.env.NODE_ENV === 'production' 
    ? (process.env.FARM_PHOTOS_API_URL || 'https://farm-photos-knru4qgcb-abdur-rahman-morris-projects.vercel.app') // Production URL
    : (process.env.FARM_PHOTOS_API_URL || 'https://farm-photos-knru4qgcb-abdur-rahman-morris-projects.vercel.app'), // Development URL - use production since auth disabled
  
  // Photo submission settings
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  MAX_DESCRIPTION_LENGTH: 500,
  
  // Gallery settings
  THUMBNAIL_SIZE: 300,
  FULL_SIZE: 1200,
  
  // AI Analysis settings
  AUTO_APPROVE_THRESHOLD: 85, // Quality score threshold for auto-approval
  MIN_QUALITY_SCORE: 50, // Minimum quality score for approval
  
  // Email settings
  SEND_CONFIRMATION_EMAILS: true,
  SEND_ADMIN_NOTIFICATIONS: true,
  
  // Storage settings
  STORAGE_PROVIDER: 'vercel-blob', // Using Vercel Blob for storage
  
  // Rate limiting
  MAX_SUBMISSIONS_PER_HOUR: 10,
  MAX_SUBMISSIONS_PER_DAY: 50,
  
  // API endpoints
  ENDPOINTS: {
    SUBMIT: '/api/photos',
    GET_FARM_PHOTOS: '/api/photos',
    GET_PHOTO: '/api/photos',
    UPDATE_STATUS: '/api/photos',
    DELETE_PHOTO: '/api/photos',
    GET_PENDING: '/api/photos?status=pending',
    GET_DELETION_REQUESTS: '/api/photos/deletion-requests',
    REVIEW_DELETION: '/api/photos/deletion-requests',
    GET_RECOVERABLE: '/api/photos/recoverable',
    RECOVER_PHOTO: '/api/photos/recover',
    GET_STATS: '/api/photos/stats',
  } as const,
} as const

// Helper function to get the full API URL
export function getFarmPhotosApiUrl(endpoint: string): string {
  const baseUrl = FARM_PHOTOS_CONFIG.API_URL.replace(/\/$/, '') // Remove trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, '') // Remove leading slash
  return `${baseUrl}/${cleanEndpoint}`
}

// Helper function to validate photo file
export function validatePhotoFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!FARM_PHOTOS_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: ${FARM_PHOTOS_CONFIG.ALLOWED_TYPES.join(', ')}`
    }
  }
  
  // Check file size
  if (file.size > FARM_PHOTOS_CONFIG.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large. Maximum size: ${FARM_PHOTOS_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }
  
  return { isValid: true }
}

// Helper function to convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
