'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Search } from 'lucide-react'
import MapSearch from '@/components/MapSearch'
import FarmList from '@/components/FarmList'
import BottomSheet from '@/components/BottomSheet'
import LocationTracker from '@/components/LocationTracker'
// Removed unused mobile-first components for cleaner imports
import { useHaptic } from '@/components/HapticFeedback'
import type { FarmShop } from '@/types/farm'

// Debouncing hook to prevent excessive re-filtering
function useDebounced<T>(value: T, delay = 150) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

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

  // Debounced values to prevent excessive re-filtering
  const debouncedQuery = useDebounced(searchQuery, 150)
  const debouncedBounds = useDebounced(mapBounds, 150)

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
      // Check permission first (with Safari fallback)
      const canQuery = typeof navigator.permissions?.query === 'function'
      if (canQuery) {
        try {
          const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
          if (perm.state === 'denied') {
            alert('Please enable location access in your browser settings to use this feature')
            setIsLocationLoading(false)
            return
          }
        } catch {
          /* ignore permission query errors */
        }
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      })
      
    } catch (err) {
      console.error('Error getting location:', err)
      alert('Unable to get your location. Please check your browser settings.')
    } finally {
      setIsLocationLoading(false)
    }
  }, [])

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
    // Set the coordinates as user location for distance calculation
    setUserLocation({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      accuracy: 0, // Unknown accuracy for what3words
      timestamp: Date.now()
    })
  }, [])

  // Filter and search farms
  const filteredAndSearchedFarms = useMemo(() => {
    // 1) derive distance (no mutation)
    let result = farms.map(f => {
      const d = userLocation
        ? calculateDistance(userLocation.latitude, userLocation.longitude, f.location.lat, f.location.lng)
        : undefined
      return { ...f, distance: d }
    })

    // 2) search
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase()
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.location.address.toLowerCase().includes(q) ||
        f.location.postcode.toLowerCase().includes(q) ||
        f.location.county.toLowerCase().includes(q) ||
        f.offerings?.some(o => o.toLowerCase().includes(q))
      )
    }

    // 3) filters
    if (filters.county) result = result.filter(f => f.location.county === filters.county)
    if (filters.category) result = result.filter(f => f.offerings?.some(o => o === filters.category))

    if (filters.openNow) {
      result = result.filter(f => {
        if (!f.hours || !f.hours.length) return false
        const now = new Date()
        const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        const h = f.hours.find(x => x.day.toLowerCase() === day)
        if (!h) return false
        const open = h.open.toLowerCase(), close = h.close.toLowerCase()
        if (open === 'closed' || close === 'closed') return false
        if (open === '24 hours' || close === '24 hours') return true
        // overnight
        return close < open ? (time >= open || time <= close) : (time >= open && time <= close)
      })
    }

    // 4) map bounds (debounced)
    if (debouncedBounds) {
      result = result.filter(f => debouncedBounds.contains(new google.maps.LatLng(f.location.lat, f.location.lng)))
    }

    // 5) final sort by distance if we have one
    if (userLocation) result = result.sort((a,b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

    return result
  }, [farms, userLocation, debouncedQuery, filters, debouncedBounds])

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

  // Handle map zoom change
  const handleZoomChange = useCallback(() => {
    // Zoom change handled by MapShell internally
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
      {/* Mobile: Header removed for maximum map space */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Search and Filters - Desktop Only */}
        <div className="hidden md:block p-4">
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
          {/* Mobile: Minimal Search Only */}
          <div className="md:hidden absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <div className="p-3">
              {/* Single search input only */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search farms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-serum focus:border-transparent outline-none text-sm"
                  aria-label="Search farms"
                />
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="map-canvas">
            <MapShellWithNoSSR
              farms={filteredFarms}
              selectedFarmId={selectedFarmId}
              onFarmSelect={handleFarmSelect}
              onBoundsChange={handleBoundsChange}
              onZoomChange={handleZoomChange}
              userLocation={userLocation}
              bottomSheetHeight={bottomSheetHeight}
              isDesktop={isDesktop}
              onMapReady={setMapInstance}
              className="w-full h-full"
            />

            {/* Zoom Helper Overlay - Removed for cleaner UX */}
          </div>

          {/* Mobile: Bottom Sheet with Farm List */}
          <div className="md:hidden">
            <BottomSheet
              isOpen={true}
              snapPoints={[40, 200, 400]}
              defaultSnap={0}
              onHeightChange={(height) => {
                setBottomSheetHeight(height)
                window.dispatchEvent(new CustomEvent('map:setBottomPadding', { detail: height }))
              }}
            >
              {/* Bottom Sheet Header - With Actions */}
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {filteredFarms.length} farms
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="w-6 h-1 bg-gray-300 rounded-full mx-auto mb-1"></div>
                    <span className="text-xs text-gray-500">⌄</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <LocationTracker
                    farms={farms}
                    onLocationUpdate={setUserLocation}
                    onFarmsUpdate={setFarms}
                    onZoomToLocation={zoomToLocation}
                    compact={true}
                  />
                </div>
              </div>
              
              {/* Farm List */}
              <div className="flex-1 overflow-hidden">
                <FarmList
                  farms={filteredFarms}
                  selectedFarmId={selectedFarmId}
                  onFarmSelect={handleFarmSelect}
                  userLocation={userLocation}
                  formatDistance={formatDistance}
                  className="h-full"
                />
              </div>
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
