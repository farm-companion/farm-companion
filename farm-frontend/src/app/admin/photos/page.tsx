import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { Trash2, RotateCcw, Camera } from 'lucide-react'

import { getFarmPhotosApiUrl } from '@/config/farm-photos'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

// Metadata for SEO and clarity
export const metadata: Metadata = {
  title: 'Photo Management - Farm Companion Admin',
  description: 'Review and manage photo submissions for Farm Companion',
  keywords: 'admin, photo management, farm companion, moderation',
}

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
  aiAnalysis?: {
    qualityScore: number
    isAppropriate: boolean
    tags: string[]
  }
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
  canRecoverUntil?: string
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

// Load photo submissions from farm-photos system
async function loadPhotoSubmissions(): Promise<PhotoSubmission[]> {
  try {
    const response = await fetch(getFarmPhotosApiUrl('api/photos?status=pending'), {
      cache: 'no-store'
    })
    
    if (response.ok) {
      const result = await response.json()
      return result.photos || []
    }
    
    return []
  } catch (error) {
    console.error('Error loading photo submissions:', error)
    return []
  }
}

// Load deletion requests
async function loadDeletionRequests(): Promise<DeletionRequest[]> {
  try {
    const response = await fetch('/api/photos/deletion-requests', {
      cache: 'no-store'
    })
    
    if (response.ok) {
      const result = await response.json()
      return result.requests || []
    }
    
    return []
  } catch (error) {
    console.error('Error loading deletion requests:', error)
    return []
  }
}

// Load recoverable photos
async function loadRecoverablePhotos(): Promise<PhotoSubmission[]> {
  try {
    const response = await fetch('/api/photos/deletion-requests?type=recoverable', {
      cache: 'no-store'
    })
    
    if (response.ok) {
      const result = await response.json()
      return result.photos || []
    }
    
    return []
  } catch (error) {
    console.error('Error loading recoverable photos:', error)
    return []
  }
}

