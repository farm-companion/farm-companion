'use client'

import { useState } from 'react'
import ProduceImage, { ProduceGallery } from '@/components/ProduceImage'
import ApiProduceImage, { ApiProduceGallery } from '@/components/ApiProduceImage'
import { Button } from '@/components/ui/Button'
import { Camera, Image as ImageIcon } from 'lucide-react'

interface ClientProduceImagesProps {
  produceSlug: string
  produceName: string
  staticImages: any[]
  month?: number
  showToggle?: boolean
  className?: string
  maxImages?: number
}

export default function ClientProduceImages({
  produceSlug,
  produceName,
  staticImages,
  month,
  showToggle = false, // Changed default to false
  className = '',
  maxImages = 6
}: ClientProduceImagesProps) {
  const [useApiImages, setUseApiImages] = useState(true)

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

      {/* Display images based on selection */}
      {displayApiImages ? (
        <ApiProduceGallery
          produceSlug={produceSlug}
          produceName={produceName}
          month={month}
          maxImages={maxImages}
        />
      ) : (
        <ProduceGallery
          images={staticImages}
          produceName={produceName}
        />
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
  alt
}: ClientProduceImageProps) {
  const [useApiImage, setUseApiImage] = useState(true)

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
          month={month}
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
