'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface HeroVideoBackgroundProps {
  videoSrc?: string
  videoPoster?: string
  imageSrc: string
  imageAlt: string
  className?: string
  overlayClassName?: string
  children?: React.ReactNode
}

/**
 * Hero Video Background component.
 * Displays a looping video background with image fallback.
 * Respects prefers-reduced-motion for accessibility.
 */
export function HeroVideoBackground({
  videoSrc,
  videoPoster,
  imageSrc,
  imageAlt,
  className = '',
  overlayClassName = '',
  children,
}: HeroVideoBackgroundProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [hasVideoError, setHasVideoError] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
      if (e.matches && videoRef.current) {
        videoRef.current.pause()
      } else if (!e.matches && videoRef.current) {
        videoRef.current.play().catch(() => {})
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const shouldShowVideo = videoSrc && !hasVideoError && !prefersReducedMotion

  const handleVideoLoad = () => {
    setIsVideoLoaded(true)
  }

  const handleVideoError = () => {
    setHasVideoError(true)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Image background (always present as fallback) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          shouldShowVideo && isVideoLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={85}
        />
      </div>

      {/* Video background (conditionally rendered) */}
      {shouldShowVideo && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          muted
          loop
          playsInline
          poster={videoPoster}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Overlay gradients */}
      <div className={`absolute inset-0 ${overlayClassName}`}>
        {/* Default overlay if none provided */}
        {!overlayClassName && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          </>
        )}
      </div>

      {/* Content */}
      {children && (
        <div className="relative z-10 h-full">
          {children}
        </div>
      )}

      {/* Reduced motion indicator (for debugging, can be removed in production) */}
      {process.env.NODE_ENV === 'development' && prefersReducedMotion && (
        <div className="absolute top-4 right-4 z-20 bg-amber-500/80 text-black text-small px-2 py-1 rounded">
          Reduced motion: video paused
        </div>
      )}
    </div>
  )
}

/**
 * Video preload link component for performance.
 * Add this to your layout head for optimal video loading.
 */
export function VideoPreloadLink({ videoSrc }: { videoSrc: string }) {
  return (
    <link
      rel="preload"
      as="video"
      href={videoSrc}
      type="video/mp4"
    />
  )
}

/**
 * Example usage:
 *
 * <HeroVideoBackground
 *   videoSrc="/videos/farm-hero.mp4"
 *   videoPoster="/images/farm-hero-poster.jpg"
 *   imageSrc="/main_header.jpg"
 *   imageAlt="Fresh produce at a UK farm shop"
 *   className="h-screen"
 * >
 *   <div className="flex items-center justify-center h-full">
 *     <h1>Welcome to Farm Companion</h1>
 *   </div>
 * </HeroVideoBackground>
 */