// Approve or reject a photo submission
async function updatePhotoStatus(photoId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
  try {
    const response = await fetch(getFarmPhotosApiUrl(`api/photos/${photoId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        rejectionReason,
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'admin'
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error updating photo status:', error)
    return false
  }
}

// Review deletion request
async function reviewDeletionRequest(requestId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
  try {
    const response = await fetch(`/api/photos/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'review_deletion',
        requestId,
        status,
        reviewedBy: 'admin',
        rejectionReason
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error reviewing deletion request:', error)
    return false
  }
}

// Recover deleted photo
async function recoverDeletedPhoto(photoId: string) {
  try {
    const response = await fetch(`/api/photos/${photoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'recover',
        recoveredBy: 'admin'
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error recovering deleted photo:', error)
    return false
  }
}

export default async function AdminPhotosPage() {
  // Require authentication
  await requireAuth()
  
  const [submissions, deletionRequests, recoverablePhotos] = await Promise.all([
    loadPhotoSubmissions(),
    loadDeletionRequests(),
    loadRecoverablePhotos()
  ])

  const pendingSubmissions = submissions.filter(s => s.status === 'pending')

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-heading mb-2">Photo Management</h1>
        <p className="text-text-muted">Review and manage photo submissions and deletion requests</p>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-text-heading">Pending Reviews</h3>
          <p className="text-2xl font-bold text-brand-primary">{pendingSubmissions.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-text-heading">Deletion Requests</h3>
          <p className="text-2xl font-bold text-orange-600">{deletionRequests.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-text-heading">Recoverable Photos</h3>
          <p className="text-2xl font-bold text-red-600">{recoverablePhotos.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-text-heading">Total Submissions</h3>
          <p className="text-2xl font-bold text-text-heading">{submissions.length}</p>
        </div>
      </div>

      {/* Deletion Requests Section */}
      {deletionRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-text-heading mb-4 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            Deletion Requests
          </h2>
          <div className="space-y-4">
            {deletionRequests.map((request) => (
              <div key={request.photoId} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-heading mb-2">Deletion Request</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Requested by:</span>
                        <span className="ml-2">{request.requestedBy} ({request.requesterRole})</span>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>
                        <span className="ml-2">{request.requesterEmail}</span>
                      </div>
                      <div>
                        <span className="font-medium">Reason:</span>
                        <span className="ml-2">{request.reason}</span>
                      </div>
                      <div>
                        <span className="font-medium">Requested:</span>
                        <span className="ml-2">{new Date(request.requestedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <form action={async () => {
                      'use server'
                      await reviewDeletionRequest(request.photoId, 'approved')
                    }}>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Approve Deletion
                      </button>
                    </form>
                    
                    <form action={async (formData: FormData) => {
                      'use server'
                      const reason = formData.get('reason') as string
                      await reviewDeletionRequest(request.photoId, 'rejected', reason)
                    }}>
                      <input
                        type="text"
                        name="reason"
                        placeholder="Rejection reason"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mr-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recoverable Photos Section */}
      {recoverablePhotos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-text-heading mb-4 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-blue-600" />
            Recoverable Photos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recoverablePhotos.map((photo) => (
              <div key={photo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.description}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs">
                    Deleted
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-text-heading mb-2">{photo.farmName}</h3>
                  <p className="text-sm text-text-muted mb-2">{photo.description}</p>
                  <p className="text-xs text-text-muted mb-3">
                    Deleted: {new Date(photo.deletedAt!).toLocaleString()}
                    <br />
                    Can recover until: {new Date(photo.canRecoverUntil!).toLocaleString()}
                  </p>
                  
                  <form action={async () => {
                    'use server'
                    await recoverDeletedPhoto(photo.id)
                  }}>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Recover Photo
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending Photo Submissions */}
      {pendingSubmissions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-text-heading mb-4 flex items-center gap-2">
            <Camera className="w-6 h-6 text-green-600" />
            Pending Photo Submissions
          </h2>
          <div className="space-y-6">
            {pendingSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="md:flex">
                  {/* Photo */}
                  <div className="md:w-1/3">
                    <div className="relative h-64 md:h-full">
                      <Image
                        src={submission.thumbnailUrl}
                        alt={submission.description}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-text-heading mb-2">{submission.farmName}</h3>
                        <p className="text-text-muted">{submission.description}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Pending Review
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Analysis */}
                    {submission.aiAnalysis && (
                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="font-medium text-text-heading mb-2">AI Analysis</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Quality Score:</span>
                            <span className="ml-2">{submission.aiAnalysis.qualityScore}/100</span>
                          </div>
                          <div>
                            <span className="font-medium">Appropriate:</span>
                            <span className={`ml-2 ${submission.aiAnalysis.isAppropriate ? 'text-green-600' : 'text-red-600'}`}>
                              {submission.aiAnalysis.isAppropriate ? 'Yes' : 'No'}
                            </span>
                          </div>
                          {submission.aiAnalysis.tags.length > 0 && (
                            <div className="col-span-2">
                              <span className="font-medium">Tags:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {submission.aiAnalysis.tags.map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Submission Details */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-text-heading mb-2">Submission Details</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Farm:</span>
                            <Link href={`/shop/${submission.farmSlug}`} className="ml-2 text-brand-primary hover:underline">
                              {submission.farmName}
                            </Link>
                          </div>
                          <div>
                            <span className="font-medium">Submitted by:</span>
                            <span className="ml-2">{submission.submitterName}</span>
                          </div>
                          <div>
                            <span className="font-medium">Email:</span>
                            <span className="ml-2">{submission.submitterEmail}</span>
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span>
                            <span className="ml-2">{new Date(submission.submittedAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="font-medium">File size:</span>
                            <span className="ml-2">{(submission.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <div>
                            <span className="font-medium">Dimensions:</span>
                            <span className="ml-2">{submission.dimensions.width} × {submission.dimensions.height}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-text-heading mb-2">Description</h4>
                        <p className="text-sm text-text-muted bg-background-surface p-3 rounded">
                          {submission.description}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <form action={async () => {
                          'use server'
                          await updatePhotoStatus(submission.id, 'approved')
                        }}>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Approve
                          </button>
                        </form>
                        
                        <form action={async (formData: FormData) => {
                          'use server'
                          const reason = formData.get('reason') as string
                          await updatePhotoStatus(submission.id, 'rejected', reason)
                        }}>
                          <input
                            type="text"
                            name="reason"
                            placeholder="Rejection reason (optional)"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mr-2 text-sm"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {pendingSubmissions.length === 0 && deletionRequests.length === 0 && recoverablePhotos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-text-heading mb-2">All Caught Up!</h2>
          <p className="text-text-muted">No pending reviews or deletion requests at the moment.</p>
        </div>
      )}
    </main>
  )
}
