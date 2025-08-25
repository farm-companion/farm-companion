
// Simple Photo Storage for Farm Frontend
// This provides basic photo functionality until the full farm-photos system is deployed

import { 
  sendPhotoSubmissionConfirmation, 
  sendAdminPhotoNotification,
  sendApprovalNotification,
  sendRejectionNotification,
  sendDeletionRequestNotification,
  sendDeletionApprovalNotification,
  sendDeletionRejectionNotification
} from './email'

interface PhotoSubmission {
  id: string
  farmSlug: string
  farmName: string
  submitterName: string
  submitterEmail: string
  photoUrl: string
  thumbnailUrl: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'deleted' | 'deletion_requested'
  qualityScore: number
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  fileSize: number
  contentType: string
  dimensions: {
    width: number
    height: number
  }
  // Deletion tracking
  deletionRequestedAt?: string
  deletionRequestedBy?: string
  deletionReason?: string
  deletedAt?: string
  deletedBy?: string
  canRecoverUntil?: string // 4-hour recovery window
}

interface DeletionRequest {
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

// In-memory storage for development
// In production, this would be replaced with a database
const photoSubmissions = new Map<string, PhotoSubmission>()
const farmPhotoCounts = new Map<string, number>()
const deletionRequests = new Map<string, DeletionRequest>()

// Note: Thumbnail generation would be implemented here in production
// For now, we use the same image for both full and thumbnail views

// Generate unique submission ID
function generateSubmissionId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `photo_${timestamp}_${random}`
}

// Generate unique deletion request ID
function generateDeletionRequestId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `del_${timestamp}_${random}`
}

// Calculate recovery deadline (4 hours from now)
function calculateRecoveryDeadline(): string {
  const now = new Date()
  now.setHours(now.getHours() + 4)
  return now.toISOString()
}

// Check if photo can be recovered
function canRecoverPhoto(photo: PhotoSubmission): boolean {
  if (photo.status !== 'deleted' || !photo.canRecoverUntil) {
    return false
  }
  return new Date() < new Date(photo.canRecoverUntil)
}

// Save photo submission
export async function savePhotoSubmission(data: {
  farmSlug: string
  farmName: string
  submitterName: string
  submitterEmail: string
  photoData: string
  description: string
}): Promise<{ success: boolean; submissionId?: string; error?: string; message?: string }> {
  try {
    const submissionId = generateSubmissionId()
    
    // Validate photo data
    if (!data.photoData.startsWith('data:image/')) {
      return {
        success: false,
        error: 'Invalid photo data format'
      }
    }
    
    // Check file size (base64 is ~33% larger than binary)
    const base64Size = data.photoData.length
    const estimatedBinarySize = (base64Size * 3) / 4
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    if (estimatedBinarySize > maxSize) {
      return {
        success: false,
        error: 'File too large. Maximum size: 5MB'
      }
    }
    
    // For now, use the same image for both full and thumbnail
    // In production, you'd generate a proper thumbnail
    const photoUrl = data.photoData
    const thumbnailUrl = data.photoData // Same as full image for now
    
    // Create submission
    const submission: PhotoSubmission = {
      id: submissionId,
      farmSlug: data.farmSlug,
      farmName: data.farmName,
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail,
      photoUrl: photoUrl,
      thumbnailUrl: thumbnailUrl,
      description: data.description,
      status: 'pending',
      qualityScore: Math.floor(Math.random() * 40) + 60, // 60-100
      submittedAt: new Date().toISOString(),
      fileSize: estimatedBinarySize,
      contentType: data.photoData.match(/^data:([^;]+);/)?.[1] || 'image/jpeg',
      dimensions: {
        width: 1920,
        height: 1080
      }
    }
    
    // Save to storage
    photoSubmissions.set(submissionId, submission)
    
    // Update farm photo count
    const currentCount = farmPhotoCounts.get(data.farmSlug) || 0
    farmPhotoCounts.set(data.farmSlug, currentCount + 1)
    
    // Send confirmation email
    await sendPhotoSubmissionConfirmation(submission)
    
    // Send admin notification
    await sendAdminPhotoNotification(submission)
    
    return {
      success: true,
      submissionId: submissionId,
      message: 'Photo submitted successfully! It will be reviewed by our team.'
    }
    
  } catch (error) {
    console.error('Error saving photo submission:', error)
    return {
      success: false,
      error: 'Failed to save photo submission'
    }
  }
}

