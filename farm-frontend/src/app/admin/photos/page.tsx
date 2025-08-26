import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { requireAuth } from '@/lib/auth'
import { 
  getPendingPhotosForAdmin,
  getPhotoStats,
  approvePhoto,
  rejectPhoto,
  safeApiCall
} from '@/lib/farm-photos-api'
import { 
  Camera, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Photo Management - Admin Dashboard',
  description: 'Manage farm photo submissions and reviews',
  keywords: 'admin, photo management, farm companion',
}

// Server Actions
async function updatePhotoStatus(photoId: string, status: 'approved' | 'rejected', reason?: string) {
  'use server'
  
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

async function reviewDeletionRequest(requestId: string, status: 'approved' | 'rejected', reason?: string) {
  'use server'
  
  await requireAuth()
  
  // This would need to be implemented in the farm-photos API
  // For now, we'll throw an error to indicate it's not implemented
  throw new Error('Deletion request review not yet implemented in farm-photos API')
}

async function recoverDeletedPhoto(photoId: string) {
  'use server'
  
  await requireAuth()
  
  // This would need to be implemented in the farm-photos API
  // For now, we'll throw an error to indicate it's not implemented
  throw new Error('Photo recovery not yet implemented in farm-photos API')
}

export default async function AdminPhotosPage() {
  // Require authentication
  const user = await requireAuth()
  
  // Get data from farm-photos API
  const [pendingResult, statsResult] = await Promise.all([
    safeApiCall(() => getPendingPhotosForAdmin()),
    safeApiCall(() => getPhotoStats())
  ])
  
  const pendingSubmissions = pendingResult.success ? pendingResult.data || [] : []
  const stats = statsResult.success ? statsResult.data || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    deleted: 0,
    deletionRequests: 0
  } : {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    deleted: 0,
    deletionRequests: 0
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Photo Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage farm photo submissions and reviews
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* API Connection Status */}
          {!pendingResult.success && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Farm Photos API Connection Issue
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>Unable to connect to the farm-photos service. Please ensure:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>The farm-photos service is running on port 3002</li>
                      <li>The FARM_PHOTOS_API_URL environment variable is set correctly</li>
                      <li>There are no network connectivity issues</li>
                    </ul>
                    <p className="mt-2 font-medium">Error: {pendingResult.error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Photos</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Camera className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Review</h3>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approved</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rejected</h3>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Trash2 className="h-8 w-8 text-gray-600" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deleted</h3>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.deleted}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deletion Requests</h3>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.deletionRequests}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Photo Submissions */}
          {pendingSubmissions.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Camera className="w-6 h-6 text-yellow-600" />
                Pending Photo Submissions ({pendingSubmissions.length})
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
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{submission.farmName}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{submission.description}</p>
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
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Analysis</h4>
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
                                     {submission.aiAnalysis.tags.map((tag: string, index: number) => (
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
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Submission Details</h3>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Farm:</span>
                                <Link href={`/shop/${submission.farmSlug}`} className="ml-2 text-blue-600 hover:underline">
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
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
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
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
          {pendingSubmissions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Caught Up!</h2>
              <p className="text-gray-600 dark:text-gray-400">No pending photo reviews at the moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
