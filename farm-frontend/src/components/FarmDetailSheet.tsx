'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { X, Phone, MapPin, Clock, Share2, Heart, ExternalLink, Navigation } from 'lucide-react'
import Image from 'next/image'
import { FarmShop } from '@/types/farm'
import { hapticFeedback } from '@/lib/haptics'
import { createSwipeToClose } from '@/lib/gestures'
import { cleanDescription } from '@/lib/seo-utils'

interface FarmDetailSheetProps {
  farm: FarmShop | null
  isOpen: boolean
  onClose: () => void
  userLocation?: { lat: number; lng: number } | null
  allFarms?: FarmShop[] | null
}

// Check if image is a placeholder (Unsplash or generic)
const isPlaceholderImage = (imageUrl: string): boolean => {
  return imageUrl.includes('unsplash.com') || 
         imageUrl.includes('picsum.photos') ||
         imageUrl.includes('placeholder') ||
         imageUrl.includes('demo')
}

// Get real farm images only
const getRealFarmImages = (images: string[] | undefined): string[] => {
  if (!images || images.length === 0) return []
  return images.filter(img => !isPlaceholderImage(img))
}

export const FarmDetailSheet: React.FC<FarmDetailSheetProps> = ({
  farm,
  isOpen,
  onClose,
  userLocation,
  allFarms
}) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Get real farm images only
  const realImages = useMemo(() => getRealFarmImages(farm?.images), [farm?.images])
  const hasRealImages = realImages.length > 0

  // Coordinate validation
  const isValidCoord = (n: number) => Number.isFinite(n)
    && Math.abs(n) <= (n === farm?.location?.lat ? 90 : 180)

  const hasValidCoords = !!farm?.location
    && isValidCoord(farm.location.lat)
    && isValidCoord(farm.location.lng)

  // Calculate distance if user location is available (in kilometers)
  const distance = userLocation && hasValidCoords
            ? Math.round(haversineKm(userLocation.lat, userLocation.lng, farm!.location.lat, farm!.location.lng))
    : null

  // Find nearby farms (within 5 km)
  const nearbyFarms = useMemo(() => {
    if (!farm || !allFarms || !farm.location) return []
    
    return allFarms
      .filter(otherFarm => otherFarm.id !== farm.id && otherFarm.location)
      .map(otherFarm => ({
        ...otherFarm,
        distance: haversineKm(
          farm.location.lat, farm.location.lng,
          otherFarm.location.lat, otherFarm.location.lng
        )
      }))
      .filter(f => f.distance <= 5)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3) // Show top 3 nearby farms
  }, [farm, allFarms])

  // Get seasonal highlights based on current month
  const seasonalHighlights = useMemo(() => {
    if (!farm) return []
    
    const currentMonth = new Date().getMonth() + 1 // 1-12
    const highlights = []
    
    // Spring (March-May)
    if (currentMonth >= 3 && currentMonth <= 5) {
      highlights.push('🌱 Spring planting season')
      highlights.push('🌸 Cherry blossoms and flowers')
    }
    // Summer (June-August)
    else if (currentMonth >= 6 && currentMonth <= 8) {
      highlights.push('☀️ Peak growing season')
      highlights.push('🍓 Fresh berries available')
    }
    // Autumn (September-November)
    else if (currentMonth >= 9 && currentMonth <= 11) {
      highlights.push('🍎 Apple picking season')
      highlights.push('🎃 Pumpkin patches open')
    }
    // Winter (December-February)
    else {
      highlights.push('❄️ Winter farm activities')
      highlights.push('🕯️ Holiday farm events')
    }
    
    return highlights
  }, [farm])

  // Lock background scroll when dialog is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  // Safe external action handlers
  const safeHttpUrl = (raw?: string) => {
    if (!raw) return null
    try {
      const u = new URL(raw, window.location.origin)
      if (!/^https?:$/.test(u.protocol)) return null
      return u.toString()
    } catch { return null }
  }

  const buildDirectionsUrl = () => {
    if (!hasValidCoords) return null
    const { location } = farm!
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${location.lat},${location.lng}`)}`
  }

  const handleDirections = () => {
    hapticFeedback.buttonPress()
    const u = buildDirectionsUrl()
    if (u) window.open(u, '_blank', 'noopener,noreferrer')
  }

  const handleCall = () => {
    const tel = farm?.contact?.phone?.replace(/[^\d+]/g, '') // keep digits and leading +
    if (!tel) return
    hapticFeedback.buttonPress()
    window.location.href = `tel:${tel}`
  }

  const handleShare = async () => {
    hapticFeedback.buttonPress()
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const data = { title: farm?.name ?? 'Farm shop', text: farm?.name ?? '', url }
    try {
      if (navigator.share) await navigator.share(data)
      else if (navigator.clipboard) await navigator.clipboard.writeText(url)
    } catch { /* no-op */ }
  }

  // Haversine formula for accurate distance calculation
  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (d: number) => (d * Math.PI) / 180
    const R = 6371 // Earth radius in kilometers
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      hapticFeedback.buttonPress()
      onClose()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        hapticFeedback.buttonPress()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Setup swipe-to-close gesture
  // Gesture handling with drag state
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      const recognizer = createSwipeToClose(
        sheetRef.current,
        () => {
          hapticFeedback.buttonPress()
          onClose()
        },
        {
          onDragStart: () => setIsDragging(true),
          onDragEnd: () => setIsDragging(false)
        }
      )
      return () => {
        recognizer.stop()
      }
    }
  }, [isOpen, onClose])

  // Reset image loaded state when farm changes
  useEffect(() => {
    setImageLoaded(false)
  }, [farm?.id])

  if (!farm) return null

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className={`fixed inset-0 bg-black/40 backdrop-blur-md z-40 transition-all duration-500 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Bottom Sheet - Proper Dialog */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="farm-sheet-title"
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-500 ease-out motion-reduce:transition-none ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${isDragging ? 'transition-none' : ''}`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-white/60 backdrop-blur-sm rounded-full" />
        </div>

        {/* Content */}
        <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-white/20 max-h-[85vh] overflow-hidden">
                      {/* Hero Section - More Compact */}
            <div className="relative">
              {hasRealImages ? (
                <div className="relative h-48 overflow-hidden">
                <Image
                  src={realImages[0]}
                  alt={`${farm.name} hero image`}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className={`object-cover transition-opacity duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                {/* Loading state */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 animate-pulse" />
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
                          ) : (
                <div className="h-32 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">{farm.name}</p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                hapticFeedback.buttonPress()
                onClose()
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/30 transition-all"
              aria-label="Close farm details"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Farm Name Overlay - More Compact */}
            <div className="absolute bottom-3 left-4 right-4">
              <h1 id="farm-sheet-title" className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{farm.name}</h1>
              <div className="flex items-center gap-3 text-white/90">
                {distance != null && (
                  <span className="text-sm bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    {distance} km away
                  </span>
                )}
                {farm.verified && (
                  <span className="text-sm bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="text-green-300">✓</span> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Quick Actions - More Compact with Safe Handlers */}
            <div className="flex gap-2">
              {hasValidCoords && (
                <button 
                  onClick={handleDirections}
                  className="flex-1 bg-brand-primary text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all motion-reduce:transition-none active:scale-95 motion-reduce:active:scale-100 text-sm"
                >
                  <Navigation className="w-4 h-4" />
                  Directions
                </button>
              )}
              {farm.contact?.phone && (
                <button 
                  onClick={handleCall}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all motion-reduce:transition-none active:scale-95 motion-reduce:active:scale-100 text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
              )}
                                  <button 
            onClick={handleShare}
            aria-label="Share farm"
            className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all motion-reduce:transition-none active:scale-95 motion-reduce:active:scale-100"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            aria-label="Save farm"
            className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all motion-reduce:transition-none active:scale-95 motion-reduce:active:scale-100"
          >
            <Heart className="w-5 h-5 text-gray-600" />
          </button>
            </div>

            {/* Location - More Compact */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-primary" />
                Location
              </h2>
                        <div className="bg-gray-50 rounded-xl p-3">
            {farm.location.address && <p className="text-gray-900 font-medium">{farm.location.address}</p>}
            {(farm.location.city || farm.location.county) && (
              <p className="text-gray-600">{[farm.location.city, farm.location.county].filter(Boolean).join(', ')}</p>
            )}
            {farm.location.postcode && <p className="text-gray-500 font-mono">{farm.location.postcode}</p>}
          </div>
            </div>

            {/* Hours - More Compact */}
            {farm.hours && farm.hours.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  Opening Hours
                </h2>
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  {farm.hours.map((hour, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="capitalize font-medium text-gray-900">{hour.day}</span>
                      <span className="text-gray-600 font-mono">{hour.open} - {hour.close}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offerings - More Compact */}
            {farm.offerings && farm.offerings.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">What&apos;s Available</h2>
                <div className="flex flex-wrap gap-1.5">
                  {farm.offerings.map((offering, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold"
                    >
                      {offering}
                    </span>
                  ))}
                </div>
              </div>
            )}

                    {/* Description - More Compact */}
        {farm.description && cleanDescription(farm.description) && (
              <div className="space-y-2">
                <h2 className="text-lg font-heading font-bold text-text-heading">About</h2>
                <div className="bg-background-surface rounded-xl p-4 shadow-premium border border-border-default">
                  <div className="prose prose-sm prose-gray max-w-none">
                    {/* Split description into paragraphs for better readability */}
                    {cleanDescription(farm.description).split('\n\n').map((paragraph, index) => (
                      <p 
                        key={index}
                        className={`text-text-muted leading-relaxed ${
                          index === 0 
                            ? 'text-base font-medium text-text-heading mb-4' 
                            : 'text-sm mb-3'
                        }`}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  
                  {/* Professional call-to-action */}
                  <div className="mt-4 pt-4 border-t border-border-default">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-serum rounded-full animate-pulse" />
                      <p className="text-xs font-medium text-text-muted italic">
                        Visit us to experience authentic local produce.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seasonal Highlights - More Compact */}
            {seasonalHighlights.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">Seasonal Highlights</h2>
                <div className="flex flex-wrap gap-1.5">
                  {seasonalHighlights.map((highlight, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Website - Safe Links */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">Contact</h2>
              <div className="space-y-3">
                {farm.contact?.phone && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <Phone className="w-5 h-5 text-brand-primary" />
                    <span className="text-gray-900 font-medium">{farm.contact.phone}</span>
                  </div>
                )}
                {farm.contact?.website && (() => {
                  const safe = typeof window === 'undefined' ? farm.contact!.website : safeHttpUrl(farm.contact!.website)
                  if (safe) {
                    return (
                      <a 
                        href={safe} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors motion-reduce:transition-none"
                      >
                        <ExternalLink className="w-5 h-5 text-brand-primary" />
                        <span className="text-gray-900 font-medium">Visit Website</span>
                      </a>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            {/* Nearby Farms */}
            {nearbyFarms.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Nearby Farms</h2>
                <div className="space-y-3">
                  {nearbyFarms.map((nearbyFarm) => (
                    <div key={nearbyFarm.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{nearbyFarm.name}</h3>
                        <p className="text-sm text-gray-600">{nearbyFarm.location.county}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {nearbyFarm.distance.toFixed(1)} km
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Safe Area */}
          <div className="h-8" />
        </div>
      </div>
    </>
  )
}
1