// Get photo submission by ID
export async function getPhotoSubmission(photoId: string): Promise<PhotoSubmission | null> {
  return photoSubmissions.get(photoId) || null
}

// Update photo status
export async function updatePhotoStatus(
  photoId: string, 
  status: 'approved' | 'rejected', 
  reviewedBy: string, 
  rejectionReason?: string
): Promise<boolean> {
  try {
    const submission = photoSubmissions.get(photoId)
    if (!submission) {
      return false
    }
    
    // Update submission
    submission.status = status
    submission.reviewedAt = new Date().toISOString()
    submission.reviewedBy = reviewedBy
    if (rejectionReason) {
      submission.rejectionReason = rejectionReason
    }
    
    // Send notification
    if (status === 'approved') {
      await sendApprovalNotification(submission)
    } else {
      await sendRejectionNotification(submission, rejectionReason || '')
    }
    
    return true
    
  } catch (error) {
    console.error('Error updating photo status:', error)
    return false
  }
}

// Request photo deletion
export async function requestPhotoDeletion(data: {
  photoId: string
  requestedBy: string
  requesterEmail: string
  requesterRole: 'admin' | 'shop_owner' | 'submitter'
  reason: string
}): Promise<{ success: boolean; requestId?: string; error?: string; message?: string }> {
  try {
    const submission = photoSubmissions.get(data.photoId)
    if (!submission) {
      return {
        success: false,
        error: 'Photo not found'
      }
    }
    
    // Validate requester permissions
    if (data.requesterRole === 'submitter' && submission.submitterEmail !== data.requesterEmail) {
      return {
        success: false,
        error: 'You can only request deletion of your own photos'
      }
    }
    
    // Check if already deleted or deletion requested
    if (submission.status === 'deleted' || submission.status === 'deletion_requested') {
      return {
        success: false,
        error: 'Photo is already deleted or deletion is already requested'
      }
    }
    
    // Create deletion request
    const requestId = generateDeletionRequestId()
    const deletionRequest: DeletionRequest = {
      photoId: data.photoId,
      requestedBy: data.requestedBy,
      requesterEmail: data.requesterEmail,
      requesterRole: data.requesterRole,
      reason: data.reason,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    }
    
    // Store deletion request
    deletionRequests.set(requestId, deletionRequest)
    
    // Update photo status
    submission.status = 'deletion_requested'
    submission.deletionRequestedAt = new Date().toISOString()
    submission.deletionRequestedBy = data.requestedBy
    submission.deletionReason = data.reason
    
    // Send admin notification
    await sendDeletionRequestNotification(submission, deletionRequest)
    
    return {
      success: true,
      requestId: requestId,
      message: 'Deletion request submitted successfully. It will be reviewed by our team.'
    }
    
  } catch (error) {
    console.error('Error requesting photo deletion:', error)
    return {
      success: false,
      error: 'Failed to request photo deletion'
    }
  }
}

// Approve/reject deletion request
export async function reviewDeletionRequest(data: {
  requestId: string
  status: 'approved' | 'rejected'
  reviewedBy: string
  rejectionReason?: string
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const request = deletionRequests.get(data.requestId)
    if (!request) {
      return {
        success: false,
        error: 'Deletion request not found'
      }
    }
    
    const submission = photoSubmissions.get(request.photoId)
    if (!submission) {
      return {
        success: false,
        error: 'Photo not found'
      }
    }
    
    // Update request
    request.status = data.status
    request.reviewedAt = new Date().toISOString()
    request.reviewedBy = data.reviewedBy
    if (data.rejectionReason) {
      request.rejectionReason = data.rejectionReason
    }
    
    if (data.status === 'approved') {
      // Soft delete the photo
      submission.status = 'deleted'
      submission.deletedAt = new Date().toISOString()
      submission.deletedBy = data.reviewedBy
      submission.canRecoverUntil = calculateRecoveryDeadline()
      
      // Update farm photo count
      const currentCount = farmPhotoCounts.get(submission.farmSlug) || 0
      if (currentCount > 0) {
        farmPhotoCounts.set(submission.farmSlug, currentCount - 1)
      }
      
      // Send approval notification
      await sendDeletionApprovalNotification(submission, request)
      
    } else {
      // Reject deletion - restore photo to previous status
      submission.status = 'approved' // or whatever it was before
      submission.deletionRequestedAt = undefined
      submission.deletionRequestedBy = undefined
      submission.deletionReason = undefined
      
      // Send rejection notification
      await sendDeletionRejectionNotification(submission, request, data.rejectionReason || '')
    }
    
    return {
      success: true,
      message: `Deletion request ${data.status}`
    }
    
  } catch (error) {
    console.error('Error reviewing deletion request:', error)
    return {
      success: false,
      error: 'Failed to review deletion request'
    }
  }
}

