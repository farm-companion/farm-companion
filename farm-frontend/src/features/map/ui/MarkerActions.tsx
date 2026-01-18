'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Phone, Globe, Clock, Navigation, Share2, Heart } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'

interface MarkerActionsProps {
  farm: FarmShop | null
  isVisible: boolean
  onClose: () => void
  onNavigate: (farm: FarmShop) => void
  onFavorite: (farmId: string) => void
  onShare: (farm: FarmShop) => void
  userLocation: { latitude: number; longitude: number } | null
  isDesktop?: boolean
}

export default function MarkerActions({
  farm,
  isVisible,
  onClose,
  onNavigate,
  onFavorite,
  onShare,
  userLocation,
  isDesktop = false
}: MarkerActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-expand after a short delay for better UX
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsExpanded(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsExpanded(false)
    }
  }, [isVisible])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose()
      }
    }
    
    if (isVisible) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  // Calculate distance if user location available
  const getDistance = () => {
    if (!userLocation || !farm?.location) return null

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      farm.location.lat,
      farm.location.lng
    )

    return formatDistance(distance)
  }

  if (!farm || !isVisible) {
    return null
  }

  const distance = getDistance()

  return (
    <>
      {/* Backdrop - Premium blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Marker Actions Sheet - Premium glassmorphism */}
      <div
        ref={containerRef}
        className={`fixed z-50 transform transition-all duration-300 ease-out ${
          isDesktop
            ? 'right-4 top-4 w-80 rounded-2xl bg-white/98 dark:bg-neutral-900/98 backdrop-blur-xl shadow-2xl border border-neutral-200/50 dark:border-neutral-700/50'
            : `bottom-0 left-0 right-0 fc-sheet-content ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`
        }`}
        style={{
          maxHeight: isDesktop ? '70vh' : '80vh',
          minHeight: isDesktop ? 'auto' : '200px'
        }}
      >
        {/* Drag Handle - Mobile Only */}
        {!isDesktop && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="fc-sheet-grip" />
          </div>
        )}

        {/* Farm Header - Premium styling */}
        <div className={`px-6 ${isDesktop ? 'pt-4' : ''} pb-4 border-b border-neutral-100 dark:border-neutral-800`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                {farm.name}
              </h3>
              <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0 text-brand-primary" />
                <span className="truncate">
                  {farm.location.address}, {farm.location.city}
                </span>
              </div>
              {distance && (
                <span className="inline-flex items-center text-xs font-medium text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">
                  {distance} away
                </span>
              )}
            </div>

            {/* Favorite Button */}
            <button
              onClick={() => onFavorite(farm.id)}
              className="p-2.5 text-neutral-400 dark:text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-150"
              aria-label="Add to favorites"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions - Premium buttons */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Navigate */}
            <button
              onClick={() => onNavigate(farm)}
              className="flex items-center justify-center p-3.5 bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white rounded-xl font-medium shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-150"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Navigate
            </button>

            {/* Share */}
            <button
              onClick={() => onShare(farm)}
              className="flex items-center justify-center p-3.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-xl font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </button>
          </div>

          {/* Farm Details */}
          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700/50">
            {/* Contact Info */}
            {farm.contact?.phone && (
              <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-300">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mr-3">
                  <Phone className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                </div>
                <span>{farm.contact.phone}</span>
              </div>
            )}

            {/* Website */}
            {farm.contact?.website && (
              <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-300">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mr-3">
                  <Globe className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                </div>
                <a
                  href={farm.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary hover:underline font-medium"
                >
                  Visit website
                </a>
              </div>
            )}

            {/* Hours */}
            {farm.hours && farm.hours.length > 0 && (
              <div className="flex items-start text-sm text-neutral-600 dark:text-neutral-300">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mr-3 mt-0.5">
                  <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                </div>
                <div>
                  <div className="font-medium mb-1 text-neutral-900 dark:text-white">Opening Hours</div>
                  {farm.hours.map((hour, index) => (
                    <div key={index} className="text-xs text-neutral-500 dark:text-neutral-400">
                      {hour.day}: {hour.open === '24 hours' ? '24 hours' : `${hour.open} - ${hour.close}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}
