'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ShopImageHeaderProps {
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

export default function ShopImageHeader({ images, shopName, shopSlug }: ShopImageHeaderProps) {
  const [approvedPhotos, setApprovedPhotos] = useState<PhotoSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

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

  // Auto-rotate carousel
  useEffect(() => {
    if (allImages.length <= 1 || !isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [allImages.length, isAutoPlaying])

  // If no images and still loading, show loading state
  if (isLoading) {
    return (
      <div className="relative h-64 md:h-80 lg:h-96 bg-gray-200 dark:bg-gray-800 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Loading images...</p>
          </div>
        </div>
      </div>
    )
  }

  // If no images, show a placeholder
  if (allImages.length === 0) {
    return (
      <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No images yet</h3>
            <p className="text-sm max-w-md mx-auto">
              We don&apos;t have photos of {shopName} yet. 
              <br />
              <span className="text-xs">
                Own this shop? <a href={`/claim/${shopSlug}`} className="underline hover:no-underline">Claim it</a> to add photos.
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  return (
    <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Main Image */}
      <div className="relative h-full w-full">
        <Image
          src={allImages[currentImageIndex]}
          alt={`${shopName} - Photo ${currentImageIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={currentImageIndex === 0}
          quality={85}
          loading={currentImageIndex === 0 ? "eager" : "lazy"}
        />
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* Navigation arrows (only show if multiple images) */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            onMouseEnter={() => setIsAutoPlaying(false)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors backdrop-blur-sm"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextImage}
            onMouseEnter={() => setIsAutoPlaying(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors backdrop-blur-sm"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image counter and controls */}
      {allImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4">
          {/* Image counter */}
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {currentImageIndex + 1} of {allImages.length}
          </div>
          
          {/* Play/Pause button */}
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="bg-black/50 text-white p-1 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
            aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isAutoPlaying ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Dot indicators */}
      {allImages.length > 1 && (
        <div className="absolute bottom-4 left-4 flex space-x-2">
          {allImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              onMouseEnter={() => setIsAutoPlaying(false)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Shop name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
          {shopName}
        </h1>
      </div>
    </div>
  )
}
