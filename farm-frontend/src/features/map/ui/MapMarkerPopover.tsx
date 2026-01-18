'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Navigation, Share2, Heart, X, Star, CheckCircle, ExternalLink } from 'lucide-react'
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
          {/* Farm name - clickable to profile */}
          <Link
            href={`/shop/${farm.slug}`}
            className="block text-lg font-semibold text-slate-900 dark:text-white mb-1 pr-6 hover:text-serum transition-colors"
          >
            {farm.name}
          </Link>

          {/* Trust signals row */}
          <div className="flex items-center gap-2 mb-2">
            {farm.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
            {farm.rating && farm.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {farm.rating.toFixed(1)}
                {farm.user_ratings_total && farm.user_ratings_total > 0 && (
                  <span className="text-slate-500 dark:text-slate-400">
                    ({farm.user_ratings_total.toLocaleString()})
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{farm.location.city || farm.location.address}</span>
          </div>

          {/* Distance badge */}
          {distance && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-serum/10 text-serum rounded-full text-xs font-medium mb-4">
              {distance} away
            </div>
          )}

          {/* Primary Action - View Profile */}
          <Link
            href={`/shop/${farm.slug}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-serum text-black rounded-lg hover:bg-serum/90 transition-colors text-sm font-semibold mb-2"
          >
            View Full Profile
            <ExternalLink className="w-4 h-4" />
          </Link>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate(farm)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </button>

            <button
              onClick={() => onFavorite(farm.id)}
              className="flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Add to favorites"
            >
              <Heart className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>

            <button
              onClick={() => onShare(farm)}
              className="flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
