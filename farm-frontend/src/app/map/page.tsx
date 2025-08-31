'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import MapSearch from '@/components/MapSearch'
import FarmList from '@/components/FarmList'
import BottomSheet from '@/components/BottomSheet'
import LocationTracker from '@/components/LocationTracker'
import PullToRefresh from '@/components/PullToRefresh'
import FloatingActionButton, { createMapFAB } from '@/components/FloatingActionButton'
import { useHaptic } from '@/components/HapticFeedback'
import type { FarmShop } from '@/types/farm'

// Dynamic imports for performance
const MapShellWithNoSSR = dynamic(() => import('@/components/MapShell'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-serum mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  )
})

interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface FilterState {
  county?: string
  category?: string
  openNow?: boolean
}

// Haversine formula for calculating distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Format distance for display
function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

export default function MapPage() {
  const [farms, setFarms] = useState<FarmShop[]>([])
  const [filteredFarms, setFilteredFarms] = useState<FarmShop[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null)
  const [bottomSheetHeight, setBottomSheetHeight] = useState(200)
  const [isDesktop, setIsDesktop] = useState(false)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const locationWatchIdRef = useRef<number | null>(null)
  
  // Mobile-first features
  const { trigger: triggerHaptic } = useHaptic()

  // Fetch farm data
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/farms?limit=2000')
        if (!response.ok) {
          throw new Error('Failed to fetch farms')
        }
        const data = await response.json()
        setFarms(data.farms || [])
      } catch (err) {
        console.error('Error fetching farms:', err)
        setError('Failed to load farm data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFarms()
  }, [])

  // Get user location with consent
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocationLoading(true)
    
    try {
      // Check permission first
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      
      if (permission.state === 'denied') {
        alert('Please enable location access in your browser settings to use this feature')
        setIsLocationLoading(false)
        return
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const location: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      }

      setUserLocation(location)
      
      // Calculate distances for all farms
      const farmsWithDistance = farms.map(farm => ({
        ...farm,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          farm.location.lat,
          farm.location.lng
        )
      }))

      // Sort by distance
      farmsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      setFarms(farmsWithDistance)
      
    } catch (err) {
      console.error('Error getting location:', err)
      alert('Unable to get your location. Please check your browser settings.')
    } finally {
      setIsLocationLoading(false)
    }
  }, [farms])

  // Zoom to user location
  const zoomToLocation = useCallback(() => {
    if (!mapInstance || !userLocation) {
      // If no map or location, get location first
      getCurrentLocation()
      return
    }

    const position = new google.maps.LatLng(userLocation.latitude, userLocation.longitude)
    mapInstance.panTo(position)
    mapInstance.setZoom(15) // Zoom to street level
    
    // Trigger haptic feedback
    triggerHaptic('light')
  }, [mapInstance, userLocation, getCurrentLocation, triggerHaptic])

  // Handle what3words coordinates
  const handleW3WCoordinates = useCallback((coordinates: { lat: number; lng: number }) => {
    // Calculate distances from this location
    const farmsWithDistance = farms.map(farm => ({
      ...farm,
      distance: calculateDistance(
        coordinates.lat,
        coordinates.lng,
        farm.location.lat,
        farm.location.lng
      )
    }))

    // Sort by distance
    farmsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    setFarms(farmsWithDistance)
  }, [farms])

  // Filter and search farms
  const filteredAndSearchedFarms = useMemo(() => {
    let result = farms

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(farm => 
        farm.name.toLowerCase().includes(query) ||
        farm.location.address.toLowerCase().includes(query) ||
        farm.location.postcode.toLowerCase().includes(query) ||
        farm.location.county.toLowerCase().includes(query) ||
        farm.offerings?.some(offering => offering.toLowerCase().includes(query))
      )
    }

    // Apply filters
    if (filters.county) {
      result = result.filter(farm => farm.location.county === filters.county)
    }

    if (filters.category) {
      result = result.filter(farm => 
        farm.offerings?.some(offering => offering === filters.category)
      )
    }

    // Apply "Open Now" filter
    if (filters.openNow) {
      result = result.filter(farm => {
        if (!farm.hours || farm.hours.length === 0) return false
        
        const now = new Date()
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        const currentTime = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        })

        const todayHours = farm.hours.find(h => h.day.toLowerCase() === currentDay)
        if (!todayHours) return false

        // Handle special cases
        if (todayHours.open.toLowerCase() === 'closed' || todayHours.close.toLowerCase() === 'closed') {
          return false
        }

        if (todayHours.open.toLowerCase() === '24 hours' || todayHours.close.toLowerCase() === '24 hours') {
          return true
        }

        // Normal time comparison
        const openTime = todayHours.open
        const closeTime = todayHours.close

        // Handle overnight hours (e.g., 22:00 - 06:00)
        if (closeTime < openTime) {
          return currentTime >= openTime || currentTime <= closeTime
        }

        return currentTime >= openTime && currentTime <= closeTime
      })
    }

    // Filter by map bounds if available
    if (mapBounds) {
      result = result.filter(farm => {
        const position = new google.maps.LatLng(farm.location.lat, farm.location.lng)
        return mapBounds.contains(position)
      })
    }

    return result
  }, [farms, searchQuery, filters, mapBounds])

  // Update filtered farms when the computed result changes
  useEffect(() => {
    setFilteredFarms(filteredAndSearchedFarms)
  }, [filteredAndSearchedFarms])

  // Get unique counties and categories for filters
  const counties = useMemo(() => {
    const uniqueCounties = new Set(farms.map(farm => farm.location.county))
    return Array.from(uniqueCounties).sort()
  }, [farms])

  const categories = useMemo(() => {
    const allOfferings = farms.flatMap(farm => farm.offerings || [])
    const uniqueCategories = new Set(allOfferings)
    return Array.from(uniqueCategories).sort()
  }, [farms])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle near me
  const handleNearMe = useCallback(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  // Handle farm selection
  const handleFarmSelect = useCallback((farmId: string) => {
    setSelectedFarmId(farmId)
  }, [])

  // Handle map bounds change
  const handleBoundsChange = useCallback((bounds: google.maps.LatLngBounds) => {
    setMapBounds(bounds)
  }, [])

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    // Map is loaded and ready
    console.log('Map loaded successfully')
  }, [])

  // Cleanup location tracking on unmount
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current)
      }
    }
  }, [])

  // Detect desktop vs mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-serum text-white rounded-lg hover:bg-serum/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Farm Shop Map</h1>
              <p className="text-sm text-gray-600">
                Discover local farm shops across the UK
              </p>
            </div>
            
            {/* Desktop: Show farm count */}
            <div className="hidden md:block">
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {filteredFarms.length}
                </div>
                <div className="text-sm text-gray-600">farms found</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Search and Filters */}
        <div className="p-4">
          <MapSearch
            onSearch={handleSearch}
            onNearMe={handleNearMe}
            onFilterChange={handleFilterChange}
            onW3WCoordinates={handleW3WCoordinates}
            counties={counties}
            categories={categories}
            isLocationLoading={isLocationLoading}
            hasLocation={userLocation !== null}
          />
          
          {/* Enhanced Location Tracker */}
          <div className="mt-4">
            <LocationTracker
              farms={farms}
              onLocationUpdate={setUserLocation}
              onFarmsUpdate={setFarms}
              onZoomToLocation={zoomToLocation}
              className="max-w-md"
            />
          </div>
        </div>

        {/* Map and List Container */}
        <div className="relative map-shell">
          {/* Map */}
          <div className="map-canvas">
            <MapShellWithNoSSR
              farms={filteredFarms}
              selectedFarmId={selectedFarmId}
              onFarmSelect={handleFarmSelect}
              onMapLoad={handleMapLoad}
              onBoundsChange={handleBoundsChange}
              userLocation={userLocation}
              bottomSheetHeight={bottomSheetHeight}
              isDesktop={isDesktop}
              onMapReady={setMapInstance}
              className="w-full h-full"
            />
          </div>

          {/* Mobile: Bottom Sheet with Farm List */}
          <div className="md:hidden">
            <BottomSheet
              isOpen={true}
              snapPoints={[200, 400, 600]}
              defaultSnap={1}
              onHeightChange={(height) => {
                setBottomSheetHeight(height)
                window.dispatchEvent(new CustomEvent('map:setBottomPadding', { detail: height }))
              }}
            >
              <FarmList
                farms={filteredFarms}
                selectedFarmId={selectedFarmId}
                onFarmSelect={handleFarmSelect}
                userLocation={userLocation}
                formatDistance={formatDistance}
                className="h-full"
              />
            </BottomSheet>
          </div>

          {/* Desktop: Sidebar with Farm List */}
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-96 bg-white shadow-lg border-l border-gray-200">
            <FarmList
              farms={filteredFarms}
              selectedFarmId={selectedFarmId}
              onFarmSelect={handleFarmSelect}
              userLocation={userLocation}
              formatDistance={formatDistance}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-serum mx-auto mb-4"></div>
            <p className="text-gray-600">Loading farm data...</p>
          </div>
        </div>
      )}
    </div>
  )
}
