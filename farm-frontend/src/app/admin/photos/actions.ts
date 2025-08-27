'use server'

import { requireAuth } from '@/lib/auth'
import { 
  approvePhoto,
  rejectPhoto,
  deletePhoto
} from '@/lib/farm-photos-api'

export async function updatePhotoStatus(photoId: string, status: 'approved' | 'rejected', reason?: string) {
  const user = await requireAuth()
  
  if (status === 'approved') {
    const success = await approvePhoto(photoId, user.email)
    if (!success) {
      throw new Error('Failed to approve photo')
    }
  } else {
    const success = await rejectPhoto(photoId, reason || 'No reason provided', user.email)
    if (!success) {
      throw new Error('Failed to reject photo')
    }
  }
}

export async function deletePhotoAction(photoId: string, reason?: string) {
  const user = await requireAuth()
  
  const success = await deletePhoto(photoId, reason)
  if (!success) {
    throw new Error('Failed to delete photo')
  }
}

export async function reviewDeletionRequest(requestId: string, status: 'approved' | 'rejected', reason?: string) {
  await requireAuth()
  
  // This would need to be implemented in the farm-photos API
  // For now, we'll throw an error to indicate it's not implemented
  throw new Error('Deletion request review not yet implemented in farm-photos API')
}

export async function recoverDeletedPhoto(photoId: string) {
  await requireAuth()
  
  // This would need to be implemented in the farm-photos API
  // For now, we'll throw an error to indicate it's not implemented
  throw new Error('Photo recovery not yet implemented in farm-photos API')
}
