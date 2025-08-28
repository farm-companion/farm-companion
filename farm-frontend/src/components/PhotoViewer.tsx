'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Photo {
  id: string
  photoUrl: string
  thumbnailUrl: string
  description: string
  submitterName: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  qualityScore?: number
}

interface PhotoViewerProps {
  photos: Photo[]
  title?: string
  showStatus?: boolean
  className?: string
  userRole?: 'admin' | 'shop_owner' | 'submitter'
  userEmail?: string
}

export default function PhotoViewer({ 
  photos, 
  title = "Farm Photos", 
  showStatus = false,
  className = "",
  userRole = 'submitter',
  userEmail = ''
}: PhotoViewerProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showDeletionRequest, setShowDeletionRequest] = useState(false)

  const openModal = (photo: Photo) => {
    const index = photos.findIndex(p => p.id === photo.id)
    setCurrentPhotoIndex(index)
    setSelectedPhoto(photo)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPhoto(null)
    setCurrentPhotoIndex(0)
  }

  const nextPhoto = () => {
    const nextIndex = (currentPhotoIndex + 1) % photos.length
    setCurrentPhotoIndex(nextIndex)
    setSelectedPhoto(photos[nextIndex])
  }

  const prevPhoto = () => {
    const prevIndex = currentPhotoIndex === 0 ? photos.length - 1 : currentPhotoIndex - 1
    setCurrentPhotoIndex(prevIndex)
    setSelectedPhoto(photos[prevIndex])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'pending':
        return 'Pending Review'
      default:
        return 'Unknown'
    }
  }

  if (photos.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium">No photos yet</p>
          <p className="text-sm">Be the first to share a photo of this farm!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-xl font-semibold text-text-heading mb-4">{title}</h3>
      )}
      
      {/* Photo Grid - Responsive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="group relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            onClick={() => openModal(photo)}
          >
            {/* Photo Container */}
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              {/* Main Image */}
              <Image
                src={photo.thumbnailUrl}
                alt={photo.description}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={false}
                onError={(e) => {
                  // Fallback for failed images
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              
              {/* Status badge */}
              {showStatus && (
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(photo.status)}`}>
                  {getStatusText(photo.status)}
                </div>
              )}
              
              {/* Quality score */}
              {photo.qualityScore && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-50 text-white">
                  ⭐ {photo.qualityScore}/10
                </div>
              )}
              
              {/* Click to enlarge overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                  <svg className="w-8 h-8 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  <p className="text-white text-sm font-medium">Click to enlarge</p>
                </div>
              </div>
            </div>
            
            {/* Photo info */}
            <div className="p-3">
              <p className="text-sm text-text-body line-clamp-2 mb-2 font-medium">
                {photo.description}
              </p>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>By {photo.submitterName}</span>
                <span>{new Date(photo.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Modal for full-size photo with carousel */}
      {isModalOpen && selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90" onClick={closeModal}>
          <div className="relative max-w-6xl max-h-full bg-white rounded-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              aria-label="Close photo viewer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation arrows for carousel */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                  aria-label="Previous photo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                  aria-label="Next photo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Photo counter for carousel */}
            {photos.length > 1 && (
              <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black bg-opacity-50 text-white rounded-full text-sm">
                {currentPhotoIndex + 1} of {photos.length}
              </div>
            )}
            
            {/* Photo */}
            <div className="relative bg-gray-100">
              <Image
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.description}
                width={1200}
                height={800}
                className="w-full h-auto max-h-[70vh] object-contain"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"
              />
            </div>
            
            {/* Photo details */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text-heading mb-3">
                    {selectedPhoto.description}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-text-muted">
                    <span>By {selectedPhoto.submitterName}</span>
                    <span>•</span>
                    <span>{new Date(selectedPhoto.submittedAt).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                    {selectedPhoto.qualityScore && (
                      <>
                        <span>•</span>
                        <span>Quality: {selectedPhoto.qualityScore}/10</span>
                      </>
                    )}
                  </div>
                </div>
                
                {showStatus && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedPhoto.status)}`}>
                    {getStatusText(selectedPhoto.status)}
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.open(selectedPhoto.photoUrl, '_blank')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Open in new tab
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = selectedPhoto.photoUrl
                      link.download = `farm-photo-${selectedPhoto.id}.jpg`
                      link.click()
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Download
                  </button>
                  {(userRole === 'admin' || userRole === 'shop_owner' || 
                    (userRole === 'submitter' && selectedPhoto.submitterName === userEmail)) && (
                    <button
                      onClick={() => setShowDeletionRequest(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Request Deletion
                    </button>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  Click outside to close
                </div>
              </div>

              {/* Deletion Request Modal */}
              {showDeletionRequest && selectedPhoto && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Photo deletion requests are not available in the current version.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
