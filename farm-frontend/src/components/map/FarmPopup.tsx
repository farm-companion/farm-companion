'use client'

import React, { useEffect, useRef, useCallback, memo } from 'react'
import { Popup, Map as MapLibreMapInstance } from 'maplibre-gl'
import { createRoot, Root } from 'react-dom/client'
import { MapPin, Navigation, Share2, Heart, X, Clock, Phone, Globe, ExternalLink } from 'lucide-react'
import { FarmShop } from '@/types/farm'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'
import { isCurrentlyOpen } from '@/lib/farm-status'

// =============================================================================
// TYPES
// =============================================================================

export interface FarmPopupProps {
  /** Farm to display in popup */
  farm: FarmShop | null
  /** MapLibre map instance */
  map: MapLibreMapInstance | null
  /** Whether popup is visible */
  isVisible: boolean
  /** Callback when popup closes */
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
  /** Offset from marker in pixels [x, y] */
  offset?: [number, number]
  /** Max width of popup in pixels */
  maxWidth?: string
  /** Whether to close on map click */
  closeOnMapClick?: boolean
}

// =============================================================================
// POPUP CONTENT COMPONENT
// =============================================================================

interface PopupContentProps {
  farm: FarmShop
  onClose: () => void
  onNavigate?: (farm: FarmShop) => void
  onFavorite?: (farmId: string) => void
  onShare?: (farm: FarmShop) => void
  onViewDetails?: (farm: FarmShop) => void
  userLocation?: { latitude: number; longitude: number } | null
}

function PopupContent({
  farm,
  onClose,
  onNavigate,
  onFavorite,
  onShare,
  onViewDetails,
  userLocation,
}: PopupContentProps) {
  const isOpen = isCurrentlyOpen(farm.hours)

  // Calculate distance
  const distance = userLocation && farm.location
    ? formatDistance(
        calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          farm.location.lat,
          farm.location.lng
        )
      )
    : null

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  return (
    <div
      className="farm-popup-content"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-labelledby="popup-farm-name"
      aria-describedby="popup-farm-location"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3
            id="popup-farm-name"
            className="text-base font-semibold text-slate-900 dark:text-white truncate"
          >
            {farm.name}
          </h3>
          <div
            id="popup-farm-location"
            className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mt-0.5"
          >
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{farm.location?.city || farm.location?.address}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 -mt-1 -mr-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          aria-label="Close popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status and Distance */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
          isOpen
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
          {isOpen ? 'Open now' : 'Closed'}
        </span>
        {distance && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {distance} away
          </span>
        )}
      </div>

      {/* Quick Info */}
      {(farm.contact?.phone || farm.contact?.website) && (
        <div className="flex flex-wrap gap-2 mb-3 text-xs text-slate-600 dark:text-slate-400">
          {farm.contact?.phone && (
            <a
              href={`tel:${farm.contact.phone}`}
              className="inline-flex items-center gap-1 hover:text-brand-primary"
            >
              <Phone className="w-3 h-3" />
              {farm.contact.phone}
            </a>
          )}
          {farm.contact?.website && (
            <a
              href={farm.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-brand-primary"
            >
              <Globe className="w-3 h-3" />
              Website
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate?.(farm)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        >
          <Navigation className="w-4 h-4" />
          Directions
        </button>

        <button
          onClick={() => onFavorite?.(farm.id)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          aria-label="Add to favorites"
        >
          <Heart className="w-4 h-4" />
        </button>

        <button
          onClick={() => onShare?.(farm)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-brand-primary hover:border-brand-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          aria-label="Share farm"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* View Details Link */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(farm)}
          className="w-full mt-2 py-2 text-sm text-brand-primary hover:text-brand-primary/80 font-medium transition-colors focus:outline-none focus:underline"
        >
          View full details
        </button>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Farm Popup Component for MapLibre GL
 *
 * Renders a popup attached to a farm marker with:
 * - Farm name, location, and status
 * - Distance from user (if location available)
 * - Quick actions: navigate, favorite, share
 * - Accessible keyboard navigation
 * - Smooth open/close animations
 *
 * @example
 * ```tsx
 * <FarmPopup
 *   farm={selectedFarm}
 *   map={mapInstance}
 *   isVisible={!!selectedFarm}
 *   onClose={() => setSelectedFarm(null)}
 *   onNavigate={handleNavigate}
 *   userLocation={userLocation}
 * />
 * ```
 */
export const FarmPopup = memo(function FarmPopup({
  farm,
  map,
  isVisible,
  onClose,
  onNavigate,
  onFavorite,
  onShare,
  onViewDetails,
  userLocation,
  offset = [0, -10],
  maxWidth = '300px',
  closeOnMapClick = true,
}: FarmPopupProps) {
  const popupRef = useRef<Popup | null>(null)
  const rootRef = useRef<Root | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const closeCallbackRef = useRef(onClose)

  // Keep close callback ref updated
  useEffect(() => {
    closeCallbackRef.current = onClose
  }, [onClose])

  // Create popup instance
  useEffect(() => {
    if (!map) return

    // Create container for React content
    const container = document.createElement('div')
    container.className = 'maplibre-farm-popup'
    containerRef.current = container

    // Create popup
    const popup = new Popup({
      closeButton: false,
      closeOnClick: closeOnMapClick,
      maxWidth,
      offset,
      className: 'farm-popup-wrapper',
      focusAfterOpen: true,
    })

    popup.setDOMContent(container)

    // Handle popup close event
    popup.on('close', () => {
      closeCallbackRef.current()
    })

    popupRef.current = popup

    // Create React root
    rootRef.current = createRoot(container)

    return () => {
      rootRef.current?.unmount()
      popup.remove()
      popupRef.current = null
      rootRef.current = null
      containerRef.current = null
    }
  }, [map, maxWidth, closeOnMapClick])

  // Update popup visibility and content
  useEffect(() => {
    if (!popupRef.current || !map || !rootRef.current) return

    if (isVisible && farm && farm.location?.lat && farm.location?.lng) {
      // Render content
      rootRef.current.render(
        <PopupContent
          farm={farm}
          onClose={onClose}
          onNavigate={onNavigate}
          onFavorite={onFavorite}
          onShare={onShare}
          onViewDetails={onViewDetails}
          userLocation={userLocation}
        />
      )

      // Position and show popup
      popupRef.current
        .setLngLat([farm.location.lng, farm.location.lat])
        .addTo(map)
    } else {
      popupRef.current.remove()
    }
  }, [isVisible, farm, map, onClose, onNavigate, onFavorite, onShare, onViewDetails, userLocation])

  // Update offset when it changes
  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.setOffset(offset)
    }
  }, [offset])

  // Handle escape key globally
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, onClose])

  // This component manages a MapLibre Popup imperatively
  return null
})

export default FarmPopup
