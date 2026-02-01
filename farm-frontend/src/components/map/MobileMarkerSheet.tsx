'use client'

import { useEffect, useCallback, useRef } from 'react'
import { MapPin, Navigation, Share2, Heart, Phone, Globe, Clock, ExternalLink, ChevronDown } from 'lucide-react'
import { FarmShop } from '@/types/farm'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'
import { isCurrentlyOpen, formatOpeningHours } from '@/lib/farm-status'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/Drawer'

// =============================================================================
// TYPES
// =============================================================================

export interface MobileMarkerSheetProps {
  /** Farm to display */
  farm: FarmShop | null
  /** Whether sheet is open */
  isOpen: boolean
  /** Callback when sheet closes */
  onClose: () => void
  /** Callback when navigate is clicked */
  onNavigate?: (farm: FarmShop) => void
  /** Callback when favorite is clicked */
  onFavorite?: (farmId: string) => void
  /** Callback when share is clicked */
  onShare?: (farm: FarmShop) => void
  /** Callback when view details is clicked */
  onViewDetails?: (farm: FarmShop) => void
  /** User's current location for distance calculation */
  userLocation?: { latitude: number; longitude: number } | null
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Mobile Marker Sheet
 *
 * A bottom sheet that displays farm details when a marker is tapped on mobile.
 * Uses the existing Drawer component with custom styling.
 *
 * Features:
 * - Swipe-to-dismiss gesture
 * - Farm status (open/closed)
 * - Distance from user
 * - Quick actions: navigate, favorite, share
 * - Contact info and opening hours
 * - Accessible with ARIA attributes
 *
 * @example
 * ```tsx
 * <MobileMarkerSheet
 *   farm={selectedFarm}
 *   isOpen={!!selectedFarm}
 *   onClose={() => setSelectedFarm(null)}
 *   onNavigate={handleNavigate}
 *   userLocation={userLocation}
 * />
 * ```
 */
export function MobileMarkerSheet({
  farm,
  isOpen,
  onClose,
  onNavigate,
  onFavorite,
  onShare,
  onViewDetails,
  userLocation,
}: MobileMarkerSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Calculate open status
  const isOpenNow = farm ? isCurrentlyOpen(farm.hours) : false

  // Calculate distance
  const distance = farm && userLocation && farm.location
    ? formatDistance(
        calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          farm.location.lat,
          farm.location.lng
        )
      )
    : null

  // Get today's hours
  const todayHours = farm?.hours
    ? formatOpeningHours(farm.hours)
    : null

  // Vibrate on open for haptic feedback
  useEffect(() => {
    if (isOpen && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [isOpen])

  // Handle navigate click
  const handleNavigate = useCallback(() => {
    if (farm) {
      onNavigate?.(farm)
      // Default behavior: open in maps app
      if (!onNavigate) {
        const url = `https://maps.google.com/maps?q=${farm.location?.lat},${farm.location?.lng}`
        window.open(url, '_blank')
      }
    }
  }, [farm, onNavigate])

  // Handle favorite click with haptic
  const handleFavorite = useCallback(() => {
    if (farm) {
      if ('vibrate' in navigator) {
        navigator.vibrate(20)
      }
      onFavorite?.(farm.id)
    }
  }, [farm, onFavorite])

  // Handle share click
  const handleShare = useCallback(async () => {
    if (!farm) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: farm.name,
          text: `Check out ${farm.name} at ${farm.location?.address}`,
          url: window.location.href,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(
        `${farm.name} - ${farm.location?.address}`
      )
      onShare?.(farm)
    }
  }, [farm, onShare])

  // Handle view details
  const handleViewDetails = useCallback(() => {
    if (farm) {
      onViewDetails?.(farm)
      // Default behavior: navigate to farm page
      if (!onViewDetails) {
        window.location.href = `/shop/${farm.slug}`
      }
    }
  }, [farm, onViewDetails])

  if (!farm) return null

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        {/* Drag Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        <div ref={contentRef} className="px-4 pb-6 overflow-y-auto">
          {/* Header */}
          <DrawerHeader className="px-0 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                  {farm.name}
                </DrawerTitle>
                <DrawerDescription className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {farm.location?.city || farm.location?.address}
                  </span>
                </DrawerDescription>
              </div>
              <button
                onClick={handleFavorite}
                className="p-2 -mt-1 rounded-full text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label="Add to favorites"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </DrawerHeader>

          {/* Status and Distance */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${
                isOpenNow
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOpenNow ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              {isOpenNow ? 'Open now' : 'Closed'}
            </span>
            {distance && (
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {distance} away
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={handleNavigate}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 active:scale-[0.98] transition-all"
            >
              <Navigation className="w-5 h-5" />
              Directions
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>

          {/* Contact Info */}
          {(farm.contact?.phone || farm.contact?.website) && (
            <div className="space-y-2 mb-4 py-3 border-t border-b border-slate-100 dark:border-slate-800">
              {farm.contact?.phone && (
                <a
                  href={`tel:${farm.contact.phone}`}
                  className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-brand-primary"
                >
                  <Phone className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  {farm.contact.phone}
                </a>
              )}
              {farm.contact?.website && (
                <a
                  href={farm.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-brand-primary"
                >
                  <Globe className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  Visit website
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              )}
            </div>
          )}

          {/* Opening Hours */}
          {todayHours && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span className="font-medium">Today's hours</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 pl-6">
                {todayHours}
              </p>
            </div>
          )}

          {/* View Details Button */}
          <button
            onClick={handleViewDetails}
            className="w-full flex items-center justify-center gap-2 py-3 text-brand-primary font-medium hover:text-brand-primary/80 transition-colors"
          >
            View full details
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default MobileMarkerSheet
