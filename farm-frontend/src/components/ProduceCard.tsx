'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getProduceImages } from '@/lib/produce-integration'

interface ProduceCardProps {
  produce: {
    slug: string
    name: string
    images: any[]
    monthsInSeason?: number[]
  }
  month: number
  className?: string
}

export default function ProduceCard({ produce, month, className = '' }: ProduceCardProps) {
  const [apiImages, setApiImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [useApiImage, setUseApiImage] = useState(true)

  useEffect(() => {
    async function fetchImages() {
      try {
        setIsLoading(true)
        const images = await getProduceImages(produce.slug, month)
        
        // Filter for hero images (image1 only)
        const heroImages = images.filter(image => {
          const filename = image.url.split('/').pop() || ''
          // Very flexible pattern to handle various naming conventions
          // Matches: produceSlug1.jpg, produceSlug-fresh1.jpg, produceSlug_1.jpg, etc.
          const pattern = new RegExp(`^${produce.slug}[^\\d]*(\\d+)\\.(jpg|jpeg|png|webp)$`, 'i')
          const match = filename.match(pattern)
          
          if (!match) return false
          
          const imageNumber = parseInt(match[1], 10)
          return imageNumber === 1
        })
        
        setApiImages(heroImages)
      } catch (err) {
        console.error('Error fetching API images:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [produce.slug, month])

  // Determine which image to show
  const hasApiImages = apiImages.length > 0
  const staticImage = produce.images[0]
  const apiImage = apiImages[0]
  
  // Use API image if available and preferred, otherwise fall back to static
  const displayImage = (useApiImage && hasApiImages) ? apiImage : staticImage
  const imageUrl = displayImage?.url || displayImage?.src
  const imageAlt = displayImage?.alt || `${produce.name} image`

  return (
    <Link
      href={`/seasonal/${produce.slug}`}
      className={`group block bg-background-canvas rounded-xl border border-border-default p-6 hover:shadow-premium animate-transform hover-lift ${className}`}
    >
      <div className="aspect-square bg-background-surface rounded-lg mb-4 overflow-hidden relative">
        {isLoading ? (
          <div className="w-full h-full bg-background-canvas animate-pulse" />
        ) : (
          <>
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover animate-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={80}
              loading="lazy"
            />
            {/* API Image Indicator */}
            {hasApiImages && useApiImage && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Live
              </div>
            )}
          </>
        )}
      </div>
      <h3 className="font-heading font-semibold text-text-heading mb-2 group-hover:text-serum transition-colors">
        {produce.name}
      </h3>
      <p className="text-sm text-text-muted">
        {produce.monthsInSeason?.includes(month) ? 'Peak season' : 'In season'}
      </p>
    </Link>
  )
}
