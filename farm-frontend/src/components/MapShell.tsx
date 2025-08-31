'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import type { FarmShop } from '@/types/farm'

// Memory management utility
const checkMemoryAvailability = () => {
  try {
    // Check device memory if available
    if ('deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory
      if (deviceMemory < 2) {
        console.warn(`Low device memory detected: ${deviceMemory}GB`)
        return false
      }
    }

    // Check available memory if possible
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const usedMB = memory.usedJSHeapSize / 1024 / 1024
      const totalMB = memory.totalJSHeapSize / 1024 / 1024
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024
      
      console.log(`Memory usage: ${usedMB.toFixed(1)}MB / ${totalMB.toFixed(1)}MB (limit: ${limitMB.toFixed(1)}MB)`)
      
      if (usedMB / limitMB > 0.8) {
        console.warn('High memory usage detected')
        return false
      }
    }

    return true
  } catch (err) {
    console.warn('Could not check memory availability:', err)
    return true // Assume OK if we can't check
  }
}

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
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  userLocation?: UserLocation | null
  bottomSheetHeight?: number
  isDesktop?: boolean
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
  isDesktop = false
}: MapShellProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Record<string, google.maps.Marker>>({})
  const userLocationMarkerRef = useRef<google.maps.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create markers for farms
  const createMarkers = useCallback((map: google.maps.Map, farmData: FarmShop[]) => {
    if (!map || !farmData.length || typeof window === 'undefined') return

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.setMap(null))
    markersRef.current = {}

    const markers: google.maps.Marker[] = []

    farmData.forEach(farm => {
      if (!farm.location?.lat || !farm.location?.lng) return

      const position = new google.maps.LatLng(farm.location.lat, farm.location.lng)
      
      // Create custom marker icon
      const icon = {
        url: `data:image/svg+xml;utf8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#00C2B2" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      }

      const marker = new google.maps.Marker({
        position,
        map,
        icon,
        title: farm.name,
        optimized: true,
      })

      // Add click listener
      marker.addListener('click', () => {
        onFarmSelect?.(farm.id)
      })

      // Store marker reference
      markersRef.current[farm.id] = marker
      markers.push(marker)
    })

    // Fit bounds to show all markers if no farm is selected
    if (markers.length > 0 && !selectedFarmId) {
      const bounds = new google.maps.LatLngBounds()
      markers.forEach(marker => {
        const position = marker.getPosition()
        if (position) bounds.extend(position)
      })
      map.fitBounds(bounds)
    }
  }, [selectedFarmId, onFarmSelect])

  // Apply responsive padding
  const applyResponsivePadding = useCallback(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current
    
    // Base padding
    const basePadding = {
      top: 8,
      left: 8,
      bottom: bottomSheetHeight,
      right: 8
    }

    // Desktop adjustments
    const padding = isDesktop 
      ? { ...basePadding, right: 384 } 
      : basePadding

    // Store padding for later use and trigger resize
    map.set('customPadding', padding)
    google.maps.event.trigger(map, 'resize')
  }, [bottomSheetHeight, isDesktop])

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places', 'marker']
    })

    // Add memory management and error handling
    let mapInstance: google.maps.Map | null = null
    let isDisposed = false

    const cleanup = () => {
      if (mapInstance && !isDisposed) {
        try {
          // Clear all markers
          Object.values(markersRef.current).forEach(marker => {
            if (marker && marker.setMap) {
              marker.setMap(null)
            }
          })
          markersRef.current = {}

          // Clear user location marker
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setMap(null)
            userLocationMarkerRef.current = null
          }

          // Dispose map instance
          google.maps.event.clearInstanceListeners(mapInstance)
          mapInstance = null
          isDisposed = true
        } catch (err) {
          console.warn('Error during map cleanup:', err)
        }
      }
    }

    loader.load().then(() => {
      if (!mapRef.current || isDisposed) return

      try {
        // Check for memory availability before creating map
        if (!checkMemoryAvailability()) {
          console.warn('Low device memory detected, using simplified map')
        }

        mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapId: 'f907b7cb594ed2caa752543d',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative',
          // Memory optimization settings
          maxZoom: 18,
          minZoom: 4,
          // Reduce memory usage
          disableDefaultUI: false
        })

        mapInstanceRef.current = mapInstance

        // Apply initial padding
        applyResponsivePadding()

        // Create markers with error handling
        try {
          createMarkers(mapInstance, farms)
        } catch (markerError) {
          console.warn('Error creating markers:', markerError)
          setError('Some map features may not display correctly')
        }

        // Call onMapLoad callback
        if (onMapLoad) {
          onMapLoad(mapInstance)
        }

        // Set up bounds change listener
        if (onBoundsChange) {
          mapInstance.addListener('bounds_changed', () => {
            try {
              const bounds = mapInstance!.getBounds()
              if (bounds) {
                onBoundsChange(bounds)
              }
            } catch (boundsError) {
              console.warn('Error in bounds change handler:', boundsError)
            }
          })
        }

        setIsLoading(false)
      } catch (mapError: any) {
        console.error('Error creating map:', mapError)
        
        // Handle specific error types
        if (mapError.message?.includes('OverQuotaMapError')) {
          setError('Map service temporarily unavailable. Please try again later.')
        } else if (mapError.message?.includes('Out of memory') || mapError.message?.includes('WebAssembly')) {
          setError('Map requires more memory than available. Please close other tabs and try again.')
        } else {
          setError('Failed to load map. Please refresh the page.')
        }
      }
    }).catch((err) => {
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

    // Cleanup on unmount
    return () => {
      isDisposed = true
      cleanup()
    }
  }, [center, zoom, farms, onMapLoad, onBoundsChange, createMarkers, applyResponsivePadding])

  // Update padding when props change
  useEffect(() => {
    applyResponsivePadding()
  }, [applyResponsivePadding])

  // Update markers when farms or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !farms.length) return
    
    createMarkers(mapInstanceRef.current, farms)
  }, [farms, selectedFarmId, createMarkers])

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || typeof window === 'undefined') return

    const map = mapInstanceRef.current
    const position = new google.maps.LatLng(userLocation.latitude, userLocation.longitude)

    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null)
    }

    // Create user location marker
    const userLocationIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(24, 24),
      anchor: new google.maps.Point(12, 12)
    }

    userLocationMarkerRef.current = new google.maps.Marker({
      position,
      map,
      icon: userLocationIcon,
      title: 'Your Location',
      zIndex: 1000
    })

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
        userLocationMarkerRef.current.setMap(null)
      }
      accuracyCircle.setMap(null)
    }
  }, [userLocation])

  // Pan to selected farm
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedFarmId) return

    const marker = markersRef.current[selectedFarmId]
    if (marker) {
      const position = marker.getPosition()
      if (position) {
        mapInstanceRef.current.panTo(position)
        mapInstanceRef.current.setZoom(Math.max(mapInstanceRef.current.getZoom() || 10, 14))
      }
    }
  }, [selectedFarmId])

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
