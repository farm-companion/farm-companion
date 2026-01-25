'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogle } from '@/lib/googleMaps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { Map } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import type { ClusterClickEvent, MarkerState, FarmMarkerExtended, WindowWithMapUtils, ClusterData } from '@/types/map'
import { createSmartClusterRenderer, getClusterTargetZoom, CLUSTER_ZOOM_THRESHOLDS } from '../lib/cluster-config'
import MarkerActions from './MarkerActions'
import MapMarkerPopover from './MapMarkerPopover'
import ClusterPreview from './ClusterPreview'

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

interface MapShellProps {
  farms: FarmShop[]
  selectedFarmId?: string | null
  onFarmSelect?: (farmId: string) => void
  onMapLoad?: (map: google.maps.Map) => void
  onBoundsChange?: (bounds: google.maps.LatLngBounds) => void
  onZoomChange?: (zoom: number) => void
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  userLocation?: UserLocation | null
  bottomSheetHeight?: number
  isDesktop?: boolean
  onMapReady?: (map: google.maps.Map) => void
}

// Cluster rendering now handled by createSmartClusterRenderer from cluster-config.ts
// 5-tier hierarchy: mega (50+), large (20+), medium (10+), small (5+), tiny (2+)

// UK bounds for fallback (including Ireland)
const UK_BOUNDS = {
  north: 61.0,  // Slightly more north to include northern Scotland
  south: 49.8,  // Slightly more south to include southern England
  east: 2.0,    // Slightly more east to include eastern England
  west: -10.5   // More west to include all of Ireland
}

const UK_CENTER = {
  lat: 54.5,  // Centered vertically for better visual balance
  lng: -2.0   // Centered horizontally, slightly west for better UK focus
}

