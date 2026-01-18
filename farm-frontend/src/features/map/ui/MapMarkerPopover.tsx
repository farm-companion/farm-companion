'use client'

import { useEffect } from 'react'
import { MapPin, Navigation, Share2, Heart, X } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'

interface MapMarkerPopoverProps {
  farm: FarmShop | null
  isVisible: boolean
  onClose: () => void
  onNavigate: (farm: FarmShop) => void
  onFavorite: (farmId: string) => void
  onShare: (farm: FarmShop) => void
  userLocation: { latitude: number; longitude: number } | null
  position: { x: number; y: number }
}

export default function MapMarkerPopover({
  farm,
  isVisible,
  onClose,
  onNavigate,
  onFavorite,
  onShare,
  userLocation,
  position
}: MapMarkerPopoverProps) {
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
      {/* Backdrop - Transparent for desktop */}
      <div
        className="fixed inset-0 z-40 pointer-events-auto"
        onClick={onClose}
        style={{ background: 'transparent' }}
      />

      {/* Popover - Premium glassmorphism */}
      <div
        className="fixed z-50 pointer-events-auto bg-white/98 dark:bg-neutral-900/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200/50 dark:border-neutral-700/50 w-80 overflow-hidden animate-fade-in-scale"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, calc(-100% - 20px))',
          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0"
          style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid rgba(255, 255, 255, 0.98)'
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
        </button>

        {/* Content */}
        <div className="p-4">
          {/* Farm name */}
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1 pr-8">
            {farm.name}
          </h3>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-3">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-primary" />
            <span>{farm.location.city || farm.location.address}</span>
          </div>

          {/* Distance badge */}
          {distance && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium mb-4">
              {distance} away
            </div>
          )}

          {/* Actions - Premium buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate(farm)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white rounded-xl shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-150 text-sm font-medium"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </button>

            <button
              onClick={() => onFavorite(farm.id)}
              className="flex items-center justify-center p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-red-200 dark:hover:border-red-800 hover:text-red-500 transition-all duration-150"
            >
              <Heart className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </button>

            <button
              onClick={() => onShare(farm)}
              className="flex items-center justify-center p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-brand-primary/30 transition-all duration-150"
            >
              <Share2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
