'use client'

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import maplibregl, { Map as MapLibreMapInstance, NavigationControl, GeolocateControl } from 'maplibre-gl'
import { useMapLibre } from './MapLibreProvider'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface MapLibreMapRef {
  /** Get the underlying MapLibre map instance */
  getMap: () => MapLibreMapInstance | null
  /** Fly to a location with animation */
  flyTo: (center: [number, number], zoom?: number) => void
  /** Jump to a location without animation */
  jumpTo: (center: [number, number], zoom?: number) => void
  /** Fit bounds to show all markers */
  fitBounds: (bounds: [[number, number], [number, number]], padding?: number) => void
  /** Get current center coordinates */
  getCenter: () => [number, number] | null
  /** Get current zoom level */
  getZoom: () => number | null
}

export interface MapLibreMapProps {
  /** Additional CSS classes */
  className?: string
  /** Map container style */
  style?: React.CSSProperties
  /** Initial center override [lng, lat] */
  initialCenter?: [number, number]
  /** Initial zoom override */
  initialZoom?: number
  /** Show navigation controls (zoom +/-) */
  showNavigation?: boolean
  /** Show geolocate control (locate me button) */
  showGeolocate?: boolean
  /** Show fullscreen control */
  showFullscreen?: boolean
  /** Enable scroll zoom */
  scrollZoom?: boolean
  /** Enable touch zoom/rotate */
  touchZoomRotate?: boolean
  /** Enable drag pan */
  dragPan?: boolean
  /** Enable keyboard navigation */
  keyboard?: boolean
  /** Callback when map is loaded */
  onLoad?: (map: MapLibreMapInstance) => void
  /** Callback when map is moved */
  onMove?: (center: [number, number], zoom: number) => void
  /** Callback when map is clicked */
  onClick?: (lng: number, lat: number) => void
  /** Callback when map move ends (after pan/zoom) */
  onMoveEnd?: (center: [number, number], zoom: number, bounds: [[number, number], [number, number]]) => void
  /** Children to render inside map container (for overlays) */
  children?: React.ReactNode
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * MapLibre GL Map Component
 *
 * A performant, accessible map component using MapLibre GL with free Stadia Maps tiles.
 *
 * Features:
 * - Theme-aware (light/dark mode)
 * - Reduced motion support
 * - Keyboard navigation
 * - Touch-friendly controls
 * - UK bounds restriction
 *
 * Usage:
 * ```tsx
 * <MapLibreProvider>
 *   <MapLibreMap
 *     onLoad={(map) => console.log('Map loaded')}
 *     onMoveEnd={(center, zoom, bounds) => fetchFarmsInBounds(bounds)}
 *   />
 * </MapLibreProvider>
 * ```
 */
export const MapLibreMap = forwardRef<MapLibreMapRef, MapLibreMapProps>(
  (
    {
      className,
      style,
      initialCenter,
      initialZoom,
      showNavigation = true,
      showGeolocate = true,
      showFullscreen = false,
      scrollZoom = true,
      touchZoomRotate = true,
      dragPan = true,
      keyboard = true,
      onLoad,
      onMove,
      onClick,
      onMoveEnd,
      children,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<MapLibreMapInstance | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    const { config, isSupported, isLoading } = useMapLibre()

    // Check reduced motion preference
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    // Initialize map
    useEffect(() => {
      if (!containerRef.current || !isSupported || isLoading) return

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: config.style as string,
        center: initialCenter || config.center,
        zoom: initialZoom ?? config.zoom,
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
        maxBounds: config.maxBounds,
        attributionControl: config.showAttribution ? {} : false,
        scrollZoom,
        touchZoomRotate,
        dragPan,
        keyboard,
        // Disable animations if user prefers reduced motion
        fadeDuration: prefersReducedMotion ? 0 : 300,
      })

      mapRef.current = map

      // Add controls
      if (showNavigation) {
        map.addControl(
          new NavigationControl({ showCompass: false }),
          'bottom-right'
        )
      }

      if (showGeolocate) {
        map.addControl(
          new GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false,
          }),
          'bottom-right'
        )
      }

      // Event handlers
      map.on('load', () => {
        setIsLoaded(true)
        onLoad?.(map)
      })

      map.on('move', () => {
        const center = map.getCenter()
        onMove?.([center.lng, center.lat], map.getZoom())
      })

      map.on('click', (e) => {
        onClick?.(e.lngLat.lng, e.lngLat.lat)
      })

      map.on('moveend', () => {
        const center = map.getCenter()
        const bounds = map.getBounds()
        onMoveEnd?.(
          [center.lng, center.lat],
          map.getZoom(),
          [
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()],
          ]
        )
      })

