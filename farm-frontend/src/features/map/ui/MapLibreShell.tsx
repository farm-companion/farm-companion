'use client'

// rationale: Cohesive MapLibre provider shell (map lifecycle, supercluster
// markers, popovers, a11y wiring); splitting risks duplicating provider
// lifecycle. Extraction of cluster + marker layers tracked as future slice.

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FarmShop } from '@/types/farm'
import { useClusteredMarkers, type ClusterOrPoint } from '../hooks/useClusteredMarkers'
import { useMapLocation } from '../hooks/useMapLocation'
import { getContrastTextColor } from '@/lib/contrast'
import { getPinForFarm, generateStatusMarkerSVG, isFarmOpen } from '../lib/pin-icons'
import { getFarmMarkerLabel, getClusterMarkerLabel, announce, ANNOUNCEMENTS } from '../lib/accessibility'
import { CLUSTER_ZOOM_THRESHOLDS } from '../lib/cluster-config'
import { getMapStyle, getMapAttribution } from '@/lib/map-config'
import { recolorMap, isDarkTheme } from '@/lib/map-theme'
import LocationControl from './LocationControl'
import MapControls from './MapControls'
import ClusterPreview from './ClusterPreview'
import ScaleBar from './ScaleBar'

interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  isTracking?: boolean
  nearestFarm?: {
    id: string
    name: string
    distance: number
  }
}

interface MapLibreShellProps {
  farms: FarmShop[]
  selectedFarmId?: string | null
  hoveredFarmId?: string | null
  onFarmSelect?: (farmId: string) => void
  onFarmHover?: (farmId: string | null) => void
  onMapLoad?: (map: maplibregl.Map) => void
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
  onZoomChange?: (zoom: number) => void
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  userLocation?: UserLocation | null
  bottomSheetHeight?: number
  isDesktop?: boolean
  onMapReady?: (map: maplibregl.Map) => void
}

// UK bounds - tighter focus on mainland Britain and Ireland
const UK_BOUNDS = {
  north: 59.0,   // Northern Scotland (not Shetland)
  south: 50.0,   // English Channel
  east: 1.8,     // East Anglia coast
  west: -8.5     // West Ireland
}

interface MarkerState {
  selected: FarmShop | null
  showActions: boolean
}

interface ClusterData {
  clusterId: number
  position: { lat: number; lng: number }
  farms: FarmShop[]
  count: number
}

/**
 * MapLibreShell - MapLibre GL JS based map component
 *
 * Drop-in replacement for Google Maps MapShell using free MapLibre GL.
 * Features:
 * - Supercluster-based marker clustering
 * - Category-based pin icons
 * - User location tracking
 * - Mobile bottom sheet / Desktop popover interactions
 * - Accessible keyboard navigation
 */
