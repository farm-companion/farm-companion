import redis, { ensureConnection } from './redis'
import { del } from '@vercel/blob'
import { logger } from '@/lib/logger'

const photoLogger = logger.child({ route: 'lib/photo-storage' })

export type PhotoSubmission = {
  id: string
  farmSlug: string
  url: string
  caption?: string
  authorName?: string
  authorEmail?: string
  status: 'pending' | 'approved' | 'rejected' | 'deleted' | 'replaced'
  createdAt: number
  approvedAt?: number
  rejectedAt?: number
  deletedAt?: number
  replacedAt?: number
  replacedBy?: string
  deletionRequest?: {
    requestedBy: string
    requesterEmail: string
    requesterRole: string
    reason: string
    requestedAt: number
  }
}

export type DeletionRequest = {
  requestId: string
  photoId: string
  requestedBy: string
  requesterEmail: string
  requesterRole: string
  reason: string
  requestedAt: number
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: number
  reviewNotes?: string
}

export async function getPhotoSubmission(photoId: string): Promise<PhotoSubmission | null> {
  try {
    const client = await ensureConnection()
    const photoData = await client.hGetAll(`photo:${photoId}`)
    
    if (!photoData || !photoData.id) {
      return null
    }
    
    return {
      id: photoData.id,
      farmSlug: photoData.farmSlug,
      url: photoData.url,
      caption: photoData.caption,
      authorName: photoData.authorName,
      authorEmail: photoData.authorEmail,
      status: photoData.status as any,
      createdAt: parseInt(photoData.createdAt) || 0,
      approvedAt: photoData.approvedAt ? parseInt(photoData.approvedAt) : undefined,
      rejectedAt: photoData.rejectedAt ? parseInt(photoData.rejectedAt) : undefined,
      deletedAt: photoData.deletedAt ? parseInt(photoData.deletedAt) : undefined,
      replacedAt: photoData.replacedAt ? parseInt(photoData.replacedAt) : undefined,
      replacedBy: photoData.replacedBy,
      deletionRequest: photoData.deletionRequest ? JSON.parse(photoData.deletionRequest) : undefined
    }
  } catch (error) {
    photoLogger.error('Error getting photo submission', { photoId }, error as Error)
    return null
  }
}

export async function updatePhotoStatus(photoId: string, status: string, metadata: any = {}): Promise<boolean> {
  try {
    const client = await ensureConnection()
    const timestamp = Date.now().toString()
    
    const updates: any = {
      status,
      [`${status}At`]: timestamp
    }
    
    // Add any additional metadata
    Object.assign(updates, metadata)
    
    await client.hSet(`photo:${photoId}`, updates)
    return true
  } catch (error) {
    photoLogger.error('Error updating photo status', { photoId, status }, error as Error)
    return false
  }
}

