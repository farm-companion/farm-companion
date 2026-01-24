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
  const [effectiveMonth, setEffectiveMonth] = useState(month)

  useEffect(() => {
    async function fetchImages() {
      try {
        setIsLoading(true)
        
        // First try the current month
        let images = await getProduceImages(produce.slug, month)
        
        // If no images for current month, try other months (1-12)
        if (images.length === 0) {
          for (let testMonth = 1; testMonth <= 12; testMonth++) {
            if (testMonth === month) continue // Skip current month as we already checked it
            
            const testImages = await getProduceImages(produce.slug, testMonth)
            if (testImages.length > 0) {
              console.log(`Found ${testImages.length} images for ${produce.slug} in month ${testMonth}, using those instead of month ${month}`)
              images = testImages
              setEffectiveMonth(testMonth)
              break
            }
          }
        }
        
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
      className={`group block bg-background-surface border border-border-default/30 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-background-canvas flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-serum border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        )}
        
        {/* Month indicator if using fallback month */}
        {effectiveMonth !== month && hasApiImages && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-captionall px-2 py-1 rounded-full">
            Month {effectiveMonth}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-text-heading group-hover:text-serum transition-colors">
          {produce.name}
        </h3>
        
        {/* Season indicator */}
        {produce.monthsInSeason && (
          <p className="text-caption text-text-muted mt-1">
            {produce.monthsInSeason.length === 1 
              ? `In season: ${getMonthName(produce.monthsInSeason[0])}`
              : `In season: ${produce.monthsInSeason.map(getMonthName).join(', ')}`
            }
          </p>
        )}
      </div>
    </Link>
  )
}

// Helper function to get month name
function getMonthName(month: number): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  return monthNames[month - 1] || 'Unknown'
}
