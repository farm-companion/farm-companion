// Farm Photos System Configuration
// PuredgeOS 3.0 Compliant Photo Management

export const FARM_PHOTOS_CONFIG = {
  // API URL for the farm-photos system
  // For now, we'll use the same domain as the frontend
  // This avoids cross-origin issues and simplifies deployment
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://farmcompanion.co.uk' // Use the same domain
    : (process.env.FARM_PHOTOS_API_URL || 'http://localhost:3002'),
  
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
  STORAGE_PROVIDER: 'local', // 'local', 's3', 'cloudinary'
  
  // Rate limiting
  MAX_SUBMISSIONS_PER_HOUR: 10,
  MAX_SUBMISSIONS_PER_DAY: 50,
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