export async function requestPhotoDeletion(params: {
  photoId: string
  requestedBy: string
  requesterEmail: string
  requesterRole: string
  reason: string
}): Promise<{ success: boolean; message?: string; error?: string; requestId?: string }> {
  try {
    const client = await ensureConnection()
    const requestId = `deletion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const deletionRequest: DeletionRequest = {
      requestId,
      photoId: params.photoId,
      requestedBy: params.requestedBy,
      requesterEmail: params.requesterEmail,
      requesterRole: params.requesterRole,
      reason: params.reason,
      requestedAt: Date.now(),
      status: 'pending'
    }
    
    // Store deletion request
    await client.hSet(`deletion_request:${requestId}`, {
      ...deletionRequest,
      requestedAt: deletionRequest.requestedAt.toString()
    })
    
    // Add to pending deletion requests list
    await client.lPush('deletion_requests:pending', requestId)
    
    // Update photo with deletion request info
    await client.hSet(`photo:${params.photoId}`, {
      deletionRequest: JSON.stringify(deletionRequest)
    })
    
    return {
      success: true,
      message: 'Deletion request submitted successfully',
      requestId
    }
  } catch (error) {
    photoLogger.error('Error requesting photo deletion', { photoId: params.photoId }, error as Error)
    return {
      success: false,
      error: 'Failed to submit deletion request'
    }
  }
}

export async function reviewDeletionRequest(params: {
  requestId: string
  action: 'approve' | 'reject'
  reviewedBy: string
  reviewNotes?: string
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const client = await ensureConnection()
    const timestamp = Date.now().toString()
    
    // Get deletion request
    const requestData = await client.hGetAll(`deletion_request:${params.requestId}`)
    if (!requestData || !requestData.photoId) {
      return {
        success: false,
        error: 'Deletion request not found'
      }
    }
    
    const photoId = requestData.photoId
    
    if (params.action === 'approve') {
      // Delete the photo from blob storage
      try {
        const photo = await getPhotoSubmission(photoId)
        if (photo?.url) {
          await del(photo.url)
        }
      } catch (blobError) {
        photoLogger.warn('Failed to delete from blob storage', { photoId }, blobError as Error)
      }

      // Update photo status
      await updatePhotoStatus(photoId, 'deleted', {
        deletedAt: timestamp
      })
      
      // Update deletion request status
      await client.hSet(`deletion_request:${params.requestId}`, {
        status: 'approved',
        reviewedBy: params.reviewedBy,
        reviewedAt: timestamp,
        reviewNotes: params.reviewNotes || ''
      })
      
      // Remove from pending list and add to approved list
      await client.lRem('deletion_requests:pending', 0, params.requestId)
      await client.lPush('deletion_requests:approved', params.requestId)
      
      return {
        success: true,
        message: 'Photo deleted successfully'
      }
    } else {
      // Reject deletion request
      await client.hSet(`deletion_request:${params.requestId}`, {
        status: 'rejected',
        reviewedBy: params.reviewedBy,
        reviewedAt: timestamp,
        reviewNotes: params.reviewNotes || ''
      })
      
      // Remove from pending list and add to rejected list
      await client.lRem('deletion_requests:pending', 0, params.requestId)
      await client.lPush('deletion_requests:rejected', params.requestId)
      
      // Remove deletion request from photo
      await client.hDel(`photo:${photoId}`, 'deletionRequest')
      
      return {
        success: true,
        message: 'Deletion request rejected'
      }
    }
  } catch (error) {
    photoLogger.error('Error reviewing deletion request', { requestId: params.requestId, action: params.action }, error as Error)
    return {
      success: false,
      error: 'Failed to review deletion request'
    }
  }
}

export async function recoverDeletedPhoto(photoId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const client = await ensureConnection()
    
    // Check if photo exists and is deleted
    const photo = await getPhotoSubmission(photoId)
    if (!photo || photo.status !== 'deleted') {
      return {
        success: false,
        error: 'Photo not found or not deleted'
      }
    }
    
    // Update photo status back to approved
    await updatePhotoStatus(photoId, 'approved', {
      approvedAt: Date.now().toString()
    })
    
    // Remove deletion request info
    await client.hDel(`photo:${photoId}`, 'deletionRequest', 'deletedAt')
    
    return {
      success: true,
      message: 'Photo recovered successfully'
    }
  } catch (error) {
    photoLogger.error('Error recovering deleted photo', { photoId }, error as Error)
    return {
      success: false,
      error: 'Failed to recover photo'
    }
  }
}

export async function getPendingDeletionRequests(): Promise<DeletionRequest[]> {
  try {
    const client = await ensureConnection()
    const requestIds = await client.lRange('deletion_requests:pending', 0, -1)
    
    const requests = await Promise.all(
      requestIds.map(async (requestId: string) => {
        const requestData = await client.hGetAll(`deletion_request:${requestId}`)
        if (!requestData || !requestData.requestId) return null
        
        return {
          requestId: requestData.requestId,
          photoId: requestData.photoId,
          requestedBy: requestData.requestedBy,
          requesterEmail: requestData.requesterEmail,
          requesterRole: requestData.requesterRole,
          reason: requestData.reason,
          requestedAt: parseInt(requestData.requestedAt) || 0,
          status: requestData.status as any,
          reviewedBy: requestData.reviewedBy,
          reviewedAt: requestData.reviewedAt ? parseInt(requestData.reviewedAt) : undefined,
          reviewNotes: requestData.reviewNotes
        }
      })
    )
    
    return requests.filter(Boolean) as DeletionRequest[]
  } catch (error) {
    photoLogger.error('Error getting pending deletion requests', {}, error as Error)
    return []
  }
}

export async function getRecoverablePhotos(): Promise<PhotoSubmission[]> {
  try {
    const client = await ensureConnection()
    const photoIds = await client.lRange('photos:deleted', 0, -1)
    
    const photos = await Promise.all(
      photoIds.map(async (photoId: string) => {
        return await getPhotoSubmission(photoId)
      })
    )
    
    return photos.filter(Boolean) as PhotoSubmission[]
  } catch (error) {
    photoLogger.error('Error getting recoverable photos', {}, error as Error)
    return []
  }
}

export async function cleanupExpiredDeletedPhotos(): Promise<number> {
  try {
    const client = await ensureConnection()
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    
    // Get all deleted photos
    const photoIds = await client.lRange('photos:deleted', 0, -1)
    let cleanedCount = 0
    
    for (const photoId of photoIds) {
      const photo = await getPhotoSubmission(photoId)
      if (photo && photo.deletedAt && photo.deletedAt < thirtyDaysAgo) {
        // Delete from blob storage
        try {
          if (photo.url) {
            await del(photo.url)
          }
        } catch (blobError) {
          photoLogger.warn('Failed to delete from blob storage during cleanup', { photoId }, blobError as Error)
        }

        // Remove from Redis
        await client.del(`photo:${photoId}`)
        await client.lRem('photos:deleted', 0, photoId)
        
        cleanedCount++
      }
    }
    
    return cleanedCount
  } catch (error) {
    photoLogger.error('Error cleaning up expired deleted photos', {}, error as Error)
    return 0
  }
}
