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
  /** Fallback location if permission denied (defaults to London) */
  fallback?: { latitude: number; longitude: number }
}

export interface UseUserLocationResult {
  location: UserLocation | null
  isLoading: boolean
  error: GeolocationPositionError | null
  isPermissionDenied: boolean
  refresh: () => void
}

const DEFAULT_FALLBACK = { latitude: 51.5074, longitude: -0.1278 } // London

/**
 * Hook for accessing user geolocation
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
    maximumAge = 300000, // 5 minutes cache
    fallback = DEFAULT_FALLBACK
  } = options

  const [location, setLocation] = useState<UserLocation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)

  const fetchLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      // SSR or no geolocation support - use fallback
      setLocation({
        ...fallback,
        timestamp: Date.now()
      })
      setIsLoading(false)
      return
    }

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

        // Permission denied - use fallback
        if (err.code === err.PERMISSION_DENIED) {
          setIsPermissionDenied(true)
          setLocation({
            ...fallback,
            timestamp: Date.now()
          })
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    )
  }, [enableHighAccuracy, timeout, maximumAge, fallback])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  return {
    location,
    isLoading,
    error,
    isPermissionDenied,
    refresh: fetchLocation
  }
}
