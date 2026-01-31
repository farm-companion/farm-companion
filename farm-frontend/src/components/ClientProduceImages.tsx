'use client'

import { useState, useEffect, useCallback } from 'react'
import ProduceImage, { ProduceGallery } from '@/components/ProduceImage'
import ApiProduceImage, { ApiProduceGallery } from '@/components/ApiProduceImage'
import { Button } from '@/components/ui/Button'
import { Camera, Image as ImageIcon } from 'lucide-react'
import { getProduceImages } from '@/lib/produce-integration'

interface ClientProduceImagesProps {
  produceSlug: string
  produceName: string
  staticImages: any[]
  month?: number
  showToggle?: boolean
  className?: string
  maxImages?: number
  fallbackToAnyMonth?: boolean // New prop to allow fallback to any month
}

export default function ClientProduceImages({
  produceSlug,
  produceName,
  staticImages,
  month,
  showToggle = false, // Changed default to false
  className = '',
  maxImages = 6,
  fallbackToAnyMonth = true // Default to true for better UX
}: ClientProduceImagesProps) {
  const [useApiImages, setUseApiImages] = useState(true)
  const [effectiveMonth, setEffectiveMonth] = useState(month)

  const checkAndSetEffectiveMonth = useCallback(async () => {
    try {
      // First try the current month
      const currentMonthImages = await getProduceImages(produceSlug, month)
      
      if (currentMonthImages.length > 0) {
        setEffectiveMonth(month)
        return
      }
      
      // If no images for current month, try other months (1-12)
      for (let testMonth = 1; testMonth <= 12; testMonth++) {
        if (testMonth === month) continue // Skip current month as we already checked it
        
        const testImages = await getProduceImages(produceSlug, testMonth)
        if (testImages.length > 0) {
          console.log(`Found ${testImages.length} images for ${produceSlug} in month ${testMonth}, using those instead of month ${month}`)
          setEffectiveMonth(testMonth)
          return
        }
      }
      
      // If no images found in any month, use the original month
      setEffectiveMonth(month)
    } catch (error) {
      console.error('Error checking for fallback images:', error)
      setEffectiveMonth(month)
    }
  }, [produceSlug, month])

  // Check if we have images for the current month, if not, try other months
  useEffect(() => {
    if (fallbackToAnyMonth && month) {
      checkAndSetEffectiveMonth()
    }
  }, [month, fallbackToAnyMonth, checkAndSetEffectiveMonth])

  // Always show API images by default, only show toggle if explicitly requested
  const displayApiImages = showToggle ? useApiImages : true

  return (
    <div className={className}>
      {/* Toggle between API and static images - only if showToggle is true */}
      {showToggle && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-background-surface rounded-lg border border-border-default">
          <Button
            variant={displayApiImages ? "primary" : "secondary"}
            size="sm"
            onClick={() => setUseApiImages(true)}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Uploaded Images
          </Button>
          <Button
            variant={!displayApiImages ? "primary" : "secondary"}
            size="sm"
            onClick={() => setUseApiImages(false)}
            className="flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Stock Images
          </Button>
        </div>
      )}

      {/* Display images - use static images from produce data */}
      {staticImages && staticImages.length > 0 ? (
        <ProduceGallery
          images={staticImages.slice(0, maxImages)}
          produceName={produceName}
        />
      ) : displayApiImages ? (
        <ApiProduceGallery
          produceSlug={produceSlug}
          produceName={produceName}
          month={effectiveMonth}
          maxImages={maxImages}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="aspect-video bg-background-surface border border-border-default rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-background-canvas rounded-full mx-auto mb-2 flex items-center justify-center border border-border-default">
                <span className="text-xl">🌱</span>
              </div>
              <p className="text-caption text-text-muted font-medium">{produceName}</p>
              <p className="text-small text-text-muted mt-1">No images available</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Single image component
interface ClientProduceImageProps {
  produceSlug: string
  produceName: string
  staticImage: any
  month?: number
  showToggle?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  alt?: string
  fallbackToAnyMonth?: boolean
}

export function ClientProduceImage({
  produceSlug,
  produceName,
  staticImage,
  month,
  showToggle = false, // Changed default to false
  className = '',
  sizes,
  priority = false,
  fill = false,
  width,
  height,
  alt,
  fallbackToAnyMonth = true
}: ClientProduceImageProps) {
  const [useApiImage, setUseApiImage] = useState(true)
  const [effectiveMonth, setEffectiveMonth] = useState(month)

  // Always show API image by default, only show toggle if explicitly requested
  const displayApiImage = showToggle ? useApiImage : true

  return (
    <div className={className}>
      {/* Toggle between API and static image - only if showToggle is true */}
      {showToggle && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-background-surface rounded-lg border border-border-default">
          <Button
            variant={displayApiImage ? "primary" : "secondary"}
            size="sm"
            onClick={() => setUseApiImage(true)}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Uploaded Image
          </Button>
          <Button
            variant={!displayApiImage ? "primary" : "secondary"}
            size="sm"
            onClick={() => setUseApiImage(false)}
            className="flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Stock Image
          </Button>
        </div>
      )}

      {/* Display image based on selection */}
      {displayApiImage ? (
        <ApiProduceImage
          produceSlug={produceSlug}
          produceName={produceName}
          month={effectiveMonth}
          sizes={sizes}
          priority={priority}
          fill={fill}
          width={width}
          height={height}
          alt={alt}
          fallbackImage={staticImage.src}
          isHero={true}
        />
      ) : (
        <ProduceImage
          image={staticImage}
          produceName={produceName}
          index={0}
          className=""
          sizes={sizes}
          priority={priority}
          fill={fill}
          width={width}
          height={height}
          alt={alt}
        />
      )}
    </div>
  )
}