export default function MapShell({
  farms,
  selectedFarmId,
  onFarmSelect,
  onMapLoad,
  onBoundsChange,
  onZoomChange,
  center = UK_CENTER,
  zoom = 5, // Optimal zoom for UK overview and cluster visibility
  className = 'w-full h-full',
  userLocation,
  bottomSheetHeight = 200,
  isDesktop = false,
  onMapReady
}: MapShellProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Record<string, google.maps.Marker>>({})
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const userLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markerState, setMarkerState] = useState<MarkerState>({
    selected: null,
    showActions: false
  })

  const [selectedCluster, setSelectedCluster] = useState<{ position: google.maps.LatLng; markers: google.maps.Marker[]; count: number } | null>(null)
  const [showClusterPreview, setShowClusterPreview] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Add haptic feedback for native-like feel
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,      // Quick tap
        medium: 20,     // Selection
        heavy: 30       // Important action
      }
      navigator.vibrate(patterns[type])
    }
  }, [])

  // Smart zoom to cluster with optimal zoom level (uses cluster-config)
  const handleZoomToCluster = useCallback((cluster: ClusterData) => {
    const map = mapInstanceRef.current
    if (!map || !cluster || !cluster.markers?.length) return

    const count = cluster.count
    const targetZoom = getClusterTargetZoom(count)

    const bounds = new google.maps.LatLngBounds()
    cluster.markers.forEach((marker: google.maps.Marker) => {
      if (marker && typeof marker.getPosition === 'function') {
        const pos = marker.getPosition()
        if (pos) bounds.extend(pos)
      }
    })

    const padding = Math.min(count * 2, 100)
    bounds.extend(new google.maps.LatLng(
      bounds.getNorthEast().lat() + (padding * 0.0001),
      bounds.getNorthEast().lng() + (padding * 0.0001)
    ))
    bounds.extend(new google.maps.LatLng(
      bounds.getSouthWest().lat() - (padding * 0.0001),
      bounds.getSouthWest().lng() - (padding * 0.0001)
    ))

    map.fitBounds(bounds, padding)
    setTimeout(() => {
      map.setZoom(Math.min(map.getZoom() || targetZoom, targetZoom))
    }, 300)
  }, [])

  // Enhanced cluster click with preview and smart zoom
  const handleClusterClick = useCallback((event: ClusterClickEvent) => {
    if (!event || !event.latLng) {
      return false
    }

    triggerHaptic('medium')

    const markers = event.markers || []
    const markerCount = markers.length

    // For small clusters, show preview sheet (threshold from cluster-config)
    if (markerCount > 0 && markerCount <= CLUSTER_ZOOM_THRESHOLDS.PREVIEW_MAX_COUNT) {
      const farms: FarmShop[] = []
      markers.forEach(marker => {
        const farmMarker = marker as FarmMarkerExtended
        if (farmMarker.farmData) {
          farms.push(farmMarker.farmData)
        }
      })

      if (farms.length > 0) {
        setSelectedCluster({
          position: event.latLng,
          markers,
          count: farms.length
        })
        setShowClusterPreview(true)
        return false
      }
    }

    // For larger clusters or when markers not available, zoom in
    const map = mapInstanceRef.current
    if (map) {
      if (markerCount > 0) {
        handleZoomToCluster({ count: markerCount, markers })
      } else {
        const currentZoom = map.getZoom() || 10
        const targetZoom = Math.min(currentZoom + 2, 16)
        map.panTo(event.latLng)
        map.setZoom(targetZoom)
      }
    }

    return false
  }, [triggerHaptic, handleZoomToCluster])

  // Show all farms in cluster as list
  const handleShowAllFarms = useCallback((farms: FarmShop[]) => {
    // TODO: Implement list view or filter to show only these farms

    // For now, just close the preview
    setShowClusterPreview(false)
    setSelectedCluster(null)
  }, [])

  // Store the latest onFarmSelect in a ref to avoid dependency issues
  const onFarmSelectRef = useRef(onFarmSelect)
  useEffect(() => {
    onFarmSelectRef.current = onFarmSelect
  }, [onFarmSelect])

  // Enhanced marker click with haptics and actions
  const handleMarkerClick = useCallback((farm: FarmShop, marker: google.maps.Marker) => {
    triggerHaptic('light')

    // Calculate screen position for desktop popover
    if (isDesktop) {
      const map = mapInstanceRef.current
      const position = marker.getPosition()
      if (map && position) {
        const projection = map.getProjection()
        if (projection) {
          const point = projection.fromLatLngToPoint(position)
          const scale = Math.pow(2, map.getZoom() || 10)
          const bounds = map.getBounds()
          if (point && bounds) {
            const ne = projection.fromLatLngToPoint(bounds.getNorthEast())
            const sw = projection.fromLatLngToPoint(bounds.getSouthWest())
            if (ne && sw) {
              const mapDiv = mapRef.current
              if (mapDiv) {
                const worldWidth = mapDiv.offsetWidth
                const worldHeight = mapDiv.offsetHeight
                const x = ((point.x - sw.x) / (ne.x - sw.x)) * worldWidth
                const y = ((point.y - ne.y) / (sw.y - ne.y)) * worldHeight
                setPopoverPosition({ x, y })
              }
            }
          }
        }
      }
    }

    setMarkerState({
      selected: farm,
      showActions: true
    })

    onFarmSelectRef.current?.(farm.id)
  }, [triggerHaptic, isDesktop])

  // Marker action handlers
  const handleNavigate = useCallback((farm: FarmShop) => {
    // Open in default maps app
    const url = `https://maps.google.com/maps?q=${farm.location.lat},${farm.location.lng}`
    window.open(url, '_blank')
    setMarkerState({ selected: null, showActions: false })
  }, [])

  const handleFavorite = useCallback((farmId: string) => {
    // TODO: Implement favorites system
    triggerHaptic('medium')
  }, [triggerHaptic])

  const handleShare = useCallback((farm: FarmShop) => {
    if (navigator.share) {
      navigator.share({
        title: farm.name,
        text: `Check out ${farm.name} at ${farm.location.address}`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
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

  // Flicker prevention refs
  const hasInit = useRef(false)
  const hasFitted = useRef(false)

  const lastPadding = useRef<string>('')
  const programmaticMove = useRef(false)

  const idsKey = useRef<string>('')

  // Stable cluster renderer instance (avoid recreating per render)
  const clusterRenderer = useRef<{ render: (args: { count: number; position: google.maps.LatLng }) => google.maps.Marker } | null>(null)

  // top-level refs
  const farmsRef = useRef<FarmShop[]>([])
  const rebuildTimer = useRef<number | null>(null)

  // Create clustered markers for farms
  const createMarkers = useCallback((map: google.maps.Map, farmData: FarmShop[]) => {
    if (!map || !farmData.length || typeof window === 'undefined') {
      return
    }

    // Clear existing markers and clusterer
    Object.values(markersRef.current).forEach(marker => marker.setMap(null))
    markersRef.current = {}
    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
    }

    // Build markers (but don't add to map one-by-one)
    const markers: google.maps.Marker[] = []

    farmData.forEach(farm => {
      if (!farm.location?.lat || !farm.location?.lng) return

      const marker = new google.maps.Marker({
        position: { lat: farm.location.lat, lng: farm.location.lng },
        title: farm.name,
        icon: {
          url: `data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#00C2B2" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="16" r="5" fill="white"/>
            </svg>`
          )}`,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
        optimized: true,
        zIndex: google.maps.Marker.MAX_ZINDEX, // Default z-index for all markers
      })

      // Attach farm data to marker for ClusterPreview access
      ;(marker as FarmMarkerExtended).farmData = farm

      marker.addListener('click', () => {
        handleMarkerClick(farm, marker)
      })

      // Add marker to map first, then to clusterer
      marker.setMap(map)

      markersRef.current[farm.id] = marker
      markers.push(marker)
    })

    // Create/update clusterer with smart zoom-aware renderer
    if (!clustererRef.current) {
      // Create stable renderer instance once using smart cluster config
      if (!clusterRenderer.current) {
        clusterRenderer.current = createSmartClusterRenderer(() => map.getZoom() || 10)
      }

      clustererRef.current = new MarkerClusterer({
        map,
        markers: [],
        renderer: clusterRenderer.current,
        onClusterClick: handleClusterClick
      })
    }

    clustererRef.current.addMarkers(markers)

    // Cluster click handling is now done via onClusterClick option in MarkerClusterer
    // This provides better zoom behavior and prevents duplicate handlers

    // Smart landing strategy: UK overview first, then offer location-based zoom
    if (markers.length > 0 && !selectedFarmId && !hasFitted.current) {
      // Step 1: Show UK overview with optimal zoom for cluster visibility
      const ukBounds = new google.maps.LatLngBounds(
        { lat: UK_BOUNDS.south, lng: UK_BOUNDS.west }, // southwest
        { lat: UK_BOUNDS.north, lng: UK_BOUNDS.east }   // northeast
      )

      programmaticMove.current = true

      // Fit UK bounds with padding for better visual balance
      map.fitBounds(ukBounds, {
        top: 80,    // Extra top padding for search bar
        right: 20,
        bottom: 20,
        left: 20
      })

      // Set optimal zoom level for cluster visibility (not too close, not too far)
      setTimeout(() => {
        const currentZoom = map.getZoom() || 5
        const optimalZoom = Math.min(Math.max(currentZoom, 4), 6) // Between zoom 4-6 for better overview

        if (currentZoom !== optimalZoom) {
          map.setZoom(optimalZoom)
        }

        // Step 2: Offer location-based zoom if user has location
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          // Show a subtle hint that they can zoom to their location
          // The LocationTracker component will handle the actual zoom action
        }

        programmaticMove.current = false
      }, 300)
      
      hasFitted.current = true
    }
  }, [selectedFarmId, handleClusterClick])

  // one function to (debounced) rebuild markers with the latest farms
  const scheduleMarkerRebuild = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // stable key to avoid unnecessary rebuilds
    const nextKey = farmsRef.current.map(f => f.id).sort().join('|')
    if (nextKey === idsKey.current) return
    idsKey.current = nextKey

    if (rebuildTimer.current) window.clearTimeout(rebuildTimer.current)
    rebuildTimer.current = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(
          () => createMarkers(map, farmsRef.current),
          { timeout: 120 }
        )
      } else {
        // fallback
        createMarkers(map, farmsRef.current)
      }
    }, 0)
  }, [createMarkers])

  // Idle-based bounds listener (much calmer than bounds_changed)
  const attachBoundsListener = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map || !onBoundsChange) return

    map.addListener('idle', () => {
      if (programmaticMove.current) return
      const b = map.getBounds()
      if (b) onBoundsChange(b)
    })
  }, [onBoundsChange])

  // Enhanced camera control functions
  const safePanTo = useCallback((pos: google.maps.LatLng | google.maps.LatLngLiteral) => {
    const m = mapInstanceRef.current
    if (!m) return
    programmaticMove.current = true
    m.panTo(pos)
    window.setTimeout(() => { programmaticMove.current = false }, 200)
  }, [])

  // Smart zoom to UK overview
  const zoomToUKOverview = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    
    programmaticMove.current = true
    
    const ukBounds = new google.maps.LatLngBounds(
      { lat: UK_BOUNDS.south, lng: UK_BOUNDS.west },
      { lat: UK_BOUNDS.north, lng: UK_BOUNDS.east }
    )
    
    map.fitBounds(ukBounds, {
      top: 80,
      right: 20,
      bottom: 20,
      left: 20
    })
    
    setTimeout(() => {
      map.setZoom(5) // Optimal cluster visibility for UK overview
      programmaticMove.current = false
    }, 300)
  }, [])

  // Smart zoom to user's area (if location available)
  const zoomToUserArea = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map || !userLocation?.latitude || !userLocation?.longitude) return
    
    programmaticMove.current = true
    
    // Zoom to user's area with optimal zoom for local discovery
    const userPos = { lat: userLocation.latitude, lng: userLocation.longitude }
    map.panTo(userPos)
    
    setTimeout(() => {
      map.setZoom(12) // Good zoom for local area discovery
      programmaticMove.current = false
    }, 300)
  }, [userLocation])

  // keep farmsRef always fresh and schedule rebuilds when farms change
  useEffect(() => {
    farmsRef.current = farms
    // also schedule a rebuild when farms actually change
    scheduleMarkerRebuild()
  }, [farms, scheduleMarkerRebuild])

  // Debounced padding updates
  const applyResponsivePadding = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    
    const pad = {
      top: 60,
      left: 8,
      right: isDesktop ? 384 : 8,
      bottom: isDesktop ? 0 : bottomSheetHeight // No bottom padding on desktop
    }
    
    const key = `${pad.top}|${pad.right}|${pad.bottom}|${pad.left}`
    if (key === lastPadding.current) return
    
    lastPadding.current = key
    // Apply real padding that actually moves the camera
    map.set('padding', pad)
  }, [bottomSheetHeight, isDesktop])

  // Create map once (guard StrictMode)
  useEffect(() => {
    if (hasInit.current || !mapRef.current) return
    hasInit.current = true

    loadGoogle().then(() => {
      if (!mapRef.current) {
        console.error('Map ref not available')
        return
      }
      if (mapInstanceRef.current) {
        return // double-guard
      }

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapId: 'f907b7cb594ed2caa752543d',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'cooperative', // Better touch and scroll handling
        clickableIcons: true,
        keyboardShortcuts: false,
        // Enhanced mobile experience
        zoomControl: true,
        zoomControlOptions: { 
          position: google.maps.ControlPosition.RIGHT_TOP 
        },
        // Better touch handling
        draggable: true,
        scrollwheel: true, // Enable scroll wheel zoom for all devices
        // Performance optimizations
        maxZoom: 20,
        minZoom: 3  // Allow wider view to show UK and Ireland
      })

      // Set calmer initial camera & real padding
      map.setOptions({
        minZoom: 3,  // Allow wider view to show UK and Ireland
        maxZoom: 18,
      })
      
      // Apply real padding that actually moves the camera
      map.set('padding', { 
        top: 60, 
        right: isDesktop ? 384 : 8, 
        bottom: isDesktop ? 0 : bottomSheetHeight, // No bottom padding on desktop
        left: 8 
      })

      mapInstanceRef.current = map
      setIsLoading(false)
      onMapLoad?.(map)
      onMapReady?.(map)
      applyResponsivePadding() // set initial padding
      
      // Add custom camera control button for better UX
      const cameraControlDiv = document.createElement('div')
      cameraControlDiv.innerHTML = `
        <div style="
          background: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          margin: 10px;
          padding: 8px;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s;
        " 
        onmouseover="this.style.background='#f8f9fa'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
        onmouseout="this.style.background='white'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.1)'"
        onclick="window.zoomToUKOverview && window.zoomToUKOverview()"
        title="Reset to UK Overview"
        >
          <Map className="w-4 h-4" /> UK
        </div>
      `
      
      // Make the function globally accessible for the onclick
      ;(window as WindowWithMapUtils).zoomToUKOverview = zoomToUKOverview
      
      // Add to map controls
      map.controls[google.maps.ControlPosition.LEFT_TOP].push(cameraControlDiv)
      
      // attach listeners AFTER init
      attachBoundsListener()
      
      // Add idle listener for marker rebuilding (triggers when map stops moving)
      const idleListener = map.addListener('idle', scheduleMarkerRebuild)
      map.set('idleListener', idleListener)
      
      // Add zoom change listener to update clusters
      const zoomListener = map.addListener('zoom_changed', () => {
        // Force cluster recalculation on zoom changes
        if (clustererRef.current) {
          // Trigger a marker rebuild to update clusters
          scheduleMarkerRebuild()
        }
      })
      map.set('zoomListener', zoomListener)
      
      // kick an initial build too
      scheduleMarkerRebuild()
      
      // Add subtle welcome animation for first-time users
      setTimeout(() => {
        if (map && !localStorage.getItem('map-welcome-shown')) {
          // Show a subtle welcome hint
          const welcomeDiv = document.createElement('div')
          welcomeDiv.innerHTML = `
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(0, 194, 178, 0.9);
              color: white;
              padding: 12px 20px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              z-index: 1000;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
              animation: fadeInOut 3s ease-in-out;
            ">
              <Map className="w-4 h-4 inline mr-1" /> Explore farm shops across the UK
            </div>
          `
          
          // Add CSS animation
          const style = document.createElement('style')
          style.textContent = `
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
              20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }
          `
          document.head.appendChild(style)
          
          map.controls[google.maps.ControlPosition.TOP_CENTER].push(welcomeDiv)
          
          // Remove after animation
          setTimeout(() => {
            if (welcomeDiv.parentNode) {
              welcomeDiv.parentNode.removeChild(welcomeDiv)
            }
          }, 3000)
          
          // Mark as shown
          localStorage.setItem('map-welcome-shown', 'true')
        }
      }, 1000)
      
      // Enhanced touch handling for iPhone Safari
      const mapElement = mapRef.current
      if (mapElement) {
        // Prevent default touch behaviors that might interfere with map gestures
        mapElement.addEventListener('touchstart', (e) => {
          // Allow map to handle touch events
          e.stopPropagation()
        }, { passive: false })
        
        mapElement.addEventListener('touchmove', (e) => {
          // Allow map to handle touch events
          e.stopPropagation()
        }, { passive: false })
      }
      
    }).catch((err: Error) => {
      if (process.env.NEXT_PUBLIC_DEBUG_MAP === 'true') {
        console.error('Failed to load Google Maps:', err)
      }

      // Handle specific error types
      if (err.message?.includes('OverQuotaMapError')) {
        setError('Map service temporarily unavailable. Please try again later.')
      } else if (err.message?.includes('Out of memory') || err.message?.includes('WebAssembly')) {
        setError('Map requires more memory than available. Please close other tabs and try again.')
      } else {
        setError('Failed to load map')
      }
    })
  }, []) // ← no deps

  // Debounced padding updates
  useEffect(() => {
    const t = setTimeout(applyResponsivePadding, 50)
    return () => clearTimeout(t)
  }, [applyResponsivePadding])

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || typeof window === 'undefined') return

    const map = mapInstanceRef.current
    const position = new google.maps.LatLng(userLocation.latitude, userLocation.longitude)

    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      // Handle both AdvancedMarkerElement and regular Marker
      if ('map' in userLocationMarkerRef.current) {
        userLocationMarkerRef.current.map = null
      } else if ('setMap' in userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null)
      }
    }

    // Create user location marker element
    const userLocationElement = document.createElement('div')
    userLocationElement.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `

    // Use AdvancedMarkerElement if available, fallback to regular Marker
    try {
      if (google.maps.marker?.AdvancedMarkerElement) {
        userLocationMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          position,
          map,
          content: userLocationElement,
          title: 'Your Location',
        })
      } else {
        // Fallback to regular marker if AdvancedMarkerElement not available
        userLocationMarkerRef.current = new google.maps.Marker({
          position,
          map,
          icon: {
            url: `data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>`
            )}`,
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          },
          title: 'Your Location',
        })
      }
    } catch (error) {
      if (process.env.NEXT_PUBLIC_DEBUG_MAP === 'true') {
        console.warn('AdvancedMarkerElement not available, using fallback:', error)
      }
      // Fallback to regular marker
      userLocationMarkerRef.current = new google.maps.Marker({
        position,
        map,
        icon: {
          url: `data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>`
          )}`,
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12),
        },
        title: 'Your Location',
      })
    }

    // Add accuracy circle
    const accuracyCircle = new google.maps.Circle({
      strokeColor: '#3B82F6',
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      map,
      center: position,
      radius: userLocation.accuracy
    })

    return () => {
      if (userLocationMarkerRef.current) {
        // Handle both AdvancedMarkerElement and regular Marker
        if ('map' in userLocationMarkerRef.current) {
          userLocationMarkerRef.current.map = null
        } else if ('setMap' in userLocationMarkerRef.current) {
          userLocationMarkerRef.current.setMap(null)
        }
      }
      accuracyCircle.setMap(null)
    }
  }, [userLocation])

  // Pan to selected farm
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Reset z-index of all markers to default
    Object.values(markersRef.current).forEach(marker => {
      marker.setZIndex(google.maps.Marker.MAX_ZINDEX)
    })

    // If no farm is selected, just reset z-index and return
    if (!selectedFarmId) return

    const marker = markersRef.current[selectedFarmId]
    if (marker) {
      // Boost z-index so selected marker floats above clusters
      marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1)
      
      const position = marker.getPosition()
      if (position) {
        safePanTo(position)
        mapInstanceRef.current.setZoom(Math.max(mapInstanceRef.current.getZoom() || 10, 14))
      }
    }
  }, [selectedFarmId, safePanTo])

  // Resize observer for map container changes
  useEffect(() => {
    if (!mapRef.current || !mapInstanceRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        try {
          google.maps.event.trigger(mapInstanceRef.current, 'resize')
        } catch (err) {
          if (process.env.NEXT_PUBLIC_DEBUG_MAP === 'true') {
            console.warn('Error triggering map resize:', err)
          }
        }
      }
    })

    // Only observe if element exists and is valid
    if (mapRef.current && mapRef.current instanceof Element) {
      resizeObserver.observe(mapRef.current)
    }

    if (mapRef.current?.parentElement && mapRef.current.parentElement instanceof Element) {
      resizeObserver.observe(mapRef.current.parentElement)
    }

    return () => {
      try {
        resizeObserver.disconnect()
      } catch (err) {
        // Silently handle cleanup errors
      }
    }
  }, [])

  // Orientation change handler for iOS
  useEffect(() => {
    const onResize = () => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize')
      }
      scheduleMarkerRebuild()
    }
    
    window.addEventListener('orientationchange', onResize)
    return () => window.removeEventListener('orientationchange', onResize)
  }, [scheduleMarkerRebuild])

  // Zoom change hook for parent state updates
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !onZoomChange) return
    const l = map.addListener('zoom_changed', () => onZoomChange(map.getZoom() ?? 0))
    return () => google.maps.event.removeListener(l)
  }, [onZoomChange])

  // Map padding update handler (bottom sheet + desktop rail)
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<number>
      const pad = {
        top: 60,
        left: 8,
        right: window.matchMedia('(min-width:768px)').matches ? 384 : 8,
        bottom: customEvent.detail
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.set('padding', pad)
      }
    }
    window.addEventListener('map:setBottomPadding', handler)
    return () => window.removeEventListener('map:setBottomPadding', handler)
  }, [])

  // Clean teardown (prevents memory churn → flicker)
  useEffect(() => {
    return () => {
      const map = mapInstanceRef.current
      if (map) {
        // Remove idle listener specifically
        const idleListener = map.get('idleListener')
        if (idleListener) {
          google.maps.event.removeListener(idleListener)
        }
        google.maps.event.clearInstanceListeners(map)
      }
      
      // Clear clusterer with belt-and-braces cleanup
      if (clustererRef.current) {
        google.maps.event.clearInstanceListeners(clustererRef.current)
        clustererRef.current.clearMarkers()
        clustererRef.current = null
      }
      
      // Clear regular markers with listener cleanup
      Object.values(markersRef.current).forEach(marker => {
        google.maps.event.clearInstanceListeners(marker)
        marker.setMap(null)
      })
      markersRef.current = {}
      
      // Clear user location marker with listener cleanup
      if (userLocationMarkerRef.current) {
        google.maps.event.clearInstanceListeners(userLocationMarkerRef.current)
        // Handle both AdvancedMarkerElement and regular Marker
        if ('map' in userLocationMarkerRef.current) {
          userLocationMarkerRef.current.map = null
        } else if ('setMap' in userLocationMarkerRef.current) {
          userLocationMarkerRef.current.setMap(null)
        }
        userLocationMarkerRef.current = null
      }
      
      // Clear rebuild timer
      if (rebuildTimer.current) {
        window.clearTimeout(rebuildTimer.current)
        rebuildTimer.current = null
      }
      
      mapInstanceRef.current = null
      if (mapRef.current) mapRef.current.innerHTML = ''
    }
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
          
          {/* Fallback: Show farm list instead */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-w-md mx-auto">
            <h4 className="font-medium text-gray-900 mb-3">Available Farms ({farms.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {farms.slice(0, 10).map((farm) => (
                <div key={farm.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{farm.name}</div>
                    <div className="text-xs text-gray-600">{farm.location.city}, {farm.location.county}</div>
                  </div>
                  <button
                    onClick={() => onFarmSelect?.(farm.id)}
                    className="text-xs bg-serum text-black px-2 py-1 rounded hover:bg-serum/90 transition-colors"
                  >
                    View
                  </button>
                </div>
              ))}
              {farms.length > 10 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  +{farms.length - 10} more farms available
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-serum text-black px-4 py-2 rounded-lg font-medium hover:bg-serum/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} relative safe-bottom`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-serum mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="absolute inset-0" 
        style={{
          touchAction: 'pan-x pan-y pinch-zoom',  // ← instead of 'none'
          WebkitUserSelect: 'none', // Prevent text selection on iOS
          userSelect: 'none'
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
          userLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null}
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
          userLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null}
          position={popoverPosition}
        />
      )}

      {/* Cluster Preview */}
      <ClusterPreview
        cluster={selectedCluster}
        isVisible={showClusterPreview}
        onClose={handleCloseClusterPreview}
        onZoomToCluster={handleZoomToCluster}
        onShowAllFarms={handleShowAllFarms}
        userLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null}
      />
    </div>
  )
}

