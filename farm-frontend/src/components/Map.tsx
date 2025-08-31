'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import type { FarmShop } from '@/types/farm'

// Google Maps types
declare global {
  interface Window {
    google: typeof google
  }
}

interface MapProps {
  farms: FarmShop[]
  selectedFarmId?: string | null
  onFarmSelect?: (farmId: string) => void
  onMapLoad?: (map: any) => void
  onBoundsChange?: (bounds: any) => void
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  userLocation?: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: number
  } | null
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

export default function Map({
  farms,
  selectedFarmId,
  onFarmSelect,
  onMapLoad,
  onBoundsChange,
  center = UK_CENTER,
  zoom = 6,
  className = 'w-full h-full',
  userLocation
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const userLocationMarkerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return

    const initMap = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: 'weekly',
          libraries: ['places', 'marker']
        })

        const google = await loader.load()
        
        if (!mapRef.current) return

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapId: 'f907b7cb594ed2caa752543d',
          mapTypeId: 'roadmap',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        mapInstanceRef.current = map
        onMapLoad?.(map)

        // Set up bounds change listener
        map.addListener('bounds_changed', () => {
          const bounds = map.getBounds()
          if (bounds && onBoundsChange) {
            onBoundsChange(bounds)
          }
        })

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load Google Maps:', err)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }

    initMap()
  }, [center, zoom, onMapLoad, onBoundsChange])

  // Create markers for farms
  const createMarkers = useCallback((map: any, farmData: FarmShop[]) => {
    if (!map || !farmData.length || !window.google) return

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.setMap(null))
    markersRef.current = {}

    const markers: any[] = []

    farmData.forEach(farm => {
      if (!farm.location?.lat || !farm.location?.lng) return

      const position = new window.google.maps.LatLng(farm.location.lat, farm.location.lng)
      
      // Create custom marker icon
      const isSelected = selectedFarmId === farm.id
      const markerIcon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#00C2B2" stroke="white" stroke-width="2"/>
            <path fill="white" d="M16 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            ${isSelected ? '<circle cx="24" cy="8" r="6" fill="#D4FF4F" stroke="white" stroke-width="2"/>' : ''}
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      }

      const marker = new window.google.maps.Marker({
        position,
        map,
        icon: markerIcon,
        title: farm.name
      })

      // Add click listener
      marker.addListener('click', () => {
        onFarmSelect?.(farm.id)
        
        // Pan to marker with smooth animation
        map.panTo(position)
        map.setZoom(Math.max(map.getZoom() || 10, 12))
      })

      markers.push(marker)
      markersRef.current[farm.id] = marker
    })
  }, [selectedFarmId, onFarmSelect])

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !window.google) return

    const map = mapInstanceRef.current
    const position = new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude)

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
      scaledSize: new window.google.maps.Size(24, 24),
      anchor: new window.google.maps.Point(12, 12)
    }

    userLocationMarkerRef.current = new window.google.maps.Marker({
      position,
      map,
      icon: userLocationIcon,
      title: 'Your Location',
      zIndex: 1000
    })

    // Add accuracy circle
    const accuracyCircle = new window.google.maps.Circle({
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

  // Update markers when farms or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !farms.length) return
    
    createMarkers(mapInstanceRef.current, farms)
  }, [farms, selectedFarmId, createMarkers])

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
