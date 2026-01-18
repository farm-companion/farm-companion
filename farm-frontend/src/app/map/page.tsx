'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search } from 'lucide-react'
import { calculateDistance, formatDistance } from '@/features/locations'
import { MapSearch, LocationTracker } from '@/features/map'
import type { ProduceItem } from '@/features/map/ui/ProduceFilter'
import FarmList from '@/components/FarmList'
import { PRODUCE } from '@/data/produce'
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

// Dynamic imports for performance
const MapShellWithNoSSR = dynamic(() => import('@/features/map/ui/MapShell'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center px-6">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-3 border-gray-200 dark:border-gray-600 rounded-full mx-auto"></div>
          <div className="absolute inset-0 w-12 h-12 border-3 border-serum border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Loading Map</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Preparing your farm discovery experience...</p>
        
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
  produce?: string
}

export default function MapPage() {
  const searchParams = useSearchParams()

  // Initialize filters from URL parameters
  const initialFilters = useMemo((): FilterState => {
    const produce = searchParams.get('produce')
    const county = searchParams.get('county')
    const category = searchParams.get('category')
    return {
      ...(produce && { produce }),
      ...(county && { county }),
      ...(category && { category }),
    }
  }, [searchParams])

  const [farms, setFarms] = useState<FarmShop[]>([])
  const [filteredFarms, setFilteredFarms] = useState<FarmShop[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null)
  const [bottomSheetHeight, setBottomSheetHeight] = useState(200)
  const [isDesktop, setIsDesktop] = useState(false)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)

  const locationWatchIdRef = useRef<number | null>(null)

  // Sync filters when URL parameters change
  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

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

  // Convert PRODUCE data to ProduceItem format for filter
  const produceItems: ProduceItem[] = useMemo(() => {
    return PRODUCE.map(p => {
      const months = [...p.monthsInSeason].sort((a, b) => a - b)
      const hasWrap = months.includes(12) && months.includes(1)

      let seasonStart = months[0]
      let seasonEnd = months[months.length - 1]

      if (hasWrap) {
        // Find the gap in months sequence for wrap-around seasons
        for (let i = 0; i < months.length - 1; i++) {
          if (months[i + 1] - months[i] > 1) {
            seasonStart = months[i + 1]
            seasonEnd = months[i]
            break
          }
        }
      }

      return {
        slug: p.slug,
        name: p.name,
        seasonStart,
        seasonEnd,
        category: 'Produce'
      }
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

    // Produce filter - searches offerings and name for produce match
    // This is a placeholder until FarmProduce data is populated
    if (filters.produce) {
      const produceItem = produceItems.find(p => p.slug === filters.produce)
      if (produceItem) {
        const searchTerm = produceItem.name.toLowerCase()
        result = result.filter(f =>
          f.name.toLowerCase().includes(searchTerm) ||
          f.offerings?.some(o => o.toLowerCase().includes(searchTerm))
        )
      }
    }

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
  }, [farms, userLocation, debouncedQuery, filters, debouncedBounds, produceItems])

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
      <div className="min-h-screen flex items-center justify-center bg-background-canvas p-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4 shadow-premium">
              <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-text-heading mb-3">Oops! Something went wrong</h1>
          <p className="text-text-muted mb-6 text-sm leading-relaxed">{error}</p>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full min-h-[48px] px-6 py-3 bg-brand-primary text-white font-medium rounded-xl hover:bg-brand-primary/90 active:scale-95 transition-all duration-fast ease-gentle-spring shadow-premium"
            >
              Try Again
            </button>
            <button
              onClick={() => setError(null)}
              className="w-full min-h-[44px] px-6 py-2.5 text-text-muted font-medium rounded-lg hover:bg-background-surface transition-all duration-fast ease-gentle-spring"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-canvas">
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
            produce={produceItems}
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
          {/* Mobile: Premium Search Bar - Apple-style Design */}
          <div className="md:hidden absolute top-0 left-0 right-0 z-20 pointer-events-none">
            <div className="px-3 pt-3 pb-2 pointer-events-auto">
              {/* Premium search input with proper touch targets */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search farms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background-surface/90 dark:bg-background-surface/90 backdrop-blur-md border border-border-default/50 rounded-xl text-sm text-text-body shadow-premium focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-fast ease-gentle-spring"
                  aria-label="Search farms"
                />

                {/* Search indicator with premium animation */}
                {searchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Quick filters with proper touch targets (min 44px) */}
              {!searchQuery && (
                <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSearchQuery('organic')}
                    className="min-h-[36px] px-4 py-2 bg-brand-primary/10 text-brand-primary text-sm font-medium rounded-lg whitespace-nowrap border border-brand-primary/20 hover:bg-brand-primary/20 active:scale-95 transition-all duration-fast ease-gentle-spring"
                  >
                    Organic
                  </button>
                  <button
                    onClick={() => setSearchQuery('eggs')}
                    className="min-h-[36px] px-4 py-2 bg-background-surface text-text-body text-sm font-medium rounded-lg whitespace-nowrap border border-border-default hover:bg-background-canvas active:scale-95 transition-all duration-fast ease-gentle-spring"
                  >
                    Eggs
                  </button>
                  <button
                    onClick={() => setSearchQuery('vegetables')}
                    className="min-h-[36px] px-4 py-2 bg-background-surface text-text-body text-sm font-medium rounded-lg whitespace-nowrap border border-border-default hover:bg-background-canvas active:scale-95 transition-all duration-fast ease-gentle-spring"
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
              selectedProduce={filters.produce}
            />
          </div>



          {/* Mobile: Enhanced Bottom Sheet with Farm List */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
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
              {/* Premium Bottom Sheet Header - Apple-style Design */}
              <div className="px-4 py-4 border-b border-border-default/50 bg-background-surface/95 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-text-heading">
                        {filteredFarms.length} farms nearby
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-1 bg-border-default rounded-full mx-auto mb-1"></div>
                    <span className="text-xs text-text-muted font-medium">Pull up</span>
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
                    <span className="text-xs font-medium text-gray-700">Quick</span>
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
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-900 shadow-lg border-l border-gray-200 dark:border-gray-700">
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Farms</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Finding local farm shops near you...</p>
            
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
