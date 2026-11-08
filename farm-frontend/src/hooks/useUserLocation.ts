/**
 * useUserLocation Hook
 *
 * Reusable hook for accessing user geolocation.
 * Handles permission, caching, and error states.
 */

import { useState, useEffect, useCallback } from 'react'

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: number
}

export interface UseUserLocationOptions {
  /** Enable high accuracy GPS (slower, more battery) */
  enableHighAccuracy?: boolean
  /** Timeout for geolocation request in ms */
  timeout?: number
  /** Maximum age of cached position in ms */
  maximumAge?: number
}

export interface UseUserLocationResult {
  /** The user's real position, or null. Never a substituted coordinate. */
  location: UserLocation | null
  isLoading: boolean
  error: GeolocationPositionError | null
  isPermissionDenied: boolean
  /** Geolocation is not available at all (SSR, or unsupported browser) */
  isUnavailable: boolean
  refresh: () => void
}

/**
 * Hook for accessing user geolocation.
 *
 * `location` is null unless the browser returned a real position. This hook
 * never substitutes a default coordinate: a caller that cannot tell a real
 * position from an invented one will present, say, London farms to a user in
 * Cornwall. Branch on `location === null` and say so in the interface.
 *
 * @example
 * const { location, isLoading, isPermissionDenied, refresh } = useUserLocation()
 *
 * if (location) {
 *   console.log(`User is at ${location.latitude}, ${location.longitude}`)
 * }
 */
export function useUserLocation(
  options: UseUserLocationOptions = {}
): UseUserLocationResult {
  const {
    enableHighAccuracy = false,
    timeout = 10000,
    maximumAge = 300000 // 5 minutes cache
  } = options

  const [location, setLocation] = useState<UserLocation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)
  const [isUnavailable, setIsUnavailable] = useState(false)

  const fetchLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      // SSR or no geolocation support. Report it; do not invent a position.
      setIsUnavailable(true)
      setIsLoading(false)
      return
    }

    setIsUnavailable(false)

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
        setIsLoading(false)
        setIsPermissionDenied(false)
      },
      (err) => {
        setError(err)
        setIsLoading(false)

        // Denied, unavailable or timed out. Leave location null so callers
        // branch on "we do not know" rather than on a coordinate we made up.
        if (err.code === err.PERMISSION_DENIED) {
          setIsPermissionDenied(true)
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    )
  }, [enableHighAccuracy, timeout, maximumAge])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  return {
    location,
    isLoading,
    error,
    isPermissionDenied,
    isUnavailable,
    refresh: fetchLocation
  }
}
