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
  const [isMobile, setIsMobile] = useState(true) // Default to true for SSR (show image first)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Check for mobile viewport (skip video on mobile to save bandwidth)
    const mobileQuery = window.matchMedia('(max-width: 768px)')
    setIsMobile(mobileQuery.matches)

    const handleMobileChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    mobileQuery.addEventListener('change', handleMobileChange)

    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(motionQuery.matches)

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
      if (e.matches && videoRef.current) {
        videoRef.current.pause()
      } else if (!e.matches && videoRef.current) {
        videoRef.current.play().catch(() => {})
      }
    }

    motionQuery.addEventListener('change', handleMotionChange)
    return () => {
      mobileQuery.removeEventListener('change', handleMobileChange)
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Show video only on desktop, when video is available, no errors, and motion is allowed
  const shouldShowVideo = videoSrc && !hasVideoError && !prefersReducedMotion && !isMobile

  const handleVideoLoad = () => {
    setIsVideoLoaded(true)
  }

  const handleVideoError = () => {
    setHasVideoError(true)
  }

  return (
    <div className={`absolute inset-0 h-full w-full overflow-hidden ${className ?? ""}`}>
      {/* Image background - wrapper needed for next/image fill to work */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          shouldShowVideo && isVideoLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          style={{ objectPosition: 'center 70%' }}
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={60}
        />
      </div>

      {/* Video background (conditionally rendered) */}
      {shouldShowVideo && (
        <video
          ref={videoRef}
          className={`absolute transition-opacity duration-700 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'cover',
            objectPosition: 'center 70%',
          }}
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

      {/* Content */}
      {children && (
        <div className="relative z-10 h-full">
          {children}
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
