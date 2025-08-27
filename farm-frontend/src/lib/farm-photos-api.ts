// Farm Photos API Integration Layer
// Communicates with the farm-photos service

import { FARM_PHOTOS_CONFIG, getFarmPhotosApiUrl } from '@/config/farm-photos'
import type { PhotoSubmission, PhotoSubmissionRequest, PhotoSubmissionResponse, PhotoReviewRequest, PhotoListResponse } from '@/types/photo'

// API Client for farm-photos service
class FarmPhotosAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = FARM_PHOTOS_CONFIG.API_URL
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = getFarmPhotosApiUrl(endpoint)
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Submit a new photo
  async submitPhoto(data: PhotoSubmissionRequest): Promise<PhotoSubmissionResponse> {
    return this.request<PhotoSubmissionResponse>(FARM_PHOTOS_CONFIG.ENDPOINTS.SUBMIT, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Get photos for a specific farm
  async getFarmPhotos(farmSlug: string, status?: 'pending' | 'approved' | 'rejected'): Promise<PhotoListResponse> {
    const params = new URLSearchParams({ farmSlug })
    if (status) {
      params.append('status', status)
    }
    
    return this.request<PhotoListResponse>(`${FARM_PHOTOS_CONFIG.ENDPOINTS.GET_FARM_PHOTOS}?${params}`)
  }

  // Get a specific photo by ID
  async getPhoto(photoId: string): Promise<PhotoSubmission> {
    return this.request<PhotoSubmission>(`${FARM_PHOTOS_CONFIG.ENDPOINTS.GET_PHOTO}/${photoId}`)
  }

  // Update photo status (approve/reject)
  async updatePhotoStatus(photoId: string, action: 'approve' | 'reject', reason?: string, reviewerId?: string): Promise<{ success: boolean; message: string }> {
    const reviewRequest: PhotoReviewRequest = {
      submissionId: photoId,
      action,
      reason,
      reviewerId: reviewerId || 'admin',
    }

    return this.request<{ success: boolean; message: string }>(`${FARM_PHOTOS_CONFIG.ENDPOINTS.UPDATE_STATUS}/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify(reviewRequest),
    })
  }

  // Get all pending photos for admin review
  async getPendingPhotos(): Promise<PhotoSubmission[]> {
    const response = await this.request<PhotoListResponse>(FARM_PHOTOS_CONFIG.ENDPOINTS.GET_PENDING)
    return response.photos
  }

  // Get deletion requests
  async getDeletionRequests(): Promise<any[]> {
    return this.request<any[]>(FARM_PHOTOS_CONFIG.ENDPOINTS.GET_DELETION_REQUESTS)
  }

  // Review deletion request
  async reviewDeletionRequest(requestId: string, status: 'approved' | 'rejected', reason?: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`${FARM_PHOTOS_CONFIG.ENDPOINTS.REVIEW_DELETION}/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    })
  }

  // Get recoverable photos
  async getRecoverablePhotos(): Promise<PhotoSubmission[]> {
    return this.request<PhotoSubmission[]>(FARM_PHOTOS_CONFIG.ENDPOINTS.GET_RECOVERABLE)
  }

  // Recover a deleted photo
  async recoverPhoto(photoId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`${FARM_PHOTOS_CONFIG.ENDPOINTS.RECOVER_PHOTO}/${photoId}`, {
      method: 'POST',
    })
  }

  // Delete a photo permanently
  async deletePhoto(photoId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`${FARM_PHOTOS_CONFIG.ENDPOINTS.DELETE_PHOTO}/${photoId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    })
  }

  // Get photo statistics
  async getPhotoStats(): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
    deleted: number
    deletionRequests: number
  }> {
    return this.request(FARM_PHOTOS_CONFIG.ENDPOINTS.GET_STATS)
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/api/health')
  }
}

// Export singleton instance
export const farmPhotosAPI = new FarmPhotosAPI()

// Convenience functions for common operations
export async function submitFarmPhoto(data: PhotoSubmissionRequest): Promise<PhotoSubmissionResponse> {
  return farmPhotosAPI.submitPhoto(data)
}

export async function getFarmPhotos(farmSlug: string, status?: 'pending' | 'approved' | 'rejected'): Promise<PhotoSubmission[]> {
  const response = await farmPhotosAPI.getFarmPhotos(farmSlug, status)
  return response.photos
}

export async function getPendingPhotosForAdmin(): Promise<PhotoSubmission[]> {
  return farmPhotosAPI.getPendingPhotos()
}

export async function approvePhoto(photoId: string, reviewerId?: string): Promise<boolean> {
  try {
    const result = await farmPhotosAPI.updatePhotoStatus(photoId, 'approve', undefined, reviewerId)
    return result.success
  } catch (error) {
    console.error('Error approving photo:', error)
    return false
  }
}

export async function rejectPhoto(photoId: string, reason: string, reviewerId?: string): Promise<boolean> {
  try {
    const result = await farmPhotosAPI.updatePhotoStatus(photoId, 'reject', reason, reviewerId)
    return result.success
  } catch (error) {
    console.error('Error rejecting photo:', error)
    return false
  }
}

export async function deletePhoto(photoId: string, reason?: string): Promise<boolean> {
  try {
    const result = await farmPhotosAPI.deletePhoto(photoId, reason)
    return result.success
  } catch (error) {
    console.error('Error deleting photo:', error)
    return false
  }
}

export async function getPhotoStats(): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
  deleted: number
  deletionRequests: number
}> {
  return farmPhotosAPI.getPhotoStats()
}

// Error handling wrapper
export async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await apiCall()
    return { success: true, data }
  } catch (error) {
    console.error('API call failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
