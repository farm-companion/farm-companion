/**
 * useMapLocation Hook
 *
 * MapLibre-specific hook for user location tracking on the map.
 * Provides location marker management and map centering.
 *
 * Features:
 * - Real-time location tracking (optional)
 * - Location accuracy visualization
 * - Map centering with animation
 * - Permission state handling
 * - IP-based fallback via geocoding
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import { getApproximateLocation } from '@/lib/geocoding'

export interface MapLocationState {
  /** User's latitude */
  lat: number | null
  /** User's longitude */
  lng: number | null
  /** Accuracy in meters */
  accuracy: number | null
  /** Location source */
  source: 'gps' | 'ip' | 'fallback' | null
  /** Whether currently loading */
  isLoading: boolean
  /** Whether permission was denied */
  isPermissionDenied: boolean
  /** Error message if any */
  error: string | null
  /** Timestamp of last update */
  lastUpdated: number | null
}

export interface UseMapLocationOptions {
  /** MapLibre map instance */
  map: MapLibreMap | null
  /** Enable continuous tracking (default: false) */
  watchPosition?: boolean
  /** Enable high accuracy GPS (slower, more battery) */
  enableHighAccuracy?: boolean
  /** Timeout for geolocation request in ms (default: 10000) */
  timeout?: number
  /** Maximum age of cached position in ms (default: 60000) */
  maximumAge?: number
  /** Show location marker on map (default: true) */
  showMarker?: boolean
  /** Show accuracy circle (default: true) */
  showAccuracyCircle?: boolean
  /** Zoom level when centering on location (default: 12) */
  centerZoom?: number
  /** Use IP fallback if GPS fails (default: true) */
  useIpFallback?: boolean
  /** Callback when location changes */
  onLocationChange?: (location: { lat: number; lng: number }) => void
}

export interface UseMapLocationResult {
  /** Current location state */
  state: MapLocationState
  /** Center map on user location */
  centerOnUser: () => void
  /** Request fresh location */
  refreshLocation: () => void
  /** Start continuous tracking */
  startTracking: () => void
  /** Stop continuous tracking */
  stopTracking: () => void
  /** Whether tracking is active */
  isTracking: boolean
}

// Default center of UK
const UK_CENTER = { lat: 54.5, lng: -2.0 }

