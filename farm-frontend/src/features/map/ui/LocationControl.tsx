'use client'

import { useState, useCallback } from 'react'
import { Navigation, Loader2, MapPin, AlertCircle, Crosshair } from 'lucide-react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useMapLocation } from '../hooks/useMapLocation'

interface LocationControlProps {
  /** MapLibre map instance */
  map: MapLibreMap | null
  /** Callback when location changes */
  onLocationChange?: (location: { lat: number; lng: number }) => void
  /** Whether to show accuracy indicator */
  showAccuracy?: boolean
  /** Zoom level when centering */
  centerZoom?: number
  /** Position on map */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Additional className */
  className?: string
}

/**
 * LocationControl - Map control for user location
 *
 * Features:
 * - "Center on me" button
 * - Location accuracy indicator
 * - Permission state feedback
 * - Loading state
 */
export default function LocationControl({
  map,
  onLocationChange,
  showAccuracy = true,
  centerZoom = 12,
  position = 'bottom-right',
  className = '',
}: LocationControlProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { state, centerOnUser, refreshLocation, isTracking, startTracking, stopTracking } =
    useMapLocation({
      map,
      centerZoom,
      onLocationChange,
      showMarker: true,
      showAccuracyCircle: true,
      useIpFallback: true,
    })

  const handleCenterClick = useCallback(() => {
    if (state.lat !== null && state.lng !== null) {
      centerOnUser()
    } else {
      refreshLocation()
    }
  }, [state.lat, state.lng, centerOnUser, refreshLocation])

  const handleTrackingToggle = useCallback(() => {
    if (isTracking) {
      stopTracking()
    } else {
      startTracking()
    }
  }, [isTracking, startTracking, stopTracking])

  // Format accuracy for display
  const formatAccuracy = (meters: number | null): string => {
    if (meters === null) return 'Unknown'
    if (meters < 100) return `${Math.round(meters)}m`
    if (meters < 1000) return `${Math.round(meters / 10) * 10}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  // Determine button state
  const getButtonState = () => {
    if (state.isLoading) return 'loading'
    if (state.isPermissionDenied) return 'denied'
    if (state.error) return 'error'
    if (state.lat !== null) return 'located'
    return 'idle'
  }

  const buttonState = getButtonState()

  // Position styles
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-10 ${className}`}>
      <div className="flex flex-col items-end gap-2">
        {/* Main location button */}
        <button
          onClick={handleCenterClick}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          disabled={state.isLoading}
          className={`
            flex items-center gap-2 px-3 py-2
            bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm
            border border-zinc-200 dark:border-white/10
            rounded-full shadow-lg
            hover:bg-white dark:hover:bg-zinc-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${buttonState === 'located' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}
            ${buttonState === 'denied' ? 'text-amber-600 dark:text-amber-400' : ''}
            ${buttonState === 'error' ? 'text-red-600 dark:text-red-400' : ''}
          `}
          aria-label={
            state.isLoading
              ? 'Getting location...'
              : state.isPermissionDenied
                ? 'Location permission denied'
                : 'Center map on my location'
          }
        >
          {state.isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : buttonState === 'denied' ? (
            <AlertCircle className="w-5 h-5" />
          ) : buttonState === 'located' ? (
            <MapPin className="w-5 h-5" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}

          {isExpanded && (
            <span className="text-sm font-medium whitespace-nowrap">
              {state.isLoading && 'Finding location...'}
              {buttonState === 'denied' && 'Permission denied'}
              {buttonState === 'error' && 'Location error'}
              {buttonState === 'located' && 'Center on me'}
              {buttonState === 'idle' && 'Find me'}
            </span>
          )}
        </button>

        {/* Tracking toggle (only show when located) */}
        {state.lat !== null && (
          <button
            onClick={handleTrackingToggle}
            className={`
              flex items-center gap-2 px-3 py-2
              bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm
              border border-zinc-200 dark:border-white/10
              rounded-full shadow-lg
              hover:bg-white dark:hover:bg-zinc-800
              transition-all duration-200
              ${isTracking ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}
            `}
            aria-label={isTracking ? 'Stop tracking location' : 'Start tracking location'}
          >
            <Crosshair className={`w-4 h-4 ${isTracking ? 'animate-pulse' : ''}`} />
            {isExpanded && (
              <span className="text-xs font-medium">
                {isTracking ? 'Tracking' : 'Track'}
              </span>
            )}
          </button>
        )}

        {/* Accuracy indicator */}
        {showAccuracy && state.accuracy !== null && state.lat !== null && (
          <div className="px-3 py-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-white/10 rounded-full shadow-md">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Accuracy: {formatAccuracy(state.accuracy)}
            </span>
          </div>
        )}

        {/* Source indicator (for debugging/transparency) */}
        {state.source === 'ip' && (
          <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full shadow-md">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Approximate location
            </span>
          </div>
        )}

        {/* Permission denied help */}
        {state.isPermissionDenied && isExpanded && (
          <div className="max-w-xs p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Location access was denied. Enable it in your browser settings to use this feature.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
