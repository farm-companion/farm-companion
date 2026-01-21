'use client'

import Image from 'next/image'
import { HeroImage as HeroImageType } from '@/lib/images'
import { cn } from '@/lib/utils'

interface HeroImageProps {
  image: HeroImageType
  overlay?: 'dark' | 'light' | 'gradient' | 'none'
  className?: string
  children?: React.ReactNode
}

/**
 * God-Tier Hero Image Component
 *
 * Features:
 * - Blur placeholder for instant perceived load (Apple-style)
 * - Automatic format negotiation (AVIF → WebP → JPG)
 * - Responsive sizing hints for optimal bandwidth
 * - Priority loading for above-the-fold images
 * - Consistent overlay patterns for text readability
 * - Accessibility optimized with proper alt text
 * - Zero layout shift (fills parent container)
 *
 * Usage:
 * ```tsx
 * import { HeroImage } from '@/components/HeroImage'
 * import { HERO_IMAGES } from '@/lib/images'
 *
 * <section className="relative h-[60vh]">
 *   <HeroImage
 *     image={HERO_IMAGES.homepage}
 *     overlay="gradient"
 *   />
 *   <div className="relative z-10">
 *     {/* Content here *\/}
 *   </div>
 * </section>
 * ```
 */
export function HeroImage({
  image,
  overlay = 'dark',
  className,
  children
}: HeroImageProps) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Hero Image with Next.js Optimization */}
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={image.priority}
        placeholder="blur"
        blurDataURL={image.blurDataURL}
        sizes={image.sizes}
        quality={85}
        className="object-cover object-center"
      />

      {/* Overlay for text readability */}
      {overlay === 'dark' && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"
          aria-hidden="true"
        />
      )}

      {overlay === 'light' && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/50"
          aria-hidden="true"
        />
      )}

      {overlay === 'gradient' && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60"
          aria-hidden="true"
        />
      )}

      {/* Optional children (for advanced compositions) */}
      {children}
    </div>
  )
}

/**
 * Compact hero variant for smaller sections
 */
export function CompactHeroImage({
  image,
  overlay = 'gradient',
  className
}: Omit<HeroImageProps, 'children'>) {
  return (
    <div className={cn('relative h-48 md:h-64 overflow-hidden rounded-lg', className)}>
      <HeroImage image={image} overlay={overlay} />
    </div>
  )
}
