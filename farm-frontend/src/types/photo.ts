// Farm Photos Types - Matching farm-photos system
// PuredgeOS 3.0 Compliant Photo Management

export interface PhotoSubmission {
  id: string
  farmSlug: string
  farmName: string
  submitterName: string
  submitterEmail: string
  photoUrl: string
  thumbnailUrl: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  qualityScore: number
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  aiAnalysis?: AIAnalysis
  fileSize: number
  contentType: string
  dimensions: {
    width: number
    height: number
  }
}

export interface AIAnalysis {
  qualityScore: number
  isAppropriate: boolean
  confidence: number
  tags: string[]
  duplicateDetected: boolean
  autoApprove: boolean
  analysisTimestamp: string
}

export interface FarmPhotoCount {
  farmSlug: string
  photoCount: number
  lastUpdated: string
}

export interface PhotoLimitConfig {
  maxPhotosPerFarm: number
  maxFileSize: number // in bytes
  allowedTypes: string[]
  autoApproveThreshold: number
}

export interface EmailTemplate {
  type: 'submission' | 'approval' | 'rejection' | 'limit-warning' | 'replacement'
  subject: string
  body: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'moderator'
  permissions: string[]
}

// API Request/Response Types
export interface PhotoSubmissionRequest {
  farmSlug: string
  farmName: string
  submitterName: string
  submitterEmail: string
  photoData: string // base64 encoded
  description: string
}

export interface PhotoSubmissionResponse {
  success: boolean
  submissionId: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  estimatedReviewTime?: string
}

export interface PhotoReviewRequest {
  submissionId: string
  action: 'approve' | 'reject'
  reason?: string
  reviewerId: string
}

export interface PhotoListResponse {
  photos: PhotoSubmission[]
  totalCount: number
  farmPhotoCount: number
  maxPhotosAllowed: number
}

// Deletion Request Types
export interface DeletionRequest {
  id: string
  photoId: string
  requestedBy: string
  requesterEmail: string
  requesterRole: 'admin' | 'shop_owner' | 'submitter'
  reason: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

// Validation Schemas
export const PhotoSubmissionSchema = {
  farmSlug: /^[a-z0-9-]+$/,
  submitterName: /^[a-zA-Z\s]{2,50}$/,
  submitterEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  description: /^.{10,500}$/,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
} as const
