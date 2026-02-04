'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'

/**
 * Known-bad image URLs. These are Runware rate-limit placeholder images
 * that were accidentally stored to Vercel Blob during batch generation.
 * Maintain this list as images are regenerated. Remove entries once the
 * underlying blob has been replaced with a real produce image.
 */
const BLOCKED_URLS = new Set<string>([])

/**
 * Season-derived background colours for the CSS placeholder.
 * When no valid image is available, the card shows a gradient
 * with the produce name in white.
 */
const CATEGORY_GRADIENTS: Record<string, string> = {
  fruit: 'from-rose-700 to-rose-900',
  vegetable: 'from-emerald-700 to-emerald-900',
  herb: 'from-lime-700 to-lime-900',
  other: 'from-amber-700 to-amber-900',
}

function guessCategory(name: string): string {
  const fruits = ['strawberries', 'blackberries', 'apples', 'pumpkins', 'plums', 'raspberries', 'cherries', 'pears', 'rhubarb']
  const herbs = ['watercress', 'wild garlic']
  const lower = name.toLowerCase()
  if (fruits.some(f => lower.includes(f))) return 'fruit'
  if (herbs.some(h => lower.includes(h))) return 'herb'
  return 'vegetable'
}

interface ProduceImageProps {
  /** All available images for this produce item */
  images: { src: string; alt: string }[]
  /** Produce name, used for fallback display and alt text */
  name: string
  /** CSS height class or pixel value */
  height?: string
  /** Image sizes attribute for responsive loading */
  sizes?: string
  /** Whether to load with priority (above the fold) */
  priority?: boolean
  /** Additional classes for the container */
  className?: string
}

/**
 * Resilient produce image component.
 *
 * Defence layers:
 * 1. Blocklist check -- skip known Runware placeholder URLs
 * 2. Sequential fallback -- try each image in the array
 * 3. Load validation -- onLoad checks for suspect dimensions
 * 4. Styled placeholder -- gradient + name when all images fail
 *
 * This prevents the Runware "anonymous tier limit" placeholder
 * from ever appearing on the site.
 */
export function ProduceImage({
  images,
  name,
  height = 'h-[200px]',
  sizes = '(max-width: 768px) 100vw, 33vw',
  priority = false,
  className = '',
}: ProduceImageProps) {
  // Filter out blocked URLs up front
  const validImages = images.filter(img => !BLOCKED_URLS.has(img.src))

  const [imageIndex, setImageIndex] = useState(0)
  const [allFailed, setAllFailed] = useState(validImages.length === 0)
  const failCountRef = useRef(0)

  const handleError = useCallback(() => {
    const nextIndex = imageIndex + 1
    failCountRef.current += 1
    if (nextIndex < validImages.length) {
      setImageIndex(nextIndex)
    } else {
      setAllFailed(true)
    }
  }, [imageIndex, validImages.length])

  // onLoad: validate that the image has reasonable natural dimensions.
  // Runware placeholders are typically square or have unusual aspect ratios.
  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    // If the image is extremely small (< 10px) it is likely broken
    if (img.naturalWidth < 10 || img.naturalHeight < 10) {
      handleError()
    }
  }, [handleError])

  if (allFailed) {
    return <PlaceholderImage name={name} height={height} className={className} />
  }

  const current = validImages[imageIndex]

  return (
    <div className={`relative ${height} bg-[#F5F5F5] overflow-hidden ${className}`}>
      <Image
        src={current.src}
        alt={current.alt || `Fresh ${name}`}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        loading={priority ? undefined : 'lazy'}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  )
}

/**
 * Styled placeholder shown when no valid image is available.
 * Uses a category-appropriate gradient with the produce name.
 */
function PlaceholderImage({
  name,
  height,
  className = '',
}: {
  name: string
  height: string
  className?: string
}) {
  const category = guessCategory(name)
  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.vegetable

  return (
    <div
      className={`relative ${height} overflow-hidden flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
      role="img"
      aria-label={`${name} -- image unavailable`}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="leaf-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaf-pattern)" />
        </svg>
      </div>

      <div className="relative text-center px-4">
        <p className="text-white/90 text-lg font-medium drop-shadow-sm">
          {name}
        </p>
        <p className="text-white/50 text-xs mt-1">
          Image coming soon
        </p>
      </div>
    </div>
  )
}

/**
 * Check if a produce item has any valid (non-blocked) images.
 */
export function hasValidImage(images: { src: string }[]): boolean {
  return images.some(img => !BLOCKED_URLS.has(img.src))
}

/**
 * Get the first valid (non-blocked) image URL for a produce item.
 * Returns undefined if all images are blocked.
 */
export function getValidImageUrl(images: { src: string }[]): string | undefined {
  const valid = images.find(img => !BLOCKED_URLS.has(img.src))
  return valid?.src
}
