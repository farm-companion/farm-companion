'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogle } from '@/lib/googleMaps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { Map } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import MarkerActions from './MarkerActions'
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

// RAW SVG strings (not encoded) - will be encoded when building data: URLs
const CLUSTER_SVGS = {
  small: `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#00C2B2" stroke="white" stroke-width="2"/>
      <text x="20" y="25" text-anchor="middle" fill="white" font-family="Clash Display" font-size="14" font-weight="600">{COUNT}</text>
    </svg>`,
  medium: `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#00C2B2" stroke="white" stroke-width="2"/>
      <text x="24" y="30" text-anchor="middle" fill="white" font-family="Clash Display" font-size="16" font-weight="600">{COUNT}</text>
    </svg>`,
  large: `
    <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#00C2B2" stroke="white" stroke-width="2"/>
      <text x="28" y="35" text-anchor="middle" fill="white" font-family="Clash Display" font-size="18" font-weight="600">{COUNT}</text>
    </svg>`
}

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
  const [selectedMarker, setSelectedMarker] = useState<FarmShop | null>(null)
  const [showMarkerActions, setShowMarkerActions] = useState(false)
  
  // Debug state changes
  useEffect(() => {
    console.log('selectedMarker changed to:', selectedMarker?.name, 'from previous value')
  }, [selectedMarker])
  
  useEffect(() => {
    console.log('showMarkerActions changed to:', showMarkerActions, 'from previous value')
  }, [showMarkerActions])
  
  // Debug component lifecycle
  useEffect(() => {
    console.log('MapShell component mounted')
    return () => {
      console.log('MapShell component unmounting')
    }
  }, [])
  const [selectedCluster, setSelectedCluster] = useState<any>(null)
  const [showClusterPreview, setShowClusterPreview] = useState(false)

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

  // Enhanced cluster click with preview and smart zoom
  const handleClusterClick = useCallback((event: any) => {
    console.log('Cluster click event received:', event)
    
    // The event structure is different - it has latLng but not cluster methods
    // We need to find the actual cluster object or handle this differently
    if (!event || !event.latLng) {
      console.warn('Invalid cluster event received:', event)
      return false
    }
    
    console.log('Cluster clicked at position:', event.latLng.lat(), event.latLng.lng())
    
    // Trigger haptic feedback
    triggerHaptic('medium')
    
    // Manually zoom into the cluster area
    const map = mapInstanceRef.current
    if (map && event.latLng) {
      const currentZoom = map.getZoom() || 10
      const targetZoom = Math.min(currentZoom + 2, 16) // Zoom in by 2 levels, max 16
      
      // Smooth zoom to cluster center
      map.panTo(event.latLng)
      map.setZoom(targetZoom)
    }
    
    // Return false to prevent default behavior since we're handling it manually
    return false
  }, [triggerHaptic])

  // Smart zoom to cluster with optimal zoom level
  const handleZoomToCluster = useCallback((cluster: any) => {
    const map = mapInstanceRef.current
    if (!map || !cluster) return

    // Validate cluster object has required properties
    if (!cluster.count || !cluster.markers || !Array.isArray(cluster.markers)) {
      console.warn('Invalid cluster object for zoom:', cluster)
      return
    }

    // Calculate optimal zoom level based on cluster size
    const count = cluster.count
    let targetZoom = 14 // Default zoom for small clusters
    
    if (count > 50) targetZoom = 12      // Large clusters: zoom out to see area
    else if (count > 20) targetZoom = 13  // Medium clusters: moderate zoom
    else if (count > 10) targetZoom = 14  // Small clusters: closer zoom
    else targetZoom = 15                   // Very small clusters: close zoom

    // Calculate bounds for the cluster
    const bounds = new google.maps.LatLngBounds()
    cluster.markers.forEach((marker: google.maps.Marker) => {
      if (marker && typeof marker.getPosition === 'function') {
        const pos = marker.getPosition()
        if (pos) bounds.extend(pos)
      }
    })

    // Add padding for better view
    const padding = Math.min(count * 2, 100) // Dynamic padding based on cluster size
    bounds.extend(new google.maps.LatLng(
      bounds.getNorthEast().lat() + (padding * 0.0001),
      bounds.getNorthEast().lng() + (padding * 0.0001)
    ))
    bounds.extend(new google.maps.LatLng(
      bounds.getSouthWest().lat() - (padding * 0.0001),
      bounds.getSouthWest().lng() - (padding * 0.0001)
    ))

    // Smooth pan and zoom to cluster
    map.fitBounds(bounds, padding)
    
    // Set optimal zoom level
    setTimeout(() => {
      map.setZoom(Math.min(map.getZoom() || targetZoom, targetZoom))
    }, 300)
  }, [])

  // Show all farms in cluster as list
  const handleShowAllFarms = useCallback((farms: FarmShop[]) => {
    // TODO: Implement list view or filter to show only these farms
    console.log('Show all farms in cluster:', farms.length)
    
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
  const handleMarkerClick = useCallback((farm: FarmShop) => {
    console.log('=== MARKER CLICK START ===')
    console.log('Marker clicked:', farm.name)
    console.log('Current state - selectedMarker:', selectedMarker?.name, 'showMarkerActions:', showMarkerActions)
    console.log('Setting selectedMarker to:', farm.name)
    console.log('Setting showMarkerActions to: true')
    
    // Trigger haptic feedback
    triggerHaptic('light')
    
    // Show marker actions
    setSelectedMarker(farm)
    setShowMarkerActions(true)
    
    console.log('State update calls completed')
    console.log('=== MARKER CLICK END ===')
    
    // Call the original handler for compatibility using ref
    onFarmSelectRef.current?.(farm.id)
  }, [triggerHaptic, selectedMarker, showMarkerActions]) // Add state dependencies for debugging

  // Marker action handlers
  const handleNavigate = useCallback((farm: FarmShop) => {
    // Open in default maps app
    const url = `https://maps.google.com/maps?q=${farm.location.lat},${farm.location.lng}`
    window.open(url, '_blank')
    setShowMarkerActions(false)
  }, [])

  const handleFavorite = useCallback((farmId: string) => {
    // TODO: Implement favorites system
    console.log('Favorite farm:', farmId)
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
    setShowMarkerActions(false)
  }, [])

  const handleCloseMarkerActions = useCallback(() => {
    setShowMarkerActions(false)
    setSelectedMarker(null)
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
  const clusterRenderer = useRef<any>(null)

  // top-level refs
  const farmsRef = useRef<FarmShop[]>([])
  const rebuildTimer = useRef<number | null>(null)

  // Create clustered markers for farms
  const createMarkers = useCallback((map: google.maps.Map, farmData: FarmShop[]) => {
    if (!map || !farmData.length || typeof window === 'undefined') {
      console.log('createMarkers: Missing requirements', { 
        hasMap: !!map, 
        farmDataLength: farmData?.length, 
        isWindow: typeof window !== 'undefined' 
      })
      return
    }

    console.log('=== CREATING MARKERS ===')
    console.log('Map instance:', map)
    console.log('Farm data length:', farmData.length)
    console.log('First farm:', farmData[0])

    console.log('Clearing existing markers and clusterer')
    // Clear existing markers and clusterer
    Object.values(markersRef.current).forEach(marker => marker.setMap(null))
    markersRef.current = {}
    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
      console.log('Clusterer cleared')
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

      console.log('Creating marker for farm:', farm.name, 'at position:', farm.location.lat, farm.location.lng)
      
      marker.addListener('click', () => {
        console.log('Marker click event triggered for:', farm.name)
        handleMarkerClick(farm)
      })
      
      // Add marker to map first, then to clusterer
      marker.setMap(map)
      
      markersRef.current[farm.id] = marker
      markers.push(marker)
      
      console.log('Marker added to map and array, total markers:', markers.length)
    })

    // Create/update clusterer with stable renderer
    if (!clustererRef.current) {
      console.log('Creating new clusterer')
      // Create stable renderer instance once
      if (!clusterRenderer.current) {
        clusterRenderer.current = {
          render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
            console.log('Rendering cluster with count:', count, 'at position:', position.lat(), position.lng())
            
            // Choose SVG size based on count for better visual hierarchy
            let raw: string
            let size: google.maps.Size
            let anchor: google.maps.Point
            
            if (count > 20) {
              raw = CLUSTER_SVGS.large
              size = new google.maps.Size(56, 56)
              anchor = new google.maps.Point(28, 28)
            } else if (count > 5) {
              raw = CLUSTER_SVGS.medium
              size = new google.maps.Size(48, 48)
              anchor = new google.maps.Point(24, 24)
            } else {
              raw = CLUSTER_SVGS.small
              size = new google.maps.Size(40, 40)
              anchor = new google.maps.Point(20, 20)
            }
            
            // Replace placeholder and encode once when building data: URL
            const svg = raw.replace('{COUNT}', String(count))
            const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
            
            return new google.maps.Marker({
              position,
              icon: { url: svgUrl, scaledSize: size, anchor },
              zIndex: google.maps.Marker.MAX_ZINDEX + 2   // cluster on top
            })
          }
        }
      }
      
      clustererRef.current = new MarkerClusterer({ 
        map,
        markers: [],
        renderer: clusterRenderer.current,
        onClusterClick: handleClusterClick
      })
    }
    
    console.log('Adding', markers.length, 'markers to clusterer')
    clustererRef.current.addMarkers(markers)

    console.log('clusterer markers', markers.length)

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
          console.log('User location available - can offer zoom to location')
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
        ;(window as any).requestIdleCallback(
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
    console.log('farms length', farms.length)
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
    ;(map as any).setOptions({ padding: pad })
  }, [bottomSheetHeight, isDesktop])

  // Create map once (guard StrictMode)
  useEffect(() => {
    if (hasInit.current || !mapRef.current) return
    hasInit.current = true

    loadGoogle().then(() => {
      console.log('Google Maps loaded successfully')
      if (!mapRef.current) {
        console.error('Map ref not available')
        return
      }
      if (mapInstanceRef.current) {
        console.log('Map already exists, skipping creation')
        return // double-guard
      }

      console.log('=== CREATING MAP ===')
      console.log('Map ref element:', mapRef.current)
      
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
      ;(window as any).zoomToUKOverview = zoomToUKOverview
      
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
      
    }).catch((err: any) => {
      console.error('Failed to load Google Maps:', err)
      
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
        }) as any
      }
    } catch (error) {
      console.warn('AdvancedMarkerElement not available, using fallback:', error)
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
      }) as any
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
          console.warn('Error triggering map resize:', err)
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
        console.warn('Error disconnecting resize observer:', err)
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
    const handler = (e: any) => {
      const pad = { 
        top: 60, 
        left: 8, 
        right: window.matchMedia('(min-width:768px)').matches ? 384 : 8, 
        bottom: e.detail 
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
          farm={selectedMarker}
          isVisible={showMarkerActions}
          onClose={handleCloseMarkerActions}
          onNavigate={handleNavigate}
          onFavorite={handleFavorite}
          onShare={handleShare}
          userLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null}
          isDesktop={isDesktop}
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

