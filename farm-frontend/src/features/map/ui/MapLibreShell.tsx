'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FarmShop } from '@/types/farm'
import { useClusteredMarkers, type ClusterOrPoint, type FarmCluster } from '../hooks/useClusteredMarkers'
import { useMapLocation } from '../hooks/useMapLocation'
import { getPinForFarm, generateStatusMarkerSVG, isFarmOpen, STATUS_COLORS } from '../lib/pin-icons'
import { CLUSTER_ZOOM_THRESHOLDS } from '../lib/cluster-config'
import { getMapStyle } from '@/lib/map-config'
import MarkerActions from './MarkerActions'
import MapMarkerPopover from './MapMarkerPopover'
import ClusterPreview from './ClusterPreview'
import LocationControl from './LocationControl'
import MapControls from './MapControls'
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

// UK bounds for fallback
const UK_BOUNDS = {
  north: 61.0,
  south: 49.8,
  east: 2.0,
  west: -10.5
}

const UK_CENTER = {
  lat: 54.5,
  lng: -2.0
}

interface MarkerState {
  selected: FarmShop | null
  showActions: boolean
}

interface ClusterData {
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
  center = UK_CENTER,
  zoom = 5,
  className = 'w-full h-full',
  userLocation: externalUserLocation,
  bottomSheetHeight = 200,
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
    { radius: 60, maxZoom: 16 }
  )

  // Use our location hook
  const { state: locationState, centerOnUser } = useMapLocation({
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
    console.log('[MapLibreShell] Using map style:', typeof mapStyle === 'string' ? mapStyle : 'OSM Raster Object')

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [center.lng, center.lat],
      zoom,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
      pitchWithRotate: false,
    })

    // Add attribution control separately
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('load', () => {
      setIsLoading(false)
      setMapInstance(map)
      mapRef.current = map
      onMapLoad?.(map)
      onMapReady?.(map)

      // Fit to UK bounds on initial load
      map.fitBounds(
        [[UK_BOUNDS.west, UK_BOUNDS.south], [UK_BOUNDS.east, UK_BOUNDS.north]],
        { padding: { top: 80, right: 20, bottom: 20, left: 20 }, duration: 0 }
      )
    })

    map.on('moveend', () => {
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
    })

    map.on('error', (e) => {
      console.error('[MapLibreShell] Map error:', e.error?.message || e)
      // Only set error state for critical failures, not tile load failures
      if (e.error?.message?.includes('style') || e.error?.message?.includes('Source')) {
        setError('Failed to load map style')
      }
    })

    // Debug: log when style is loaded
    map.on('styledata', () => {
      console.log('[MapLibreShell] Style loaded successfully')
    })

    // Debug: log tile errors
    map.on('sourcedataerror', (e) => {
      console.warn('[MapLibreShell] Source error:', e.sourceId, e.error)
    })

    return () => {
      map.remove()
      mapRef.current = null
      setMapInstance(null)
    }
  }, [])

  // Cluster style helper
  const getClusterStyle = (count: number) => {
    if (count >= 50) return { size: 56, color: '#ef4444', textColor: 'white' }
    if (count >= 20) return { size: 48, color: '#f97316', textColor: 'white' }
    if (count >= 10) return { size: 40, color: '#eab308', textColor: 'black' }
    if (count >= 5) return { size: 36, color: '#22c55e', textColor: 'white' }
    return { size: 32, color: '#06b6d4', textColor: 'white' }
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
          position: { lat, lng },
          farms: clusterFarms,
          count: clusterFarms.length
        })
        setShowClusterPreview(true)
        return
      }
    }

    // For larger clusters, zoom in
    const expansionZoom = getClusterExpansionZoom(clusterId)
    map.flyTo({
      center: [lng, lat],
      zoom: Math.min(expansionZoom, 16),
      duration: 500
    })
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
    if (!map || !clusters.length) return

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()
    clusterMarkersRef.current.forEach(marker => marker.remove())
    clusterMarkersRef.current.clear()

    clusters.forEach((item: ClusterOrPoint) => {
      if (isCluster(item)) {
        // It's a cluster
        const clusterId = item.properties.cluster_id
        const count = item.properties.point_count
        const [lng, lat] = item.geometry.coordinates

        const el = document.createElement('div')
        el.className = 'maplibre-cluster-marker'

        const { size, color, textColor } = getClusterStyle(count)
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
          transition: transform 0.2s;
        `
        el.textContent = count > 99 ? '99+' : String(count)

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.1)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)'
        })
        el.addEventListener('click', () => handleClusterClick(clusterId, count, lng, lat))

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map)

        clusterMarkersRef.current.set(`cluster-${clusterId}`, marker)
      } else {
        // It's a single farm point
        const farm = item.properties.farm
        const [lng, lat] = item.geometry.coordinates
        const pinConfig = getPinForFarm(farm.offerings)
        const isOpen = farm.hours ? isFarmOpen(farm.hours) : null
        const svg = generateStatusMarkerSVG(pinConfig, isOpen, 36)

        const el = document.createElement('div')
        el.className = `maplibre-farm-marker ${isOpen ? 'is-open' : isOpen === false ? 'is-closed' : ''}`
        el.innerHTML = svg
        el.style.cursor = 'pointer'
        el.style.transition = 'transform 0.2s, filter 0.2s'
        el.dataset.farmId = farm.id

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)'
          el.style.filter = 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))'
          onFarmHover?.(farm.id)
        })
        el.addEventListener('mouseleave', () => {
          const isHighlighted = selectedFarmId === farm.id || hoveredFarmId === farm.id
          el.style.transform = isHighlighted ? 'scale(1.2)' : 'scale(1)'
          el.style.filter = isHighlighted ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' : 'none'
          onFarmHover?.(null)
        })
        el.addEventListener('click', () => handleMarkerClick(farm))

        // Highlight selected or hovered marker
        const isHighlighted = selectedFarmId === farm.id || hoveredFarmId === farm.id
        if (isHighlighted) {
          el.style.transform = 'scale(1.2)'
          el.style.filter = 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))'
          el.style.zIndex = '1000'
        }

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map)

        markersRef.current.set(farm.id, marker)
      }
    })
  }, [clusters, selectedFarmId, hoveredFarmId, isCluster, handleClusterClick, handleMarkerClick, onFarmHover])

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

  // Action handlers
  const handleNavigate = useCallback((farm: FarmShop) => {
    const url = `https://maps.google.com/maps?q=${farm.location.lat},${farm.location.lng}`
    window.open(url, '_blank')
    setMarkerState({ selected: null, showActions: false })
  }, [])

  const handleFavorite = useCallback((farmId: string) => {
    triggerHaptic('medium')
    // TODO: Implement favorites
  }, [triggerHaptic])

  const handleShare = useCallback((farm: FarmShop) => {
    if (navigator.share) {
      navigator.share({
        title: farm.name,
        text: `Check out ${farm.name} at ${farm.location.address}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(`${farm.name} - ${farm.location.address}`)
    }
    setMarkerState({ selected: null, showActions: false })
  }, [])

  const handleCloseMarkerActions = useCallback(() => {
    setMarkerState({ selected: null, showActions: false })
  }, [])

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

  const handleShowAllFarms = useCallback((clusterFarms: FarmShop[]) => {
    // TODO: Implement list view
    setShowClusterPreview(false)
    setSelectedCluster(null)
  }, [])

  // Merge external and internal location
  const effectiveUserLocation = externalUserLocation || (locationState.lat && locationState.lng ? {
    latitude: locationState.lat,
    longitude: locationState.lng,
    accuracy: locationState.accuracy || 0,
    timestamp: locationState.lastUpdated || Date.now()
  } : null)

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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-serum mx-auto mb-2" />
            <p className="text-sm text-gray-600">Harvesting latest updates...</p>
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
          background: '#e5e7eb' // Light gray fallback while loading
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

      {/* Marker Actions - Mobile Only */}
      {!isDesktop && (
        <MarkerActions
          farm={markerState.selected}
          isVisible={markerState.showActions}
          onClose={handleCloseMarkerActions}
          onNavigate={handleNavigate}
          onFavorite={handleFavorite}
          onShare={handleShare}
          userLocation={effectiveUserLocation ? {
            latitude: effectiveUserLocation.latitude,
            longitude: effectiveUserLocation.longitude
          } : null}
          isDesktop={isDesktop}
        />
      )}

      {/* Marker Popover - Desktop Only */}
      {isDesktop && (
        <MapMarkerPopover
          farm={markerState.selected}
          isVisible={markerState.showActions}
          onClose={handleCloseMarkerActions}
          onNavigate={handleNavigate}
          onFavorite={handleFavorite}
          onShare={handleShare}
          userLocation={effectiveUserLocation ? {
            latitude: effectiveUserLocation.latitude,
            longitude: effectiveUserLocation.longitude
          } : null}
          position={popoverPosition}
        />
      )}

      {/* Cluster Preview - simplified without Google Maps types */}
      {showClusterPreview && selectedCluster && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              {selectedCluster.count} farms nearby
            </h3>
            <button
              onClick={handleCloseClusterPreview}
              className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedCluster.farms.slice(0, 5).map(farm => (
              <button
                key={farm.id}
                onClick={() => {
                  handleMarkerClick(farm)
                  handleCloseClusterPreview()
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="font-medium text-sm text-zinc-900 dark:text-white">{farm.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{farm.location.city || farm.location.county}</div>
              </button>
            ))}
          </div>
          {selectedCluster.farms.length > 5 && (
            <button
              onClick={() => handleZoomToCluster(selectedCluster)}
              className="w-full mt-3 py-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700"
            >
              View all {selectedCluster.count} farms
            </button>
          )}
        </div>
      )}
    </div>
  )
}
