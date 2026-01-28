'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { FarmShop } from '@/types/farm'
import { getPinForFarm } from '../lib/pin-icons'
import MarkerActions from './MarkerActions'
import MapMarkerPopover from './MapMarkerPopover'

// Leaflet imports - client-side only
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

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

interface LeafletShellProps {
  farms: FarmShop[]
  selectedFarmId?: string | null
  onFarmSelect?: (farmId: string) => void
  onMapLoad?: (map: L.Map) => void
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
  onZoomChange?: (zoom: number) => void
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  userLocation?: UserLocation | null
  bottomSheetHeight?: number
  isDesktop?: boolean
  onMapReady?: (map: L.Map) => void
}

// UK bounds
const UK_BOUNDS: L.LatLngBoundsExpression = [[49.8, -10.5], [61.0, 2.0]]
const UK_CENTER: L.LatLngExpression = [54.5, -2.0]

interface MarkerState {
  selected: FarmShop | null
  showActions: boolean
}

// Fix Leaflet default icon paths
const fixLeafletIcons = () => {
  // Only run on client
  if (typeof window === 'undefined') return

  // Fix default marker icon
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

// Create custom category icon
const createCategoryIcon = (color: string, size: number = 32) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: 'leaflet-farm-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  })
}

// Create cluster icon
const createClusterIcon = (count: number) => {
  let size = 32
  let color = '#06b6d4' // cyan

  if (count >= 50) {
    size = 56
    color = '#ef4444' // red
  } else if (count >= 20) {
    size = 48
    color = '#f97316' // orange
  } else if (count >= 10) {
    size = 40
    color = '#eab308' // yellow
  } else if (count >= 5) {
    size = 36
    color = '#22c55e' // green
  }

  const displayCount = count > 99 ? '99+' : String(count)
  const textColor = count >= 10 && count < 20 ? 'black' : 'white'

  return L.divIcon({
    html: `<div style="
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
    ">${displayCount}</div>`,
    className: 'leaflet-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

/**
 * LeafletShell - Leaflet-based map component
 *
 * A reliable, lightweight alternative to MapLibre GL.
 * Features:
 * - MarkerCluster for efficient clustering
 * - Category-based pin icons
 * - User location tracking
 * - Mobile bottom sheet / Desktop popover interactions
 */
export default function LeafletShell({
  farms,
  selectedFarmId,
  onFarmSelect,
  onMapLoad,
  onBoundsChange,
  onZoomChange,
  center = { lat: UK_CENTER[0] as number, lng: UK_CENTER[1] as number },
  zoom = 5,
  className = 'w-full h-full',
  userLocation: externalUserLocation,
  bottomSheetHeight = 200,
  isDesktop = false,
  onMapReady
}: LeafletShellProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)

  const [markerState, setMarkerState] = useState<MarkerState>({
    selected: null,
    showActions: false
  })
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 })

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 }
      navigator.vibrate(patterns[type])
    }
  }, [])

  // Handle marker click
  const handleMarkerClick = useCallback((farm: FarmShop, e?: L.LeafletMouseEvent) => {
    triggerHaptic('light')

    if (isDesktop && e) {
      setPopoverPosition({ x: e.containerPoint.x, y: e.containerPoint.y })
    }

    setMarkerState({
      selected: farm,
      showActions: true
    })

    onFarmSelect?.(farm.id)
  }, [triggerHaptic, isDesktop, onFarmSelect])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    fixLeafletIcons()

    try {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false, // We'll add custom controls
        attributionControl: true
      })

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map)

      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map)

      // Add scale control
      L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map)

      // Create marker cluster group
      const clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 17,
        iconCreateFunction: (cluster) => createClusterIcon(cluster.getChildCount())
      })
      map.addLayer(clusterGroup)
      clusterGroupRef.current = clusterGroup

      // Fit to UK bounds
      map.fitBounds(UK_BOUNDS, { padding: [20, 20] })

      // Event handlers
      map.on('moveend', () => {
        const bounds = map.getBounds()
        const newBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        }
        onBoundsChange?.(newBounds)
      })

      map.on('zoomend', () => {
        onZoomChange?.(map.getZoom())
      })

      mapRef.current = map
      setMapInstance(map)
      setIsLoading(false)
      onMapLoad?.(map)
      onMapReady?.(map)

      console.log('[LeafletShell] Map initialized successfully')

    } catch (err) {
      console.error('[LeafletShell] Failed to initialize map:', err)
      setError('Failed to load map')
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        setMapInstance(null)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when farms change
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current
    if (!clusterGroup || !mapRef.current) return

    // Clear existing markers
    clusterGroup.clearLayers()

    // Add farm markers
    farms.forEach(farm => {
      const pinConfig = getPinForFarm(farm.offerings)
      const icon = createCategoryIcon(pinConfig.color)

      const marker = L.marker([farm.location.lat, farm.location.lng], { icon })

      // Store farm data on marker
      ;(marker as unknown as { farmData: FarmShop }).farmData = farm

      marker.on('click', (e) => {
        handleMarkerClick(farm, e)
      })

      // Highlight selected marker
      if (selectedFarmId === farm.id) {
        marker.setZIndexOffset(1000)
      }

      clusterGroup.addLayer(marker)
    })

    console.log(`[LeafletShell] Added ${farms.length} markers`)
  }, [farms, selectedFarmId, handleMarkerClick])

  // Pan to selected farm
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedFarmId) return

    const farm = farms.find(f => f.id === selectedFarmId)
    if (farm?.location) {
      map.flyTo([farm.location.lat, farm.location.lng], Math.max(map.getZoom(), 14), {
        duration: 0.5
      })
    }
  }, [selectedFarmId, farms])

  // User location marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (externalUserLocation) {
      const { latitude, longitude, accuracy } = externalUserLocation

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([latitude, longitude])
      } else {
        const userIcon = L.divIcon({
          html: `<div style="
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>`,
          className: 'leaflet-user-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })

        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(map)

        // Add accuracy circle
        if (accuracy) {
          L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1
          }).addTo(map)
        }
      }
    }
  }, [externalUserLocation])

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
    <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-serum mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '300px',
          background: '#e5e7eb'
        }}
      />

      {/* Marker Actions - Mobile Only */}
      {!isDesktop && (
        <MarkerActions
          farm={markerState.selected}
          isVisible={markerState.showActions}
          onClose={handleCloseMarkerActions}
          onNavigate={handleNavigate}
          onFavorite={handleFavorite}
          onShare={handleShare}
          userLocation={externalUserLocation ? {
            latitude: externalUserLocation.latitude,
            longitude: externalUserLocation.longitude
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
          userLocation={externalUserLocation ? {
            latitude: externalUserLocation.latitude,
            longitude: externalUserLocation.longitude
          } : null}
          position={popoverPosition}
        />
      )}
    </div>
  )
}
