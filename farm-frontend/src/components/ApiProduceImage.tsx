'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getProduceImages } from '@/lib/produce-integration'

interface ApiProduceImageProps {
  produceSlug: string
  produceName: string
  month?: number
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  alt?: string
  fallbackImage?: string
  isHero?: boolean // New prop to distinguish hero vs gallery
}

export default function ApiProduceImage({
  produceSlug,
  produceName,
  month,
  className = '',
  sizes,
  priority = false,
  fill = false,
  width,
  height,
  alt,
  fallbackImage,
  isHero = true // Default to hero image
}: ApiProduceImageProps) {
  const [apiImages, setApiImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImages() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch images for this produce and month
        const images = await getProduceImages(produceSlug, month)
        
        // Remove duplicates based on URL
        const uniqueImages = images.filter((image, index, self) => 
          index === self.findIndex(img => img.url === image.url)
        )
        
        // Filter images based on filename pattern and hierarchy
        const filteredImages = uniqueImages.filter(image => {
          const filename = image.url.split('/').pop() || ''
          // Very flexible pattern to handle various naming conventions
          // Matches: produceSlug1.jpg, produceSlug-fresh1.jpg, produceSlug_1.jpg, etc.
          const pattern = new RegExp(`^${produceSlug}[^\\d]*(\\d+)\\.(jpg|jpeg|png|webp)$`, 'i')
          const match = filename.match(pattern)
          
          if (!match) return false
          
          const imageNumber = parseInt(match[1], 10)
          
          if (isHero) {
            // For hero, only use image1
            return imageNumber === 1
          } else {
            // For gallery, use image2, image3, image4
            return imageNumber >= 2 && imageNumber <= 4
          }
        })
        
        // Sort by image number for consistent ordering
        filteredImages.sort((a, b) => {
          const aFilename = a.url.split('/').pop() || ''
          const bFilename = b.url.split('/').pop() || ''
          const aMatch = aFilename.match(new RegExp(`^${produceSlug}[^\\d]*(\\d+)`, 'i'))
          const bMatch = bFilename.match(new RegExp(`^${produceSlug}[^\\d]*(\\d+)`, 'i'))
          
          const aNum = aMatch ? parseInt(aMatch[1], 10) : 0
          const bNum = bMatch ? parseInt(bMatch[1], 10) : 0
          
          return aNum - bNum
        })
        
        setApiImages(filteredImages)
      } catch (err) {
        console.error('Error fetching API images:', err)
        setError(err instanceof Error ? err.message : 'Failed to load images')
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [produceSlug, month, isHero])

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className={`bg-background-surface animate-pulse ${className}`}>
        {fill ? (
          <div className="w-full h-full bg-background-canvas" />
        ) : (
          <div className="w-full h-full bg-background-canvas" style={{ width, height }} />
        )}
      </div>
    )
  }

  // If error or no images, show fallback
  if (error || apiImages.length === 0) {
    if (fallbackImage) {
      return (
        <Image
          src={fallbackImage}
          alt={alt || `${produceName} image`}
          className={className}
          sizes={sizes}
          priority={priority}
          fill={fill}
          width={width}
          height={height}
          quality={85}
        />
      )
    }
    
    return (
      <div className={`bg-background-surface border border-border-default flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-background-canvas rounded-full mx-auto mb-2 flex items-center justify-center border border-border-default">
            <span className="text-heading">🌱</span>
          </div>
          <p className="text-caption text-text-muted font-medium">{produceName}</p>
          <p className="text-small text-text-muted mt-1">No images available</p>
        </div>
      </div>
    )
  }

  // Use the first API image (should be image1 for hero, image2 for gallery)
  const apiImage = apiImages[0]
  
  return (
    <Image
      src={apiImage.url}
      alt={alt || apiImage.alt || `${produceName} image`}
      className={className}
      sizes={sizes}
      priority={priority}
      fill={fill}
      width={width}
      height={height}
      quality={85}
    />
  )
}

// Gallery component for multiple API images
interface ApiProduceGalleryProps {
  produceSlug: string
  produceName: string
  month?: number
  className?: string
  maxImages?: number
}

export function ApiProduceGallery({ 
  produceSlug, 
  produceName, 
  month, 
  className = '',
  maxImages = 3
}: ApiProduceGalleryProps) {
  const [apiImages, setApiImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImages() {
      try {
        setIsLoading(true)
        setError(null)
        
        const images = await getProduceImages(produceSlug, month)
        
        // Remove duplicates based on URL
        const uniqueImages = images.filter((image, index, self) => 
          index === self.findIndex(img => img.url === image.url)
        )
        
        // Filter for gallery images (image2, image3, image4)
        const galleryImages = uniqueImages.filter(image => {
          const filename = image.url.split('/').pop() || ''
          // Very flexible pattern to handle various naming conventions
          // Matches: produceSlug1.jpg, produceSlug-fresh1.jpg, produceSlug_1.jpg, etc.
          const pattern = new RegExp(`^${produceSlug}[^\\d]*(\\d+)\\.(jpg|jpeg|png|webp)$`, 'i')
          const match = filename.match(pattern)
          
          if (!match) return false
          
          const imageNumber = parseInt(match[1], 10)
          return imageNumber >= 2 && imageNumber <= 4
        })
        
        // Sort by image number for consistent ordering
        galleryImages.sort((a, b) => {
          const aFilename = a.url.split('/').pop() || ''
          const bFilename = b.url.split('/').pop() || ''
          const aMatch = aFilename.match(new RegExp(`^${produceSlug}[^\\d]*(\\d+)`, 'i'))
          const bMatch = bFilename.match(new RegExp(`^${produceSlug}[^\\d]*(\\d+)`, 'i'))
          
          const aNum = aMatch ? parseInt(aMatch[1], 10) : 0
          const bNum = bMatch ? parseInt(bMatch[1], 10) : 0
          
          return aNum - bNum
        })
        
        setApiImages(galleryImages.slice(0, maxImages))
      } catch (err) {
        console.error('Error fetching API images:', err)
        setError(err instanceof Error ? err.message : 'Failed to load images')
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [produceSlug, month, maxImages])

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-video bg-background-surface animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (error || apiImages.length === 0) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        <div className="aspect-video bg-background-surface border border-border-default rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-background-canvas rounded-full mx-auto mb-2 flex items-center justify-center border border-border-default">
              <span className="text-heading">🌱</span>
            </div>
            <p className="text-caption text-text-muted font-medium">{produceName}</p>
            <p className="text-small text-text-muted mt-1">No images available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {apiImages.map((image, index) => (
        <div key={image.id || index} className="aspect-video relative overflow-hidden rounded-lg">
          <Image
            src={image.url}
            alt={image.alt || `${produceName} image ${index + 1}`}
            fill
            className="object-cover"
            quality={85}
          />
        </div>
      ))}
    </div>
  )
}
