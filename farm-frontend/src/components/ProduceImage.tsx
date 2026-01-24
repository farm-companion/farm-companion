'use client'

import Image from 'next/image'
import { 
  getOptimizedImageUrl, 
  getImagePriority, 
  getImageSizes,
  type ImageSource 
} from '@/lib/image-utils'

interface ProduceImageProps {
  image: ImageSource
  produceName: string
  index: number
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  alt?: string
}

export default function ProduceImage({
  image,
  produceName,
  index,
  className = '',
  sizes,
  priority,
  fill = false,
  width,
  height,
  alt
}: ProduceImageProps) {
  // Use optimized URL
  const optimizedSrc = getOptimizedImageUrl(image.src)
  
  // Use provided alt or fallback to image alt
  const displayAlt = alt || image.alt || `${produceName} image`
  
  // Determine priority (hero images get priority)
  const displayPriority = priority ?? getImagePriority(index)
  
  // Determine sizes
  const displaySizes = sizes ?? getImageSizes()

  // Render the image
  return (
    <Image
      src={optimizedSrc}
      alt={displayAlt}
      className={className}
      sizes={displaySizes}
      priority={displayPriority}
      fill={fill}
      width={width}
      height={height}
      quality={85}
    />
  )
}

// Gallery component for multiple images
interface ProduceGalleryProps {
  images: ImageSource[]
  produceName: string
  className?: string
}

export function ProduceGallery({ images, produceName, className = '' }: ProduceGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        <div className="aspect-video bg-background-surface border border-border-default rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-background-canvas rounded-full mx-auto mb-2 flex items-center justify-center border border-border-default">
              <span className="text-xl">🌱</span>
            </div>
            <p className="text-caption text-text-muted font-medium">{produceName}</p>
            <p className="text-captionall text-text-muted mt-1">No images available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className="aspect-video relative overflow-hidden rounded-lg">
          <ProduceImage
            image={image}
            produceName={produceName}
            index={index}
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  )
}
