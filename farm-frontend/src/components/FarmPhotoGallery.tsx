'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play, Heart, Share2 } from 'lucide-react'
import { ApprovedPhoto } from '@/lib/photos'

interface FarmPhotoGalleryProps {
  photos: ApprovedPhoto[]
  aspect?: string
  autoPlayMs?: number
}

export default function FarmPhotoGallery({ 
  photos, 
  aspect = "16/9", 
  autoPlayMs = 5000 
}: FarmPhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || isHovered || photos.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length)
    }, autoPlayMs)

    return () => clearInterval(interval)
  }, [isPlaying, isHovered, photos.length, autoPlayMs])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      } else if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }, [photos.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }, [photos.length])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  if (!photos.length) {
    return null
  }

  const currentPhoto = photos[currentIndex]

  return (
    <div 
      className="relative w-full bg-gradient-to-br from-background-canvas to-background-surface rounded-3xl overflow-hidden shadow-2xl border border-border-default/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Farm photo gallery"
    >
      {/* Enhanced Main Image Container */}
      <div 
        className="relative w-full"
        style={{ aspectRatio: aspect }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-background-canvas to-background-surface flex items-center justify-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-serum border-t-transparent rounded-full animate-spin" />
              <span className="text-text-muted font-medium">Loading photo...</span>
            </div>
          </div>
        )}

        <Image
          src={currentPhoto.url}
          alt={currentPhoto.caption || `Farm photo by ${currentPhoto.authorName || 'visitor'}`}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          priority={currentIndex === 0}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
        
        {/* Enhanced Overlay with caption and author */}
        {(currentPhoto.caption || currentPhoto.authorName) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {currentPhoto.caption && (
                  <p className="text-white text-lg font-semibold mb-2 leading-tight">
                    {currentPhoto.caption}
                  </p>
                )}
                {currentPhoto.authorName && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-serum rounded-full" />
                    <p className="text-white/90 text-sm font-medium">
                      Shared by {currentPhoto.authorName}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300 backdrop-blur-sm">
                  <Heart className="w-4 h-4 text-white" />
                </button>
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300 backdrop-blur-sm">
                  <Share2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background-surface/90 hover:bg-background-surface text-text-heading p-3 rounded-full shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-serum focus:ring-offset-2 backdrop-blur-sm border border-border-default/30 hover:border-serum/50 transform hover:scale-110"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background-surface/90 hover:bg-background-surface text-text-heading p-3 rounded-full shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-serum focus:ring-offset-2 backdrop-blur-sm border border-border-default/30 hover:border-serum/50 transform hover:scale-110"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Enhanced Play/Pause Button */}
      {photos.length > 1 && (
        <button
          onClick={togglePlay}
          className="absolute top-6 right-6 bg-background-surface/90 hover:bg-background-surface text-text-heading p-3 rounded-full shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-serum focus:ring-offset-2 backdrop-blur-sm border border-border-default/30 hover:border-serum/50 transform hover:scale-110"
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Enhanced Dots Indicator */}
      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transform hover:scale-125 ${
                index === currentIndex 
                  ? 'bg-serum shadow-lg scale-125' 
                  : 'bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Go to photo ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {/* Enhanced Photo Counter */}
      {photos.length > 1 && (
        <div className="absolute top-6 left-6 bg-background-surface/90 backdrop-blur-sm text-text-heading px-4 py-2 rounded-full text-sm font-semibold border border-border-default/30">
          {currentIndex + 1} of {photos.length}
        </div>
      )}

      {/* Progress Bar */}
      {photos.length > 1 && isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className="h-full bg-gradient-to-r from-serum to-teal-500 transition-all duration-300 ease-linear"
            style={{ 
              width: `${((currentIndex + 1) / photos.length) * 100}%` 
            }}
          />
        </div>
      )}
    </div>
  )
}
