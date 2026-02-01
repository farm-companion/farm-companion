'use client'

import React, { useEffect, useCallback } from 'react'
import { FarmShop, getImageUrl } from '@/types/farm'
import { getFarmStatus, formatOpeningHours } from '@/lib/farm-status'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/Drawer'
import { MapPin, Clock, Navigation, Phone, Globe, ExternalLink, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// =============================================================================
// TYPES
// =============================================================================

export interface FarmDetailSheetProps {
  /** Farm to display */
  farm: FarmShop | null
  /** Whether sheet is open */
  isOpen: boolean
  /** Callback when sheet is closed */
  onClose: () => void
  /** Callback when "View Full Details" is clicked */
  onViewDetails?: (farm: FarmShop) => void
  /** Callback when "Get Directions" is clicked */
  onGetDirections?: (farm: FarmShop) => void
  /** User's current location for distance calculation */
  userLocation?: { latitude: number; longitude: number } | null
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Farm Detail Sheet for Mobile
 *
 * A bottom sheet drawer that shows farm details on mobile devices.
 * Features:
 * - Swipe to dismiss
 * - Farm image, status, hours
 * - Quick action buttons (directions, call, website)
 * - Distance from user
 * - Link to full details page
 *
 * @example
 * ```tsx
 * <FarmDetailSheet
 *   farm={selectedFarm}
 *   isOpen={!!selectedFarm}
 *   onClose={() => setSelectedFarm(null)}
 *   onViewDetails={(farm) => router.push(`/shop/${farm.slug}`)}
 *   userLocation={userLocation}
 * />
 * ```
 */
export function FarmDetailSheet({
  farm,
  isOpen,
  onClose,
  onViewDetails,
  onGetDirections,
  userLocation,
}: FarmDetailSheetProps) {
  // Calculate distance from user
  const distance = React.useMemo(() => {
    if (!userLocation || !farm?.location) return null
    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      farm.location.lat,
      farm.location.lng
    )
    return formatDistance(dist)
  }, [userLocation, farm?.location])

  // Get status info
  const status = farm ? getFarmStatus(farm.hours) : null
  const isOpen_ = status?.status === 'open'
  const nextOpen = status?.nextChange?.action === 'opens' ? status.nextChange.time : null
  const todayHours = farm ? formatOpeningHours(farm.hours) : null
  const imageUrl = farm?.images?.[0] ? getImageUrl(farm.images[0]) : null

  // Handle directions
  const handleGetDirections = useCallback(() => {
    if (!farm) return
    if (onGetDirections) {
      onGetDirections(farm)
    } else {
      // Default: open in Google Maps
      const { lat, lng } = farm.location
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank',
        'noopener,noreferrer'
      )
    }
  }, [farm, onGetDirections])

  // Handle view details
  const handleViewDetails = useCallback(() => {
    if (!farm) return
    if (onViewDetails) {
      onViewDetails(farm)
    }
  }, [farm, onViewDetails])

  if (!farm) return null

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent side="bottom" className="max-h-[85vh] rounded-t-xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
        </div>

        <DrawerHeader className="pb-2">
          <div className="flex items-start gap-4">
            {/* Image thumbnail */}
            {imageUrl && (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={farm.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-left text-lg">
                {farm.name}
              </DrawerTitle>
              <DrawerDescription className="text-left">
                <span className="flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {farm.location.city || farm.location.address}
                  </span>
                </span>
              </DrawerDescription>

              {/* Status and distance row */}
              <div className="flex items-center gap-3 mt-2">
                {/* Status badge */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    isOpen_
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isOpen_ ? 'bg-green-500' : 'bg-red-500'
                    )}
                  />
                  {isOpen_ ? 'Open' : 'Closed'}
                </span>

                {/* Distance */}
                {distance && (
                  <span className="text-xs text-zinc-600 dark:text-zinc-300">
                    {distance} away
                  </span>
                )}
              </div>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Today's hours */}
          {todayHours && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>
                {isOpen_ ? `Open until ${todayHours}` : nextOpen || `Hours: ${todayHours}`}
              </span>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2">
            {/* Directions */}
            <button
              onClick={handleGetDirections}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </button>

            {/* Call */}
            {farm.contact?.phone && (
              <a
                href={`tel:${farm.contact.phone}`}
                className="flex items-center justify-center p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Call farm"
              >
                <Phone className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
              </a>
            )}

            {/* Website */}
            {farm.contact?.website && (
              <a
                href={farm.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Visit website"
              >
                <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
              </a>
            )}
          </div>

          {/* Offerings preview */}
          {farm.offerings && farm.offerings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {farm.offerings.slice(0, 5).map((offering) => (
                <span
                  key={offering}
                  className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs text-zinc-700 dark:text-zinc-300"
                >
                  {offering}
                </span>
              ))}
              {farm.offerings.length > 5 && (
                <span className="px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                  +{farm.offerings.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* View full details link */}
          {onViewDetails ? (
            <button
              onClick={handleViewDetails}
              className="w-full flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                <ExternalLink className="w-4 h-4" />
                View Full Details
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </button>
          ) : (
            <Link
              href={`/shop/${farm.slug}`}
              className="w-full flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                <ExternalLink className="w-4 h-4" />
                View Full Details
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </Link>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default FarmDetailSheet
