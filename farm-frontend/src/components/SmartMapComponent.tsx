'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { 
  MapPin, 
  X, 
  Filter
} from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import TransitionIndicator from './TransitionIndicator'
import ResponsiveInfoWindow from './ResponsiveInfoWindow'

// Performance and UX constants
const DEFAULT_ZOOM = 8 // Increased from 6 for better initial view
const MAX_INITIAL_FARMS = 50 // Show only 50 most relevant farms initially

// Smart filtering configuration
interface SmartFilterConfig {
  maxDefaultDistance: number // 50km default
  maxInitialFarms: number // 50 farms initially
}

const DEFAULT_FILTER_CONFIG: SmartFilterConfig = {
  maxDefaultDistance: 50,
  maxInitialFarms: 50
}

// Distance calculation utility
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Get marker color based on distance
const getMarkerColor = (distance: number): string => {
  if (distance <= 5) return '#10B981' // Green - very close
  if (distance <= 15) return '#F59E0B' // Amber - close
  if (distance <= 50) return '#EF4444' // Red - medium
  return '#6B7280' // Gray - far
}

// Smart farm filtering and sorting
const getSmartFilteredFarms = (
  farms: FarmShop[],
  userLocation: { lat: number; lng: number } | null,
  config: SmartFilterConfig
): FarmShop[] => {
  if (!farms || farms.length === 0) return []

  // Calculate distances and add to farms
  const farmsWithDistance = farms.map(farm => {
    const distance = userLocation && farm.location
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          farm.location.lat,
          farm.location.lng
        )
      : Infinity

    return {
      ...farm,
      distance,
      markerColor: getMarkerColor(distance)
    }
  })

  // Sort by relevance: distance first, then popularity/rating
  const sortedFarms = farmsWithDistance.sort((a, b) => {
    // Prioritize farms within default distance
    const aInRange = a.distance <= config.maxDefaultDistance
    const bInRange = b.distance <= config.maxDefaultDistance

    if (aInRange && !bInRange) return -1
    if (!aInRange && bInRange) return 1

    // Within range, sort by distance
    if (aInRange && bInRange) {
      return a.distance - b.distance
    }

    // Outside range, sort by distance (closest first)
    return a.distance - b.distance
  })

  // Return only the most relevant farms initially
  return sortedFarms.slice(0, config.maxInitialFarms)
}

interface SmartMapComponentProps {
  farms: FarmShop[] | null
  filteredFarms: FarmShop[] | null
  userLoc: { lat: number; lng: number } | null
  setUserLoc: (loc: { lat: number; lng: number } | null) => void
  bounds: { west: number; south: number; east: number; north: number } | null
  setBounds: (bounds: { west: number; south: number; east: number; north: number } | null) => void
  selectedFarmId: string | null
  onSelectFarmId: (farmId: string | null) => void
  onCameraMovingChange?: (isMoving: boolean) => void
  loadFarmData: () => void
  isLoading: boolean
  error: string | null
  retryCount: number
  isRetrying: boolean
  dataQuality: { total: number; valid: number; invalid: number } | null
}

// UK center coordinates
const UK_CENTER = { lat: 54.5, lng: -2.5 }