export default function MapLibreShell({
  farms,
  selectedFarmId,
  hoveredFarmId,
  onFarmSelect,
  onFarmHover,
  onMapLoad,
  onBoundsChange,
  onZoomChange,
  zoom = 5,
  className = 'w-full h-full',
  isDesktop = false,
  onMapReady
}: MapLibreShellProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const clusterMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map())

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null)
  const [currentBounds, setCurrentBounds] = useState<{
    north: number
    south: number
    east: number
    west: number
  } | null>(null)
  const [currentZoom, setCurrentZoom] = useState(zoom)

  const [markerState, setMarkerState] = useState<MarkerState>({
    selected: null,
    showActions: false
  })
  const [selectedCluster, setSelectedCluster] = useState<ClusterData | null>(null)
  const [showClusterPreview, setShowClusterPreview] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 })

  // Use our clustering hook with correct signature
  const { clusters, getClusterLeaves, getClusterExpansionZoom, isCluster } = useClusteredMarkers(
    farms,
    currentZoom,
    currentBounds,
    { radius: 50, maxZoom: 18 }  // Smaller radius + higher maxZoom for better expansion
  )

  // User-location hook: manages its own map marker/accuracy circle as a side
  // effect (showMarker/showAccuracyCircle); no return value is consumed here.
  useMapLocation({
    map: mapInstance,
    showMarker: true,
    showAccuracyCircle: true,
    useIpFallback: true,
  })

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 }
      navigator.vibrate(patterns[type])
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const mapStyle = getMapStyle(false)

    // Calculate padding for initial bounds - account for sidebar on desktop
    const isDesktopView = typeof window !== 'undefined' && window.innerWidth >= 768
    const initialPadding = {
      top: 60,
      right: isDesktopView ? 420 : 20,  // Sidebar width + margin
      bottom: 60,
      left: 20
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      // Use bounds instead of center/zoom to immediately show UK without flash
      bounds: [[UK_BOUNDS.west, UK_BOUNDS.south], [UK_BOUNDS.east, UK_BOUNDS.north]],
      fitBoundsOptions: { padding: initialPadding },
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
      pitchWithRotate: false,
    })

    // Add attribution control separately. customAttribution is provider-aware:
    // the keyed Stadia style embeds its own credit (so we add nothing), the
    // keyless OpenFreeMap path adds only the provider courtesy line on top of
    // the source's own OpenMapTiles + OSM credit.
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: getMapAttribution(),
      }),
      'bottom-right'
    )

    map.on('load', () => {
      // Repaint the neutral vector basemap to the Pitti Press brand palette.
      // Runs once the style is loaded; re-applied on theme flip is unnecessary
      // today (ThemeProvider forces light), but isDarkTheme keeps it correct.
      recolorMap(map, isDarkTheme())

      setIsLoading(false)
      setMapInstance(map)
      mapRef.current = map

      // Set initial bounds immediately so markers render on first load
      // This is critical - without bounds, the clustering hook returns empty
      const bounds = map.getBounds()
      if (bounds) {
        const initialBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        }
        setCurrentBounds(initialBounds)
        setCurrentZoom(map.getZoom())
        onBoundsChange?.(initialBounds)
        onZoomChange?.(map.getZoom())
      }

      onMapLoad?.(map)
      onMapReady?.(map)
    })

    // Debounced move handler to prevent glitchy marker recreation during zoom
    let moveTimeout: ReturnType<typeof setTimeout> | null = null
    const handleMoveEnd = () => {
      // Clear any pending update
      if (moveTimeout) clearTimeout(moveTimeout)

      // Wait for animation to settle before updating state
      moveTimeout = setTimeout(() => {
        const bounds = map.getBounds()
        if (bounds) {
          const newBounds = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          }
          setCurrentBounds(newBounds)
          onBoundsChange?.(newBounds)
        }
        setCurrentZoom(map.getZoom())
        onZoomChange?.(map.getZoom())
      }, 150) // Small delay to let animation complete
    }

    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleMoveEnd)

    map.on('error', (e) => {
      console.error('[MapLibreShell] Map error:', e.error?.message || e)
      // Only set error state for critical failures, not tile load failures
      if (e.error?.message?.includes('style') || e.error?.message?.includes('Source')) {
        setError('Failed to load map style')
      }
    })


    return () => {
      if (moveTimeout) clearTimeout(moveTimeout)
      map.remove()
      mapRef.current = null
      setMapInstance(null)
    }
  }, [])

  // Cluster style helper with WCAG AA compliant contrast (uses shared utility)
  const getClusterStyle = (count: number) => {
    // Harvest design system colors with enforced contrast
    if (count >= 50) {
      const bg = '#dc2626' // Red-600 (darker for better contrast)
      return { size: 56, color: bg, textColor: getContrastTextColor(bg) }
    }
    if (count >= 20) {
      const bg = '#c2410c' // Orange-700 (darkened from #f97316 for white text)
      return { size: 48, color: bg, textColor: getContrastTextColor(bg) }
    }
    if (count >= 10) {
      const bg = '#ca8a04' // Yellow-600 (amber tone, needs dark text)
      return { size: 40, color: bg, textColor: getContrastTextColor(bg) }
    }
    if (count >= 5) {
      const bg = '#16a34a' // Green-600
      return { size: 36, color: bg, textColor: getContrastTextColor(bg) }
    }
    const bg = '#0891b2' // Cyan-600
    return { size: 32, color: bg, textColor: getContrastTextColor(bg) }
  }

  // Handle cluster click
  const handleClusterClick = useCallback((clusterId: number, count: number, lng: number, lat: number) => {
    triggerHaptic('medium')
    const map = mapRef.current
    if (!map) return

    // For small clusters, show preview
    if (count <= CLUSTER_ZOOM_THRESHOLDS.PREVIEW_MAX_COUNT) {
      const clusterFarms = getClusterLeaves(clusterId, 100)

      if (clusterFarms.length > 0) {
        setSelectedCluster({
          clusterId,
          position: { lat, lng },
          farms: clusterFarms,
          count: clusterFarms.length
        })
        setShowClusterPreview(true)
        // Keyboard/SR users get no visual cue that the preview opened, so
        // announce the cluster's farm count via the polite live region.
        announce(ANNOUNCEMENTS.clusterExpanded(clusterFarms.length))
        return
      }
    }

    // For larger clusters, zoom in with smooth animation
    const currentZoom = map.getZoom()
    let targetZoom: number

    try {
      const expansionZoom = getClusterExpansionZoom(clusterId)
      // Use expansion zoom but ensure we always zoom in at least 1.5 levels
      targetZoom = Math.max(expansionZoom, currentZoom + 1.5)
    } catch {
      // If cluster ID is stale, just zoom in by 2 levels
      targetZoom = currentZoom + 2
    }

    // Cap at max zoom of 18
    targetZoom = Math.min(targetZoom, 18)

    map.easeTo({
      center: [lng, lat],
      zoom: targetZoom,
      duration: 400,
      easing: (t) => t * (2 - t) // Ease-out quad for smooth deceleration
    })
    // Activating a cluster destroys the focused element (focus falls to body)
    // and the zoom is invisible to SR users, so announce what was expanded.
    announce(ANNOUNCEMENTS.clusterExpanded(count))
  }, [getClusterLeaves, getClusterExpansionZoom, triggerHaptic])

  // Handle marker click
  const handleMarkerClick = useCallback((farm: FarmShop) => {
    triggerHaptic('light')

    if (isDesktop && mapRef.current) {
      const map = mapRef.current
      const point = map.project([farm.location.lng, farm.location.lat])
      setPopoverPosition({ x: point.x, y: point.y })
    }

    setMarkerState({
      selected: farm,
      showActions: true
    })

    onFarmSelect?.(farm.id)
  }, [triggerHaptic, isDesktop, onFarmSelect])

  // Create/update markers when clusters change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Always clear old markers first - even when clusters is empty
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()
    clusterMarkersRef.current.forEach(marker => marker.remove())
    clusterMarkersRef.current.clear()

    // Exit if no clusters to render
    if (!clusters.length) return

    clusters.forEach((item: ClusterOrPoint) => {
      // Validate coordinates before creating marker
      const [lng, lat] = item.geometry.coordinates
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng === 0 && lat === 0) {
        return
      }

      if (isCluster(item)) {
        // It's a cluster
        const clusterId = item.properties.cluster_id
        const count = item.properties.point_count

        const el = document.createElement('div')
        el.className = 'maplibre-cluster-marker'
        el.setAttribute('role', 'button')
        el.setAttribute('tabindex', '0')
        el.setAttribute('aria-label', getClusterMarkerLabel(count))
        // Stable selector so ClusterPreview can return focus here on close.
        el.dataset.clusterId = String(clusterId)

        const { size, color, textColor } = getClusterStyle(count)
        // NO transforms - just basic styling
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${textColor};
          font-weight: 600;
          font-size: ${Math.max(12, size / 3)}px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          pointer-events: auto;
        `
        el.textContent = count > 99 ? '99+' : String(count)

        // Hover uses filter only, no transform
        el.addEventListener('mouseenter', () => {
          el.style.filter = 'brightness(1.1)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.filter = ''
        })
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          e.preventDefault()
          handleClusterClick(clusterId, count, lng, lat)
        })
        // Keyboard activation: Enter or Space to mirror click semantics.
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            handleClusterClick(clusterId, count, lng, lat)
          }
        })
        // Touch handlers - must capture touchstart to prevent map pan
        el.addEventListener('touchstart', (e) => {
          e.stopPropagation()
        }, { passive: true })
        el.addEventListener('touchend', (e) => {
          e.stopPropagation()
          e.preventDefault()
          handleClusterClick(clusterId, count, lng, lat)
        }, { passive: false })

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
          subpixelPositioning: true
        })
          .setLngLat([lng, lat])
          .addTo(map)

        clusterMarkersRef.current.set(`cluster-${clusterId}`, marker)
      } else {
        // It's a single farm point
        const farm = item.properties.farm
        // lng, lat already extracted at top of forEach
        const pinConfig = getPinForFarm(farm.offerings)
        const isOpen = farm.hours ? isFarmOpen(farm.hours) : null
        const markerSize = 36
        const svg = generateStatusMarkerSVG(pinConfig, isOpen, markerSize)

        // Create marker element with precise sizing
        const el = document.createElement('div')
        el.className = `maplibre-farm-marker ${isOpen ? 'is-open' : isOpen === false ? 'is-closed' : ''}`
        el.dataset.farmId = farm.id
        el.dataset.open = isOpen === true ? 'true' : isOpen === false ? 'false' : 'unknown'
        el.setAttribute('role', 'button')
        el.setAttribute('tabindex', '0')
        el.setAttribute('aria-label', getFarmMarkerLabel({
          name: farm.name,
          location: farm.location,
          isOpen: isOpen ?? undefined,
        }))
        // Minimal styling - NO transforms to avoid conflicting with MapLibre positioning
        el.style.cssText = `
          width: ${markerSize}px;
          height: ${markerSize}px;
          cursor: pointer;
          pointer-events: auto;
        `
        el.innerHTML = svg

        // Event handlers - NO transform manipulation to test positioning
        el.addEventListener('mouseenter', () => {
          el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))'
          onFarmHover?.(farm.id)
        })
        el.addEventListener('mouseleave', () => {
          const isHighlighted = el.dataset.highlighted === 'true'
          el.style.filter = isHighlighted ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' : ''
          onFarmHover?.(null)
        })
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          e.preventDefault()
          handleMarkerClick(farm)
        })
        // Keyboard activation: Enter or Space to mirror click semantics.
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            handleMarkerClick(farm)
          }
        })
        // Touch handlers - must capture touchstart to prevent map pan
        el.addEventListener('touchstart', (e) => {
          e.stopPropagation()
        }, { passive: true })
        el.addEventListener('touchend', (e) => {
          e.stopPropagation()
          e.preventDefault()
          handleMarkerClick(farm)
        }, { passive: false })

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
          subpixelPositioning: true  // Prevents marker jump on zoom/move
        })
          .setLngLat([lng, lat])
          .addTo(map)

        markersRef.current.set(farm.id, marker)
      }
    })
  }, [clusters, isCluster, handleClusterClick, handleMarkerClick, onFarmHover])

  // Update marker highlight styles WITHOUT recreating markers - NO transforms
  useEffect(() => {
    markersRef.current.forEach((marker, farmId) => {
      const el = marker.getElement() as HTMLElement
      if (!el || !el.classList.contains('maplibre-farm-marker')) return

      const isHighlighted = selectedFarmId === farmId || hoveredFarmId === farmId
      el.dataset.highlighted = isHighlighted ? 'true' : 'false'

      if (isHighlighted) {
        el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))'
        el.style.zIndex = '1000'
      } else {
        el.style.filter = ''
        el.style.zIndex = ''
      }
    })
  }, [selectedFarmId, hoveredFarmId])

  // Pan to selected farm
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedFarmId) return

    const farm = farms.find(f => f.id === selectedFarmId)
    if (farm?.location) {
      map.flyTo({
        center: [farm.location.lng, farm.location.lat],
        zoom: Math.max(map.getZoom(), 14),
        duration: 500
      })
    }
  }, [selectedFarmId, farms])

  const handleCloseClusterPreview = useCallback(() => {
    setShowClusterPreview(false)
    setSelectedCluster(null)
  }, [])

  const handleZoomToCluster = useCallback((cluster: ClusterData) => {
    const map = mapRef.current
    if (!map) return

    // Create bounds from cluster farms
    const bounds = new maplibregl.LngLatBounds()
    cluster.farms.forEach(farm => {
      bounds.extend([farm.location.lng, farm.location.lat])
    })

    map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 16,
      duration: 500
    })

    setShowClusterPreview(false)
    setSelectedCluster(null)
  }, [])

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Unavailable</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-serum text-black px-4 py-2 rounded-lg font-medium hover:bg-serum/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} relative map-container`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2 z-10 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-ink-muted">Harvesting latest updates...</p>
          </div>
        </div>
      )}

      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{
          touchAction: 'pan-x pan-y pinch-zoom',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          width: '100%',
          height: '100%',
          minHeight: '300px',
          background: '#F2EBDA' // Cream (--paper) so the pre-tile flash is on-brand
        }}
      />

      {/* Map Controls */}
      {mapInstance && (
        <>
          <MapControls
            map={mapInstance}
            position="top-right"
            showZoom={true}
            showFullscreen={true}
            showStyleSwitcher={false}
            showCompass={true}
          />

          <LocationControl
            map={mapInstance}
            position="bottom-right"
            showAccuracy={true}
          />

          <ScaleBar
            map={mapInstance}
            position="bottom-left"
            unit="metric"
          />
        </>
      )}

      {/* Marker preview handled by MarkerPreview in map/page.tsx (mobile + desktop). */}

      {/* Cluster Preview - extracted to ClusterPreview (Slice 2.7) for focus parity */}
      {showClusterPreview && selectedCluster && (
        <ClusterPreview
          clusterId={selectedCluster.clusterId}
          count={selectedCluster.count}
          farms={selectedCluster.farms}
          onClose={handleCloseClusterPreview}
          onSelectFarm={(farm) => {
            handleMarkerClick(farm)
            handleCloseClusterPreview()
          }}
          onViewAll={() => handleZoomToCluster(selectedCluster)}
        />
      )}
    </div>
  )
}
