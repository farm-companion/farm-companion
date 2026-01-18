'use client'

import { useEffect, useMemo } from 'react'
import { MapPin, Navigation, Share2, Heart, X, Leaf } from 'lucide-react'
import type { FarmShop, FarmProduce } from '@/types/farm'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'

/**
 * Check if produce is currently in season
 * Handles wrap-around seasons (e.g., Nov-Apr for kale)
 */
function isInSeason(produce: FarmProduce, month: number): boolean {
  if (produce.seasonStart <= produce.seasonEnd) {
    return month >= produce.seasonStart && month <= produce.seasonEnd
  }
  // Wrap-around season (e.g., Nov-Apr)
  return month >= produce.seasonStart || month <= produce.seasonEnd
}

interface MapMarkerPopoverProps {
  farm: FarmShop | null
  isVisible: boolean
  onClose: () => void
  onNavigate: (farm: FarmShop) => void
  onFavorite: (farmId: string) => void
  onShare: (farm: FarmShop) => void
  userLocation: { latitude: number; longitude: number } | null
  position: { x: number; y: number }
  selectedProduce?: string // Produce slug being filtered
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
  selectedProduce
}: MapMarkerPopoverProps) {
  // Check if farm has the selected produce in season
  const seasonalBadge = useMemo(() => {
    if (!selectedProduce || !farm?.produce?.length) return null

    const currentMonth = new Date().getMonth() + 1
    const matchingProduce = farm.produce.find(p => p.slug === selectedProduce)

    if (matchingProduce && isInSeason(matchingProduce, currentMonth)) {
      return {
        name: matchingProduce.name,
        icon: matchingProduce.icon,
        isPYO: matchingProduce.isPYO
      }
    }
    return null
  }, [selectedProduce, farm?.produce])

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

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Distance badge */}
            {distance && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium">
                {distance} away
              </div>
            )}

            {/* In season badge */}
            {seasonalBadge && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                <Leaf className="w-3 h-3" />
                {seasonalBadge.icon && <span>{seasonalBadge.icon}</span>}
                {seasonalBadge.name} in season
                {seasonalBadge.isPYO && <span className="ml-1 text-green-600 dark:text-green-300">(PYO)</span>}
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