export default function SmartMapComponent({
  farms,
  filteredFarms,
  userLoc,
  setUserLoc,
  bounds,
  setBounds,
  selectedFarmId,
  onSelectFarmId,
  onCameraMovingChange,
  loadFarmData,
  isLoading,
  error,
  retryCount,
  isRetrying,
  dataQuality
}: SmartMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [showAllFarms, setShowAllFarms] = useState(false)
  const [filterConfig, setFilterConfig] = useState<SmartFilterConfig>(DEFAULT_FILTER_CONFIG)

  // Smart filtered farms with distance calculations
  const smartFarms = useMemo(() => {
    if (!farms) return []
    
    // Use filtered farms if search is active, otherwise use smart filtering
    const farmsToProcess = filteredFarms && filteredFarms.length < farms.length 
      ? filteredFarms 
      : farms

    return getSmartFilteredFarms(farmsToProcess, userLoc, filterConfig)
  }, [farms, filteredFarms, userLoc, filterConfig])

  // Handle map load
  const handleMapLoad = useCallback(() => {
    // Map is loaded, we can access it through the useMap hook if needed
    console.log('Smart map loaded')
  }, [])

  // Handle camera changes
  const handleCameraChanged = useCallback((event: any) => {
    const map = event.target
    if (map) {
      setMap(map)
      
      // Update bounds
      const bounds = map.getBounds()
      if (bounds) {
        setBounds({
          west: bounds.getSouthWest().lng(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          north: bounds.getNorthEast().lat()
        })
      }

      // Notify parent of camera movement
      if (onCameraMovingChange) {
        onCameraMovingChange(false)
      }
    }
  }, [setBounds, onCameraMovingChange])

  // Handle camera moving
  const handleCameraMoving = useCallback(() => {
    if (onCameraMovingChange) {
      onCameraMovingChange(true)
    }
  }, [onCameraMovingChange])

  // Get user location with enhanced error handling
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLoc(newLocation)
        
        // Smoothly pan to user location
        if (map) {
          map.panTo(newLocation)
          map.setZoom(10) // Closer zoom for user location
        }
      },
      (error) => {
        console.log('Geolocation error:', error)
        // Default to UK center if geolocation fails
        setUserLoc(UK_CENTER)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [map, setUserLoc])

  // Enhanced error handling
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-red-500 mb-4">
          <X className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Map Loading Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadFarmData}
          disabled={isRetrying}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Smart Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Location Button */}
        <button
          onClick={getUserLocation}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title="Find my location"
        >
          <MapPin className="w-5 h-5 text-gray-700" />
        </button>

        {/* Smart Filter Toggle */}
        <button
          onClick={() => setShowAllFarms(!showAllFarms)}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title={showAllFarms ? "Show smart view" : "Show all farms"}
        >
          <Filter className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Smart Stats Overlay */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
        <div className="text-sm text-gray-700">
          <div className="font-semibold mb-1">Smart View</div>
          <div>{smartFarms.length} of {farms?.length || 0} farms</div>
          {userLoc && (
            <div className="text-xs text-gray-500 mt-1">
              Showing farms within {filterConfig.maxDefaultDistance}km
            </div>
          )}
        </div>
      </div>

      {/* Main Map */}
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          mapId="smart-farm-map"
          center={userLoc || UK_CENTER}
          zoom={DEFAULT_ZOOM}
          onCameraChanged={handleCameraChanged}
          className="w-full h-full"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
        >
          {/* Smart Farm Markers */}
          {smartFarms.map((farm) => {
            const farmWithDistance = farm as FarmShop & { distance?: number; markerColor?: string }
            return (
              <AdvancedMarker
                key={farm.id}
                position={{
                  lat: farm.location!.lat,
                  lng: farm.location!.lng
                }}
                title={farm.name}
                onClick={() => onSelectFarmId(farm.id)}
              >
                <div
                  className="smart-marker"
                  style={{
                    background: farmWithDistance.markerColor || getMarkerColor(farmWithDistance.distance || Infinity),
                    border: '2px solid white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    🏠
                  </div>
                  
                  {/* Distance badge for close farms */}
                  {farmWithDistance.distance && farmWithDistance.distance <= 15 && (
                    <div
                      className="distance-badge"
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#1F2937',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 4px',
                        borderRadius: '8px',
                        border: '1px solid white',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {Math.round(farmWithDistance.distance)}km
                    </div>
                  )}
                </div>
              </AdvancedMarker>
            )
          })}

                      {/* Selected Farm Info Window */}
            {selectedFarmId && smartFarms.find(f => f.id === selectedFarmId) && (
              <InfoWindow
                position={{
                  lat: smartFarms.find(f => f.id === selectedFarmId)!.location!.lat,
                  lng: smartFarms.find(f => f.id === selectedFarmId)!.location!.lng
                }}
                onCloseClick={() => onSelectFarmId(null)}
              >
                <ResponsiveInfoWindow
                  selectedFarm={smartFarms.find(f => f.id === selectedFarmId)!}
                  userLoc={userLoc}
                  onClose={() => onSelectFarmId(null)}
                  calculateDistance={calculateDistance}
                />
              </InfoWindow>
            )}
        </Map>
      </APIProvider>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">Loading Smart Map...</div>
            <div className="text-sm text-gray-500 mt-2">
              Optimizing your view with {smartFarms.length} relevant farms
            </div>
          </div>
        </div>
      )}

      {/* Transition Indicator */}
      <TransitionIndicator isVisible={isLoading} />
    </div>
  )
}

// Helper function for directions
const handleDirections = (farm: FarmShop) => {
  if (farm.location) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${farm.location.lat},${farm.location.lng}`
    window.open(url, '_blank')
  }
}
