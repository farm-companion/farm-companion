'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import type { FarmShop } from '@/types/farm'

interface MapProps {
  farms: FarmShop[]
  selectedFarmId?: string | null
  onFarmSelect?: (farmId: string) => void
  onMapLoad?: (map: google.maps.Map) => void
  onBoundsChange?: (bounds: google.maps.LatLngBounds) => void
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
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
  className = 'w-full h-full'
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Record<string, google.maps.Marker>>({})

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return

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
          mapId: 'f907b7cb594ed2caa752543d', // Your custom map style
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
  const createMarkers = useCallback((map: google.maps.Map, farmData: FarmShop[]) => {
    if (!map || !farmData.length) return

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.setMap(null))
    markersRef.current = {}
    


    const markers: google.maps.Marker[] = []

    farmData.forEach(farm => {
      if (!farm.location?.lat || !farm.location?.lng) return

      const position = new google.maps.LatLng(farm.location.lat, farm.location.lng)
      
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
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      }

      const marker = new google.maps.Marker({
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
