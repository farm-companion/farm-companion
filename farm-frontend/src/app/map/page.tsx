'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Search, Filter } from 'lucide-react'
import { calculateDistance, formatDistance } from '@/features/locations'
import { MapSearch, LocationTracker, SearchAreaControl, FilterOverlayPanel } from '@/features/map'
import { MapAccessibilityFallback, MapStateDescription } from '@/components/accessibility'
import FarmList from '@/components/FarmList'
import BottomSheet from '@/components/BottomSheet'

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

// Dynamic imports for performance - uses MapShellAuto for automatic provider selection
const MapShellWithNoSSR = dynamic(() => import('@/features/map/ui/MapShellAuto'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center px-6">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-3 border-gray-200 dark:border-gray-600 rounded-full mx-auto"></div>
          <div className="absolute inset-0 w-12 h-12 border-3 border-serum border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h3 className="text-body font-semibold text-gray-800 dark:text-gray-200 mb-1">Charting the Farmland</h3>
        <p className="text-caption text-gray-600 dark:text-gray-400">Harvesting latest updates...</p>

        {/* Map skeleton */}
        <div className="mt-6 w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
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
  // Bounds type is provider-agnostic (works with both Google Maps and MapLibre)
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null)
  const [activeBounds, setActiveBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null)
  const [searchAsIMove, setSearchAsIMove] = useState(true)
  const [bottomSheetHeight, setBottomSheetHeight] = useState(200)
  const [isDesktop, setIsDesktop] = useState(false)
  // Map instance is provider-agnostic (typed as unknown, cast as needed)
  const [mapInstance, setMapInstance] = useState<unknown>(null)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  const locationWatchIdRef = useRef<number | null>(null)
  
  // Mobile-first features
  const { trigger: triggerHaptic } = useHaptic()

  // Debounced values to prevent excessive re-filtering
  const debouncedQuery = useDebounced(searchQuery, 150)
  const debouncedBounds = useDebounced(mapBounds, 150)

  // Live location tracking callbacks


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

  // Zoom to user location - dispatches event for map component to handle
  const zoomToLocation = useCallback(() => {
    if (!userLocation) {
      // If no location, get location first
      getCurrentLocation()
      return
    }

    // Dispatch custom event for map component to handle zoom
    window.dispatchEvent(new CustomEvent('map:zoomToLocation', {
      detail: { lat: userLocation.latitude, lng: userLocation.longitude, zoom: 15 }
    }))

    // Trigger haptic feedback
    triggerHaptic('light')
  }, [userLocation, getCurrentLocation, triggerHaptic])

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

    // 4) map bounds - use activeBounds (controlled by searchAsIMove toggle)
    if (activeBounds) {
      result = result.filter(f => {
        const { lat, lng } = f.location
        return lat >= activeBounds.south && lat <= activeBounds.north &&
               lng >= activeBounds.west && lng <= activeBounds.east
      })
    }

    // 5) final sort by distance if we have one
    if (userLocation) result = result.sort((a,b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

    return result
  }, [farms, userLocation, debouncedQuery, filters, activeBounds])

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
    // Scroll to farm in list if on mobile
    if (window.innerWidth < 768) {
      // Mobile: scroll to farm in bottom sheet
      const farmElement = document.querySelector(`[data-farm-id="${farmId}"]`)
      if (farmElement) {
        farmElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [])

  // Handle map bounds change - receives normalized bounds object
  const handleBoundsChange = useCallback((bounds: unknown) => {
    // Normalize bounds to simple object format (works with both Google Maps and MapLibre)
    const normalizedBounds = bounds as { north: number; south: number; east: number; west: number } | null
    if (normalizedBounds) {
      setMapBounds(normalizedBounds)
      // Auto-update active bounds if search-as-I-move is enabled
      if (searchAsIMove) {
        setActiveBounds(normalizedBounds)
      }
    }
  }, [searchAsIMove])

  // Handle manual search this area
  const handleSearchThisArea = useCallback(() => {
    if (mapBounds) {
      setActiveBounds(mapBounds)
      triggerHaptic('light')
    }
  }, [mapBounds, triggerHaptic])

  // Toggle search as I move
  const handleToggleSearchAsIMove = useCallback(() => {
    setSearchAsIMove(prev => {
      const newValue = !prev
      // If enabling, immediately sync bounds
      if (newValue && mapBounds) {
        setActiveBounds(mapBounds)
      }
      return newValue
    })
    triggerHaptic('light')
  }, [mapBounds, triggerHaptic])

  // Handle map zoom change
  const handleZoomChange = useCallback(() => {
    // Zoom change handled by MapShell internally
  }, [])



  // Cleanup location tracking on unmount
  useEffect(() => {
    return () => {
      const watchId = locationWatchIdRef.current
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-heading font-semibold text-gray-900 dark:text-white mb-3">Oops! Something went wrong</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-caption leading-relaxed">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-serum text-white font-medium rounded-xl hover:bg-serum/90 active:scale-95 transition-all duration-200 shadow-lg"
            >
              Try Again
            </button>
            <button
              onClick={() => setError(null)}
              className="w-full px-6 py-2.5 text-gray-600 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Accessibility: Screen reader map fallback */}
      <MapAccessibilityFallback
        farms={filteredFarms}
        selectedFarmId={selectedFarmId}
        onFarmSelect={handleFarmSelect}
        userLocation={userLocation}
        formatDistance={formatDistance}
        skipTargetId="farm-list-region"
      />
      <MapStateDescription
        farmCount={filteredFarms.length}
        selectedFarm={filteredFarms.find(f => f.id === selectedFarmId)}
      />

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
        <div className="relative h-[100svh] overflow-hidden">
          {/* Mobile: Ultra-Compact Search Bar - Minimal Map Blocking */}
          <div className="md:hidden absolute top-0 left-0 right-0 z-20 pointer-events-none">
            <div className="px-3 pt-2 pb-1 pointer-events-auto">
              {/* Ultra-compact search input - minimal height */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search farms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm border border-gray-200/40 dark:border-gray-600/40 rounded-lg text-small shadow-sm focus:outline-none focus:ring-1 focus:ring-serum focus:border-transparent transition-all duration-200"
                  aria-label="Search farms"
                />
                
                {/* Minimal search indicator */}
                {searchQuery && (
                  <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
                    <div className="w-1 h-1 bg-serum rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              
              {/* Ultra-compact quick filters - minimal space */}
              {!searchQuery && (
                <div className="mt-1.5 flex items-center gap-1 overflow-x-auto">
                  <button 
                    onClick={() => setSearchQuery('organic')}
                    className="px-1.5 py-0.5 bg-serum/10 text-serum text-small font-medium rounded-md whitespace-nowrap border border-serum/20 hover:bg-serum/20 transition-colors"
                  >
                    Organic
                  </button>
                  <button 
                    onClick={() => setSearchQuery('eggs')}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-small font-medium rounded-md whitespace-nowrap border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Eggs
                  </button>
                  <button 
                    onClick={() => setSearchQuery('vegetables')}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-small font-medium rounded-md whitespace-nowrap border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Vegetables
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="absolute inset-0">
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
          </div>

          {/* Search as I Move Control - Top Right */}
          <div className="absolute top-16 md:top-4 right-4 z-20">
            <SearchAreaControl
              searchAsIMove={searchAsIMove}
              onToggle={handleToggleSearchAsIMove}
              onSearchThisArea={handleSearchThisArea}
              hasPendingSearch={!searchAsIMove && mapBounds !== activeBounds}
              farmCount={filteredFarms.length}
            />
          </div>

          {/* Filter Button - Bottom Left (Mobile) */}
          <div className="md:hidden absolute bottom-24 left-4 z-20">
            <button
              onClick={() => setIsFilterPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              <Filter className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Filters</span>
              {(filters.county || filters.category || filters.openNow) && (
                <span className="w-2 h-2 bg-cyan-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Filter Overlay Panel */}
          <FilterOverlayPanel
            isOpen={isFilterPanelOpen}
            onClose={() => setIsFilterPanelOpen(false)}
            filters={filters}
            onFilterChange={handleFilterChange}
            counties={counties}
            categories={categories}
            farmCount={filteredFarms.length}
          />

          {/* Mobile: Enhanced Bottom Sheet with Farm List */}
          <div
            id="mobile-farm-list-region"
            role="region"
            aria-label="Farm shop list"
            className="md:hidden absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
          >
            <BottomSheet
              isOpen={true}
              snapPoints={[40, 200, 400]}
              defaultSnap={0}
              onHeightChange={(height) => {
                setBottomSheetHeight(height)
                window.dispatchEvent(new CustomEvent('map:setBottomPadding', { detail: height }))
              }}
              nonBlocking
            >
              {/* Enhanced Bottom Sheet Header - Mobile-First Design */}
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-serum rounded-full animate-pulse"></div>
                      <span className="text-caption font-semibold text-gray-900 dark:text-white">
                        {filteredFarms.length} farms nearby
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-1"></div>
                    <span className="text-small text-gray-400 font-medium">Pull up</span>
                  </div>
                </div>
                
                {/* Enhanced Action Buttons with Better Visual Hierarchy */}
                <div className="flex items-center gap-3">
                  <LocationTracker
                    farms={farms}
                    onLocationUpdate={setUserLocation}
                    onFarmsUpdate={setFarms}
                    onZoomToLocation={zoomToLocation}
                    compact={true}
                  />
                  
                  {/* Quick Filter Toggle - Mobile-First */}
                  <button 
                    onClick={() => {/* TODO: Implement quick filters */}}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    <span className="w-4 h-4 text-gray-600">⚡</span>
                    <span className="text-small font-medium text-gray-700">Quick</span>
                  </button>
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
          <div
            id="farm-list-region"
            role="region"
            aria-label="Farm shop list"
            className="hidden md:block absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-900 shadow-lg border-l border-gray-200 dark:border-gray-700"
          >
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

      {/* Enhanced Loading Overlay - Mobile-First */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl mx-4 max-w-sm w-full">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-gray-100 dark:border-gray-600 rounded-full mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-serum border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <h3 className="text-body font-semibold text-gray-900 dark:text-white mb-2">Loading Farms</h3>
            <p className="text-gray-600 dark:text-gray-300 text-caption">Finding local farm shops near you...</p>
            
            {/* Progress indicator */}
            <div className="mt-6 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-serum h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
