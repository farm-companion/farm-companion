'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import PhotoViewer from './PhotoViewer'

interface ShopImageGalleryProps {
  images?: string[]
  shopName: string
  shopSlug: string
}

interface PhotoSubmission {
  id: string
  photoUrl: string
  thumbnailUrl: string
  description: string
  submitterName: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  qualityScore?: number
}

export default function ShopImageGallery({ images, shopName, shopSlug }: ShopImageGalleryProps) {
  const [approvedPhotos, setApprovedPhotos] = useState<PhotoSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch approved photos from farm-photos system
  useEffect(() => {
    async function fetchApprovedPhotos() {
      try {
        const response = await fetch(`/api/photos?farmSlug=${shopSlug}&status=approved`)
        if (response.ok) {
          const result = await response.json()
          setApprovedPhotos(result.photos || [])
        }
      } catch (error) {
        console.error('Error fetching approved photos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApprovedPhotos()
  }, [shopSlug])

  // Combine static images with approved user submissions
  const allImages = [
    ...(images || []),
    ...approvedPhotos.map(photo => photo.photoUrl)
  ]

  // If no images and still loading, show loading state
  if (isLoading) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <div className="animate-pulse">
          <div className="mx-auto mb-4 h-16 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48 mx-auto"></div>
        </div>
      </div>
    )
  }

  // If no images, show a placeholder
  if (allImages.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <div className="mx-auto mb-4 h-16 w-16 text-gray-400">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No images yet</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          We don&apos;t have photos of {shopName} yet. 
          <br />
          <span className="text-xs">
            Own this shop? <a href={`/claim/${shopSlug}`} className="underline hover:no-underline">Claim it</a> to add photos.
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Static images gallery (if any) */}
      {images && images.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Farm Photos</h2>
          
          {/* Main large image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <Image
              src={images[selectedImage]}
              alt={`${shopName} - Photo ${selectedImage + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={selectedImage === 0}
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer object-cover transition-transform hover:scale-105"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/10"
              aria-label="View full size image"
            >
              <svg className="h-8 w-8 text-white opacity-0 transition-opacity hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedImage === index
                      ? 'border-brand-primary'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${shopName} thumbnail ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 20vw, 15vw"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* User-submitted photos */}
      <PhotoViewer 
        photos={approvedPhotos}
        title={approvedPhotos.length > 0 ? "Community Photos" : undefined}
        showStatus={false}
        className="mt-8"
      />

      {/* Full-screen modal for static images */}
      {isModalOpen && images && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative max-h-full max-w-full p-4">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-4 -right-4 z-10 rounded-full bg-white p-2 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main image */}
            <div className="relative max-h-[90vh] max-w-[90vw]">
              <Image
                src={images[selectedImage]}
                alt={`${shopName} - Photo ${selectedImage + 1}`}
                width={1200}
                height={800}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                priority
              />
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 hover:bg-white dark:bg-gray-800/80 dark:text-white dark:hover:bg-gray-800"
                  aria-label="Previous image"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 hover:bg-white dark:bg-gray-800/80 dark:text-white dark:hover:bg-gray-800"
                  aria-label="Next image"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-white">
              {selectedImage + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
