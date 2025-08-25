'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { 
  APIProvider, 
  Map, 
  Marker, 
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps'
import { Search, MapPin, Phone, Mail, Globe, Navigation, X } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

interface GoogleMapComponentProps {
  farms: FarmShop[] | null
  filteredFarms: FarmShop[] | null
  userLoc: { lat: number; lng: number } | null
  setUserLoc: (loc: { lat: number; lng: number } | null) => void
  bounds: { west: number; south: number; east: number; north: number } | null
  setBounds: (bounds: { west: number; south: number; east: number; north: number } | null) => void
  selectedFarm: FarmShop | null
  setSelectedFarm: (farm: FarmShop | null) => void
  loadFarmData: () => void
  isLoading: boolean
  error: string | null
  retryCount: number
  isRetrying: boolean
  dataQuality: { total: number; valid: number; invalid: number } | null
}

// UK center coordinates
const UK_CENTER = { lat: 54.5, lng: -2.5 }
const DEFAULT_ZOOM = 6

// Map controls component
function MapControls({ 
  farms, 
  filteredFarms, 
  onRetry, 
  isLoading, 
  error, 
  dataQuality 
}: {
  farms: FarmShop[] | null
  filteredFarms: FarmShop[] | null
  onRetry: () => void
  isLoading: boolean
  error: string | null
  dataQuality: { total: number; valid: number; invalid: number } | null
}) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
      <div className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Farm Directory
          </h3>
          {farms && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filteredFarms?.length || 0} of {farms.length}
            </span>
          )}
        </div>

        {/* Loading/Error States */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Loading farms...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">
            <p className="mb-2">{error}</p>
            <button
              onClick={onRetry}
              className="bg-red-600 text-white px-3 py-1 rounded-md text-xs hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data Quality */}
        {dataQuality && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Valid farms:</span>
              <span className="font-medium">{dataQuality.valid}</span>
            </div>
            <div className="flex justify-between">
              <span>Invalid farms:</span>
              <span className="font-medium text-red-600">{dataQuality.invalid}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main map component
function FarmMap({ 
  farms, 
  filteredFarms, 
  selectedFarm, 
  setSelectedFarm 
}: {
  farms: FarmShop[] | null
  filteredFarms: FarmShop[] | null
  selectedFarm: FarmShop | null
  setSelectedFarm: (farm: FarmShop | null) => void
}) {
  const map = useMap()
  
  // Calculate bounds for filtered farms
  const bounds = useMemo(() => {
    if (!filteredFarms || filteredFarms.length === 0) return null
    
    const validFarms = filteredFarms.filter(farm => 
      farm.location?.lat && farm.location?.lng &&
      typeof farm.location.lat === 'number' && typeof farm.location.lng === 'number'
    )
    
    if (validFarms.length === 0) return null
    
    const lats = validFarms.map(f => f.location!.lat)
    const lngs = validFarms.map(f => f.location!.lng)
    
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }
  }, [filteredFarms])

  // Fit map to bounds when they change
  React.useEffect(() => {
    if (bounds && map) {
      const googleBounds = new google.maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      )
      map.fitBounds(googleBounds, 50) // 50px padding
    }
  }, [bounds, map])

  // Handle marker click
  const handleMarkerClick = useCallback((farm: FarmShop) => {
    setSelectedFarm(farm)
  }, [setSelectedFarm])

  // Handle info window close
  const handleInfoWindowClose = useCallback(() => {
    setSelectedFarm(null)
  }, [setSelectedFarm])

  if (!farms) return null

  return (
    <>
      {/* Render markers for filtered farms */}
      {filteredFarms?.map((farm) => {
        if (!farm.location?.lat || !farm.location?.lng) return null
        
        return (
          <Marker
            key={farm.id}
            position={{ 
              lat: farm.location.lat, 
              lng: farm.location.lng 
            }}
            onClick={() => handleMarkerClick(farm)}
            title={farm.name}
          />
        )
      })}

      {/* Info window for selected farm */}
      {selectedFarm && selectedFarm.location?.lat && selectedFarm.location?.lng && (
        <InfoWindow
          position={{ 
            lat: selectedFarm.location.lat, 
            lng: selectedFarm.location.lng 
          }}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="p-2 max-w-xs">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">
                {selectedFarm.name}
              </h3>
              <button
                onClick={handleInfoWindowClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{selectedFarm.location.address}</span>
              </div>
              {selectedFarm.location.county && (
                <div className="text-gray-500">
                  {selectedFarm.location.county}
                </div>
              )}
              
              {/* Contact info */}
              {selectedFarm.contact?.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{selectedFarm.contact.phone}</span>
                </div>
              )}
              
              {selectedFarm.contact?.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <a 
                    href={selectedFarm.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="mt-3 flex gap-2">
              <a
                href={`/shop/${selectedFarm.slug}`}
                className="bg-serum text-black px-3 py-1 rounded text-xs font-medium hover:bg-serum/90 transition-colors"
              >
                View Details
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFarm.location.lat},${selectedFarm.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                Directions
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  )
}

export default function GoogleMapComponent({
  farms,
  filteredFarms,
  userLoc,
  setUserLoc,
  bounds: _bounds,
  setBounds: _setBounds,
  selectedFarm,
  setSelectedFarm,
  loadFarmData,
  isLoading,
  error,
  retryCount,
  isRetrying,
  dataQuality
}: GoogleMapComponentProps) {
  const [mapCenter, setMapCenter] = useState(UK_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)

  // Get user location on mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLoc(newLoc)
          setMapCenter(newLoc)
          setMapZoom(10)
        },
        (error) => {
          console.log('Geolocation error:', error)
          // Keep default UK center
        }
      )
    }
  }, [setUserLoc])

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          center={mapCenter}
          zoom={mapZoom}
          mapId="farm-companion-map"
          className="w-full h-full"
          onCenterChanged={(e) => {
            const center = e.detail.center
            setMapCenter({ lat: center.lat, lng: center.lng })
          }}
          onZoomChanged={(e) => {
            setMapZoom(e.detail.zoom)
          }}
        >
          <FarmMap
            farms={farms}
            filteredFarms={filteredFarms}
            selectedFarm={selectedFarm}
            setSelectedFarm={setSelectedFarm}
          />
        </Map>
      </APIProvider>

      {/* Map Controls */}
      <MapControls
        farms={farms}
        filteredFarms={filteredFarms}
        onRetry={loadFarmData}
        isLoading={isLoading}
        error={error}
        dataQuality={dataQuality}
      />
    </div>
  )
}