export function useMapLocation(
  options: UseMapLocationOptions
): UseMapLocationResult {
  const {
    map,
    watchPosition = false,
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    showMarker = true,
    showAccuracyCircle = true,
    centerZoom = 12,
    useIpFallback = true,
    onLocationChange,
  } = options

  const [state, setState] = useState<MapLocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    source: null,
    isLoading: false,
    isPermissionDenied: false,
    error: null,
    lastUpdated: null,
  })

  const [isTracking, setIsTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const accuracySourceRef = useRef<string | null>(null)

  // Create or update location marker
  const updateMarker = useCallback(
    (lat: number, lng: number, accuracy: number | null) => {
      if (!map || !showMarker) return

      // Create marker if it doesn't exist
      if (!markerRef.current) {
        // Create custom marker element
        const el = document.createElement('div')
        el.className = 'user-location-marker'
        el.innerHTML = `
          <div class="location-dot">
            <div class="location-pulse"></div>
          </div>
        `

        // Add styles if not already present
        if (!document.getElementById('user-location-styles')) {
          const style = document.createElement('style')
          style.id = 'user-location-styles'
          style.textContent = `
            .user-location-marker {
              position: relative;
            }
            .location-dot {
              width: 16px;
              height: 16px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .location-pulse {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              background: rgba(59, 130, 246, 0.3);
              border-radius: 50%;
              animation: location-pulse 2s ease-out infinite;
            }
            @keyframes location-pulse {
              0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
              100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
            }
            @media (prefers-reduced-motion: reduce) {
              .location-pulse { animation: none; opacity: 0.3; }
            }
          `
          document.head.appendChild(style)
        }

        const { Marker } = require('maplibre-gl')
        markerRef.current = new Marker({ element: el }).setLngLat([lng, lat]).addTo(map)
      } else {
        markerRef.current.setLngLat([lng, lat])
      }

      // Update accuracy circle
      if (showAccuracyCircle && accuracy) {
        updateAccuracyCircle(lat, lng, accuracy)
      }
    },
    [map, showMarker, showAccuracyCircle]
  )

  // Create or update accuracy circle
  const updateAccuracyCircle = useCallback(
    (lat: number, lng: number, accuracy: number) => {
      if (!map) return

      const sourceId = 'user-location-accuracy'
      const layerId = 'user-location-accuracy-circle'

      // Generate circle GeoJSON
      const circle = createCircle(lng, lat, accuracy)

      if (map.getSource(sourceId)) {
        // Update existing source
        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource
        source.setData(circle)
      } else {
        // Add new source and layer
        map.addSource(sourceId, {
          type: 'geojson',
          data: circle,
        })

        map.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.15,
          },
        })

        accuracySourceRef.current = sourceId
      }
    },
    [map]
  )

  // Create circle GeoJSON for accuracy
  const createCircle = (lng: number, lat: number, radiusMeters: number): GeoJSON.Feature => {
    const points = 64
    const coords: [number, number][] = []

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const dx = (radiusMeters / 111320) * Math.cos(angle) / Math.cos((lat * Math.PI) / 180)
      const dy = (radiusMeters / 110540) * Math.sin(angle)
      coords.push([lng + dx, lat + dy])
    }
    coords.push(coords[0]) // Close the ring

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
      properties: {},
    }
  }

  // Get location using Geolocation API
  const getLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    // Check for geolocation support
    if (typeof window === 'undefined' || !navigator.geolocation) {
      // Try IP fallback
      if (useIpFallback) {
        try {
          const ipLocation = await getApproximateLocation()
          if (ipLocation) {
            setState({
              lat: ipLocation.lat,
              lng: ipLocation.lng,
              accuracy: 10000, // ~10km accuracy for IP
              source: 'ip',
              isLoading: false,
              isPermissionDenied: false,
              error: null,
              lastUpdated: Date.now(),
            })
            updateMarker(ipLocation.lat, ipLocation.lng, 10000)
            onLocationChange?.({ lat: ipLocation.lat, lng: ipLocation.lng })
            return
          }
        } catch {
          // Fall through to fallback
        }
      }

      setState((prev) => ({
        ...prev,
        lat: UK_CENTER.lat,
        lng: UK_CENTER.lng,
        source: 'fallback',
        isLoading: false,
        error: 'Geolocation not supported',
      }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setState({
          lat: latitude,
          lng: longitude,
          accuracy,
          source: 'gps',
          isLoading: false,
          isPermissionDenied: false,
          error: null,
          lastUpdated: position.timestamp,
        })
        updateMarker(latitude, longitude, accuracy)
        onLocationChange?.({ lat: latitude, lng: longitude })
      },
      async (err) => {
        const isPermissionDenied = err.code === err.PERMISSION_DENIED

        // Try IP fallback on error
        if (useIpFallback && !isPermissionDenied) {
          try {
            const ipLocation = await getApproximateLocation()
            if (ipLocation) {
              setState({
                lat: ipLocation.lat,
                lng: ipLocation.lng,
                accuracy: 10000,
                source: 'ip',
                isLoading: false,
                isPermissionDenied: false,
                error: null,
                lastUpdated: Date.now(),
              })
              updateMarker(ipLocation.lat, ipLocation.lng, 10000)
              onLocationChange?.({ lat: ipLocation.lat, lng: ipLocation.lng })
              return
            }
          } catch {
            // Fall through to error state
          }
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isPermissionDenied,
          error: getErrorMessage(err),
        }))
      },
      { enableHighAccuracy, timeout, maximumAge }
    )
  }, [enableHighAccuracy, timeout, maximumAge, useIpFallback, updateMarker, onLocationChange])

  // Convert GeolocationPositionError to user-friendly message
  const getErrorMessage = (err: GeolocationPositionError): string => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Location permission denied'
      case err.POSITION_UNAVAILABLE:
        return 'Location unavailable'
      case err.TIMEOUT:
        return 'Location request timed out'
      default:
        return 'Unknown location error'
    }
  }

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (!map) return

    if (state.lat !== null && state.lng !== null) {
      map.flyTo({
        center: [state.lng, state.lat],
        zoom: centerZoom,
        duration: 1000,
      })
    } else {
      // Get location first, then center
      getLocation()
    }
  }, [map, state.lat, state.lng, centerZoom, getLocation])

  // Start continuous tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return

    setIsTracking(true)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setState({
          lat: latitude,
          lng: longitude,
          accuracy,
          source: 'gps',
          isLoading: false,
          isPermissionDenied: false,
          error: null,
          lastUpdated: position.timestamp,
        })
        updateMarker(latitude, longitude, accuracy)
        onLocationChange?.({ lat: latitude, lng: longitude })
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          error: getErrorMessage(err),
          isPermissionDenied: err.code === err.PERMISSION_DENIED,
        }))
      },
      { enableHighAccuracy, timeout, maximumAge }
    )
  }, [enableHighAccuracy, timeout, maximumAge, updateMarker, onLocationChange])

  // Stop continuous tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }, [])

  // Auto-start tracking if requested
  useEffect(() => {
    if (watchPosition) {
      startTracking()
    }
    return () => stopTracking()
  }, [watchPosition, startTracking, stopTracking])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove marker
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      // Remove accuracy circle
      if (map && accuracySourceRef.current) {
        try {
          if (map.getLayer('user-location-accuracy-circle')) {
            map.removeLayer('user-location-accuracy-circle')
          }
          if (map.getSource(accuracySourceRef.current)) {
            map.removeSource(accuracySourceRef.current)
          }
        } catch {
          // Map may be destroyed
        }
      }
    }
  }, [map])

  return {
    state,
    centerOnUser,
    refreshLocation: getLocation,
    startTracking,
    stopTracking,
    isTracking,
  }
}
