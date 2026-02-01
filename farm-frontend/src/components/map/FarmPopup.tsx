'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { Popup, Map as MapLibreMapInstance } from 'maplibre-gl'
import { FarmShop, getImageUrl } from '@/types/farm'
import { getFarmStatus } from '@/lib/farm-status'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'
import { MapPin, Clock, ExternalLink, Navigation, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface FarmPopupProps {
  /** Farm to display in popup */
  farm: FarmShop | null
  /** MapLibre map instance */
  map: MapLibreMapInstance | null
  /** Whether popup is visible */
  isOpen: boolean
  /** Callback when popup is closed */
  onClose: () => void
  /** Callback when "View Details" is clicked */
  onViewDetails?: (farm: FarmShop) => void
  /** Callback when "Get Directions" is clicked */
  onGetDirections?: (farm: FarmShop) => void
  /** User's current location for distance calculation */
  userLocation?: { latitude: number; longitude: number } | null
  /** Additional class names */
  className?: string
}

// =============================================================================
// POPUP CONTENT COMPONENT
// =============================================================================

interface PopupContentProps {
  farm: FarmShop
  onClose: () => void
  onViewDetails?: (farm: FarmShop) => void
  onGetDirections?: (farm: FarmShop) => void
  distance?: string | null
}

function PopupContent({
  farm,
  onClose,
  onViewDetails,
  onGetDirections,
  distance,
}: PopupContentProps) {
  const status = getFarmStatus(farm.hours)
  const isOpen = status.status === 'open'
  const nextOpen = status.nextChange?.action === 'opens' ? status.nextChange.time : null
  const imageUrl = farm.images?.[0] ? getImageUrl(farm.images[0]) : null

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onViewDetails?.(farm)
  }

  const handleGetDirections = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onGetDirections?.(farm)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="farm-popup-content w-72 bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden"
      role="dialog"
      aria-label={`${farm.name} details`}
      onKeyDown={handleKeyDown}
    >
      {/* Image header */}
      {imageUrl && (
        <div className="relative h-32 w-full">
          <img
            src={imageUrl}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
          {/* Status badge overlay */}
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                isOpen
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isOpen ? 'bg-green-500' : 'bg-red-500'
                )}
              />
              {isOpen ? 'Open now' : 'Closed'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Farm name */}
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1 line-clamp-1">
          {farm.name}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-1.5 text-sm text-zinc-600 dark:text-zinc-300 mb-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {farm.location.city || farm.location.address}
          </span>
        </div>

        {/* Distance and status row */}
        <div className="flex items-center gap-2 text-sm mb-3">
          {distance && (
            <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
              <Navigation className="w-3.5 h-3.5" />
              {distance}
            </span>
          )}
          {!isOpen && nextOpen && (
            <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
              <Clock className="w-3.5 h-3.5" />
              {nextOpen}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Details
          </button>
          <button
            onClick={handleGetDirections}
            className="inline-flex items-center justify-center p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
            aria-label="Get directions"
          >
            <Navigation className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          </button>
          {farm.contact?.phone && (
            <a
              href={`tel:${farm.contact.phone}`}
              className="inline-flex items-center justify-center p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
              aria-label="Call farm"
            >
              <Phone className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Farm Popup Component for MapLibre GL
 *
 * Uses MapLibre's native Popup API for optimal positioning and map integration.
 * Features:
 * - Auto-positioning to stay within map bounds
 * - Farm image, status, and quick actions
 * - Distance display when user location available
 * - Keyboard accessible (Escape to close)
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <FarmPopup
 *   farm={selectedFarm}
 *   map={mapInstance}
 *   isOpen={!!selectedFarm}
 *   onClose={() => setSelectedFarm(null)}
 *   onViewDetails={(farm) => router.push(`/shop/${farm.slug}`)}
 *   onGetDirections={(farm) => openDirections(farm)}
 *   userLocation={userLocation}
 * />
 * ```
 */
export function FarmPopup({
  farm,
  map,
  isOpen,
  onClose,
  onViewDetails,
  onGetDirections,
  userLocation,
  className,
}: FarmPopupProps) {
  const popupRef = useRef<Popup | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isMounted, setIsMounted] = useState(false)

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

  // Handle directions
  const handleGetDirections = useCallback(
    (farm: FarmShop) => {
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
    },
    [onGetDirections]
  )

  // Create popup container on mount
  useEffect(() => {
    containerRef.current = document.createElement('div')
    containerRef.current.className = cn('farm-popup-container', className)
    setIsMounted(true)

    return () => {
      containerRef.current = null
    }
  }, [className])

  // Manage popup lifecycle
  useEffect(() => {
    if (!map || !farm || !isOpen || !containerRef.current || !isMounted) {
      // Close popup if conditions not met
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      return
    }

    // Create popup if not exists
    if (!popupRef.current) {
      popupRef.current = new Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '320px',
        className: 'farm-popup-wrapper',
        focusAfterOpen: true,
        offset: [0, -10],
      })

      popupRef.current.on('close', onClose)
    }

    // Update popup content and position
    popupRef.current
      .setLngLat([farm.location.lng, farm.location.lat])
      .setDOMContent(containerRef.current)
      .addTo(map)

    // Cleanup
    return () => {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
    }
  }, [map, farm, isOpen, onClose, isMounted])

  // Render content via portal
  if (!farm || !isOpen || !containerRef.current || !isMounted) {
    return null
  }

  return createPortal(
    <PopupContent
      farm={farm}
      onClose={onClose}
      onViewDetails={onViewDetails}
      onGetDirections={handleGetDirections}
      distance={distance}
    />,
    containerRef.current
  )
}

export default FarmPopup
