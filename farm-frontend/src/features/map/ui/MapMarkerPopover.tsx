'use client'

import { useEffect } from 'react'
import { MapPin, Navigation, Share2, Heart, X, Leaf } from 'lucide-react'
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
  searchQuery?: string
}

export default function MapMarkerPopover({
  farm,
  isVisible,
  onClose,
  onNavigate,
  onFavorite,
  onShare,
  userLocation,
  position,
  searchQuery
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 pointer-events-auto"
        onClick={onClose}
        style={{ background: 'transparent' }}
      />

      {/* Popover */}
      <div
        className="fixed z-50 pointer-events-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 w-80 overflow-hidden"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, calc(-100% - 20px))'
        }}
      >
        {/* Arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0"
          style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid white'
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>

        {/* Content */}
        <div className="p-4">
          {/* Farm name */}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 pr-6">
            {farm.name}
          </h3>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{farm.location.city || farm.location.address}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Distance badge */}
            {distance && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium">
                {distance} away
              </div>
            )}

            {/* In Season Now badge - shows when filtering by produce */}
            {searchQuery && farm?.offerings?.some(o => o.toLowerCase().includes(searchQuery.toLowerCase())) && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                <Leaf className="w-3 h-3" />
                In Season Now
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate(farm)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors text-sm font-medium"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </button>

            <button
              onClick={() => onFavorite(farm.id)}
              className="flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Heart className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>

            <button
              onClick={() => onShare(farm)}
              className="flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
