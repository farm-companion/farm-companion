'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogle } from '@/lib/googleMaps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import type { FarmShop } from '@/types/farm'

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

// Pre-encoded cluster SVGs for performance (avoid innerHTML string building per render)
const CLUSTER_SVGS = {
  small: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#00C2B2" stroke="white" stroke-width="2"/>
      <text x="20" y="25" text-anchor="middle" fill="white" font-family="Inter" font-size="14" font-weight="600">%count%</text>
    </svg>
  `)}`,
  medium: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#00C2B2" stroke="white" stroke-width="2"/>
      <text x="24" y="30" text-anchor="middle" fill="white" font-family="Inter" font-size="16" font-weight="600">%count%</text>
    </svg>
  `)}`,
  large: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#00C2B2" stroke="white" stroke-width="2"/>
      <text x="28" y="35" text-anchor="middle" fill="white" font-family="Inter" font-size="18" font-weight="600">%count%</text>
    </svg>
  `)}`
}

// UK bounds for fallback
const UK_BOUNDS = {
  north: 60.9,
  south: 49.9,
  east: 1.8,
  west: -8.6
}

const UK_CENTER = {
  lat: (UK_BOUNDS.north + UK_BOUNDS.south) / 2,
  lng: (UK_BOUNDS.east + UK_BOUNDS.west) / 2
}

export default function MapShell({
  farms,
  selectedFarmId,
  onFarmSelect,
  onMapLoad,
  onBoundsChange,
  center = UK_CENTER,
  zoom = 6,
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

  // Flicker prevention refs
  const hasInit = useRef(false)
  const hasFitted = useRef(false)

  const lastPadding = useRef<string>('')
  const programmaticMove = useRef(false)

  const idsKey = useRef<string>('')

  // Stable cluster renderer instance (avoid recreating per render)
  const clusterRenderer = useRef<any>(null)

  // Create clustered markers for farms
  const createMarkers = useCallback((map: google.maps.Map, farmData: FarmShop[]) => {
    if (!map || !farmData.length || typeof window === 'undefined') return

    // Clear existing markers and clusterer
    Object.values(markersRef.current).forEach(marker => marker.setMap(null))
    markersRef.current = {}
    clustererRef.current?.clearMarkers()

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

      marker.addListener('click', () => onFarmSelect?.(farm.id))
      markersRef.current[farm.id] = marker
      markers.push(marker)
    })

    // Create/update clusterer with stable renderer
    if (!clustererRef.current) {
      // Create stable renderer instance once
      if (!clusterRenderer.current) {
        clusterRenderer.current = {
          render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
            // Choose SVG size based on count for better visual hierarchy
            let svgUrl: string
            let size: google.maps.Size
            let anchor: google.maps.Point
            
            if (count > 20) {
              svgUrl = CLUSTER_SVGS.large.replace('%count%', count.toString())
              size = new google.maps.Size(56, 56)
              anchor = new google.maps.Point(28, 28)
            } else if (count > 5) {
              svgUrl = CLUSTER_SVGS.medium.replace('%count%', count.toString())
              size = new google.maps.Size(48, 48)
              anchor = new google.maps.Point(24, 24)
            } else {
              svgUrl = CLUSTER_SVGS.small.replace('%count%', count.toString())
              size = new google.maps.Size(40, 40)
              anchor = new google.maps.Point(20, 20)
            }
            
            return new google.maps.Marker({
              position,
              icon: { url: svgUrl, scaledSize: size, anchor }
            })
          }
        }
      }
      
      clustererRef.current = new MarkerClusterer({ 
        map,
        markers: [],
        renderer: clusterRenderer.current
      })
    }
    
    clustererRef.current.addMarkers(markers)

    // Fit bounds only once with calmer UK view (don't re-fit on every render)
    if (markers.length > 0 && !selectedFarmId && !hasFitted.current) {
      const bounds = new google.maps.LatLngBounds(
        { lat: 49.9, lng: -8.6 }, // southwest
        { lat: 60.9, lng: 1.8 }   // northeast
      )
      programmaticMove.current = true
      map.fitBounds(bounds, 0) // no extra zoom-in
      setTimeout(() => (programmaticMove.current = false), 200)
      hasFitted.current = true
    }
  }, [selectedFarmId, onFarmSelect])

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

  // Safe pan function
  const safePanTo = useCallback((pos: google.maps.LatLng | google.maps.LatLngLiteral) => {
    const m = mapInstanceRef.current
    if (!m) return
    programmaticMove.current = true
    m.panTo(pos)
    window.setTimeout(() => { programmaticMove.current = false }, 200)
  }, [])

  // Debounced padding updates
  const applyResponsivePadding = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    
    const pad = {
      top: 60,
      left: 8,
      right: isDesktop ? 384 : 8,
      bottom: bottomSheetHeight
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
      if (!mapRef.current) return
      if (mapInstanceRef.current) return // double-guard

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapId: 'f907b7cb594ed2caa752543d',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy', // Better on iOS - more responsive touch
        disableDoubleClickZoom: false, // Enable double-tap zoom for iOS
        clickableIcons: true, // Keep POI labels clickable
        draggable: true,
        // Removed scrollwheel: false - mobile ignores it anyway
        keyboardShortcuts: false // Disable keyboard shortcuts on mobile
      })

      // Set calmer initial camera & real padding
      map.setOptions({
        minZoom: 4,
        maxZoom: 18,
      })
      
      // Apply real padding using map.set for Vector Maps support
      map.set('padding', { 
        top: 60, 
        right: isDesktop ? 384 : 8, 
        bottom: bottomSheetHeight, 
        left: 8 
      })

      mapInstanceRef.current = map
      setIsLoading(false)
      onMapLoad?.(map)
      onMapReady?.(map)
      applyResponsivePadding() // set initial padding
      
      // attach listeners AFTER init
      attachBoundsListener()
      
      // Add idle listener for marker rebuilding (triggers when map stops moving)
      const idleListener = map.addListener('idle', () => {
        const key = farms.map(f => f.id).sort().join('|')
        if (key === idsKey.current) return
        idsKey.current = key
        
        // Defer marker creation to idle time with small timeout
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(() => createMarkers(map, farms), { timeout: 100 })
        } else {
          setTimeout(() => createMarkers(map, farms), 0)
        }
      })
      
      // Store listener for cleanup
      map.set('idleListener', idleListener)
      
      // iOS-specific touch handling
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // Prevent iOS Safari from interfering with map gestures
        ;(mapRef.current.style as any).webkitTouchCallout = 'none'
        ;(mapRef.current.style as any).webkitUserSelect = 'none'
        mapRef.current.style.userSelect = 'none'
        
        // Add touch event listeners for better iOS support
        map.addListener('touchstart', (e: any) => {
          // Prevent default touch behavior that might interfere
          if (e.touches.length === 1) {
            e.stopPropagation()
          }
        })
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

  // Marker rebuilding now handled by idle listener for better performance

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
    const handleOrientationChange = () => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize')
      }
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    return () => window.removeEventListener('orientationchange', handleOrientationChange)
  }, [])

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
    <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-serum mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="absolute inset-0" />
    </div>
  )
}

