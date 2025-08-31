'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
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

    // Store padding for later use
    map.set('customPadding', padding)
    
    // Trigger resize to apply padding
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

    loader.load().then(() => {
      if (!mapRef.current) return

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapId: 'DEMO_MAP_ID',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative'
      })

      mapInstanceRef.current = map

      // Apply initial padding
      applyResponsivePadding()

      // Create markers
      createMarkers(map, farms)

      // Call onMapLoad callback
      if (onMapLoad) {
        onMapLoad(map)
      }

      // Set up bounds change listener
      if (onBoundsChange) {
        map.addListener('bounds_changed', () => {
          const bounds = map.getBounds()
          if (bounds) {
            onBoundsChange(bounds)
          }
        })
      }

      setIsLoading(false)
    }).catch((err) => {
      console.error('Failed to load Google Maps:', err)
      setError('Failed to load map')
    })
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
        google.maps.event.trigger(mapInstanceRef.current, 'resize')
      }
    })

    resizeObserver.observe(mapRef.current)
    if (mapRef.current.parentElement) {
      resizeObserver.observe(mapRef.current.parentElement)
    }

    return () => resizeObserver.disconnect()
  }, [])

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">{error}</p>
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
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