      // Cleanup
      return () => {
        map.remove()
        mapRef.current = null
      }
    }, [
      config.style,
      config.center,
      config.zoom,
      config.minZoom,
      config.maxZoom,
      config.maxBounds,
      config.showAttribution,
      initialCenter,
      initialZoom,
      isSupported,
      isLoading,
      scrollZoom,
      touchZoomRotate,
      dragPan,
      keyboard,
      showNavigation,
      showGeolocate,
      prefersReducedMotion,
      onLoad,
      onMove,
      onClick,
      onMoveEnd,
    ])

    // Update style when theme changes
    useEffect(() => {
      if (mapRef.current && isLoaded && typeof config.style === 'string') {
        mapRef.current.setStyle(config.style)
      }
    }, [config.style, isLoaded])

    // Expose imperative methods
    const flyTo = useCallback((center: [number, number], zoom?: number) => {
      if (!mapRef.current) return
      mapRef.current.flyTo({
        center,
        zoom: zoom ?? mapRef.current.getZoom(),
        duration: prefersReducedMotion ? 0 : 1500,
      })
    }, [prefersReducedMotion])

    const jumpTo = useCallback((center: [number, number], zoom?: number) => {
      if (!mapRef.current) return
      mapRef.current.jumpTo({
        center,
        zoom: zoom ?? mapRef.current.getZoom(),
      })
    }, [])

    const fitBounds = useCallback((bounds: [[number, number], [number, number]], padding = 50) => {
      if (!mapRef.current) return
      mapRef.current.fitBounds(bounds, {
        padding,
        duration: prefersReducedMotion ? 0 : 1000,
      })
    }, [prefersReducedMotion])

    const getCenter = useCallback((): [number, number] | null => {
      if (!mapRef.current) return null
      const center = mapRef.current.getCenter()
      return [center.lng, center.lat]
    }, [])

    const getZoom = useCallback((): number | null => {
      return mapRef.current?.getZoom() ?? null
    }, [])

    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
      flyTo,
      jumpTo,
      fitBounds,
      getCenter,
      getZoom,
    }), [flyTo, jumpTo, fitBounds, getCenter, getZoom])

    // Render fallback if WebGL not supported
    if (!isSupported) {
      return (
        <div
          className={cn(
            'flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
            className
          )}
          style={style}
          role="img"
          aria-label="Map not available"
        >
          <div className="text-center p-4">
            <p className="font-medium">Map not available</p>
            <p className="text-sm mt-1">Your browser does not support WebGL maps.</p>
          </div>
        </div>
      )
    }

    // Render loading state
    if (isLoading) {
      return (
        <div
          className={cn(
            'flex items-center justify-center bg-zinc-100 dark:bg-zinc-800',
            className
          )}
          style={style}
        >
          <div className="animate-pulse text-zinc-400">Loading map...</div>
        </div>
      )
    }

    return (
      <div className={cn('relative', className)} style={style}>
        {/* Map container */}
        <div
          ref={containerRef}
          className="absolute inset-0"
          role="application"
          aria-label="Interactive map showing farm locations"
        />

        {/* Loading overlay while map initializes */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm">
            <div className="animate-pulse text-zinc-500 dark:text-zinc-400">
              Loading map...
            </div>
          </div>
        )}

        {/* Children (overlays, controls, etc.) */}
        {isLoaded && children}
      </div>
    )
  }
)

MapLibreMap.displayName = 'MapLibreMap'

export default MapLibreMap