// Recover deleted photo (admin only)
export async function recoverDeletedPhoto(photoId: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const submission = photoSubmissions.get(photoId)
    if (!submission) {
      return {
        success: false,
        error: 'Photo not found'
      }
    }
    
    if (submission.status !== 'deleted') {
      return {
        success: false,
        error: 'Photo is not deleted'
      }
    }
    
    if (!canRecoverPhoto(submission)) {
      return {
        success: false,
        error: 'Photo recovery window has expired'
      }
    }
    
    // Restore photo
    submission.status = 'approved'
    submission.deletedAt = undefined
    submission.deletedBy = undefined
    submission.canRecoverUntil = undefined
    
    // Update farm photo count
    const currentCount = farmPhotoCounts.get(submission.farmSlug) || 0
    farmPhotoCounts.set(submission.farmSlug, currentCount + 1)
    
    return {
      success: true,
      message: 'Photo recovered successfully'
    }
    
  } catch (error) {
    console.error('Error recovering deleted photo:', error)
    return {
      success: false,
      error: 'Failed to recover photo'
    }
  }
}

// Get all photos for a farm (excluding deleted)
export async function getFarmPhotos(farmSlug: string, status?: 'approved' | 'pending' | 'rejected'): Promise<PhotoSubmission[]> {
  const photos = Array.from(photoSubmissions.values())
    .filter(photo => photo.farmSlug === farmSlug && photo.status !== 'deleted')
  
  if (status) {
    return photos.filter(photo => photo.status === status)
  }
  
  return photos
}

// Get pending photos for admin review
export async function getPendingPhotos(): Promise<PhotoSubmission[]> {
  return Array.from(photoSubmissions.values())
    .filter(photo => photo.status === 'pending')
}

// Get deletion requests for admin review
export async function getPendingDeletionRequests(): Promise<DeletionRequest[]> {
  return Array.from(deletionRequests.values())
    .filter(request => request.status === 'pending')
}

// Get deleted photos that can still be recovered
export async function getRecoverablePhotos(): Promise<PhotoSubmission[]> {
  return Array.from(photoSubmissions.values())
    .filter(photo => photo.status === 'deleted' && canRecoverPhoto(photo))
}

// Clean up expired deleted photos (run periodically)
export async function cleanupExpiredDeletedPhotos(): Promise<number> {
  const now = new Date()
  let cleanedCount = 0
  
  for (const [photoId, submission] of photoSubmissions.entries()) {
    if (submission.status === 'deleted' && submission.canRecoverUntil) {
      if (now > new Date(submission.canRecoverUntil)) {
        // Permanently delete (in production, this would delete from storage)
        photoSubmissions.delete(photoId)
        cleanedCount++
      }
    }
  }
  
  return cleanedCount
}

// Get photo statistics
export async function getPhotoStats(): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
  deleted: number
  deletionRequested: number
  farms: number
}> {
  const photos = Array.from(photoSubmissions.values())
  const farms = new Set(photos.map(photo => photo.farmSlug))
  
  return {
    total: photos.length,
    pending: photos.filter(p => p.status === 'pending').length,
    approved: photos.filter(p => p.status === 'approved').length,
    rejected: photos.filter(p => p.status === 'rejected').length,
    deleted: photos.filter(p => p.status === 'deleted').length,
    deletionRequested: photos.filter(p => p.status === 'deletion_requested').length,
    farms: farms.size
  }
}
