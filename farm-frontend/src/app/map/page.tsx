'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Search } from 'lucide-react'
import { calculateDistance, formatDistance } from '@/features/locations'
import { MapSearch, LocationTracker } from '@/features/map'
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

// Dynamic imports for performance
const MapShellWithNoSSR = dynamic(() => import('@/features/map/ui/MapShell'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background-canvas">
      <div className="px-6 text-center">
        <div className="relative mb-4">
          <div className="border-3 mx-auto h-12 w-12 rounded-full border-border-default"></div>
          <div className="border-3 absolute inset-0 mx-auto h-12 w-12 animate-spin rounded-full border-brand-primary border-t-transparent"></div>
        </div>
        <h3 className="mb-1 text-base font-semibold text-text-heading">Loading Map</h3>
        <p className="text-sm text-text-body">Preparing your farm discovery experience...</p>

        {/* Map skeleton */}
        <div className="relative mx-auto mt-6 h-24 w-32 overflow-hidden rounded-lg bg-background-surface">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
      </div>
    </div>
  ),
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
          maximumAge: 60000,
        })
      })

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
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
      timestamp: Date.now(),
    })
  }, [])

  // Filter and search farms
  const filteredAndSearchedFarms = useMemo(() => {
    // 1) derive distance (no mutation)
    let result = farms.map((f) => {
      const d = userLocation
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            f.location.lat,
            f.location.lng
          )
        : undefined
      return { ...f, distance: d }
    })

    // 2) search
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase()
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.location.address.toLowerCase().includes(q) ||
          f.location.postcode.toLowerCase().includes(q) ||
          f.location.county.toLowerCase().includes(q) ||
          f.offerings?.some((o) => o.toLowerCase().includes(q))
      )
    }

    // 3) filters
    if (filters.county) result = result.filter((f) => f.location.county === filters.county)
    if (filters.category)
      result = result.filter((f) => f.offerings?.some((o) => o === filters.category))

    if (filters.openNow) {
      result = result.filter((f) => {
        if (!f.hours || !f.hours.length) return false
        const now = new Date()
        const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        const time = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        })
        const h = f.hours.find((x) => x.day.toLowerCase() === day)
        if (!h) return false
        const open = h.open.toLowerCase(),
          close = h.close.toLowerCase()
        if (open === 'closed' || close === 'closed') return false
        if (open === '24 hours' || close === '24 hours') return true
        // overnight
        return close < open ? time >= open || time <= close : time >= open && time <= close
      })
    }

    // 4) map bounds (debounced)
    if (debouncedBounds) {
      result = result.filter((f) =>
        debouncedBounds.contains(new google.maps.LatLng(f.location.lat, f.location.lng))
      )
    }

    // 5) final sort by distance if we have one
    if (userLocation)
      result = result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

    return result
  }, [farms, userLocation, debouncedQuery, filters, debouncedBounds])

  // Update filtered farms when the computed result changes
  useEffect(() => {
    setFilteredFarms(filteredAndSearchedFarms)
  }, [filteredAndSearchedFarms])

  // Get unique counties and categories for filters
  const counties = useMemo(() => {
    const uniqueCounties = new Set(farms.map((farm) => farm.location.county))
    return Array.from(uniqueCounties).sort()
  }, [farms])

  const categories = useMemo(() => {
    const allOfferings = farms.flatMap((farm) => farm.offerings || [])
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
      <div className="flex min-h-screen items-center justify-center bg-background-canvas p-4">
        <div className="mx-auto max-w-sm text-center">
          <div className="relative mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-error-light">
              <svg
                className="h-10 w-10 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-3 text-xl font-semibold text-text-heading">
            Oops! Something went wrong
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-text-body">{error}</p>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="h-12 w-full rounded-xl bg-brand-primary px-6 font-medium text-white shadow-premium-lg transition-[background-color,transform] duration-150 hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              Try Again
            </button>
            <button
              onClick={() => setError(null)}
              className="h-12 w-full rounded-lg px-6 font-medium text-text-body transition-colors duration-150 hover:bg-background-surface"
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
      <div className="mx-auto max-w-7xl">
        {/* Search and Filters - Desktop Only */}
        <div className="hidden p-4 md:block">
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
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 md:hidden">
            <div className="pointer-events-auto px-3 pb-1 pt-2">
              {/* Ultra-compact search input - minimal height */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-text-muted" />
                <input
                  type="text"
                  placeholder="Search farms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background-canvas/85 border-border-default/40 w-full rounded-lg border py-1.5 pl-8 pr-2 text-xs shadow-sm backdrop-blur-sm transition-[border-color,box-shadow] duration-150 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-border-focus"
                  aria-label="Search farms"
                />

                {/* Minimal search indicator */}
                {searchQuery && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 transform">
                    <div className="h-1 w-1 animate-pulse rounded-full bg-brand-primary"></div>
                  </div>
                )}
              </div>

              {/* Ultra-compact quick filters - minimal space */}
              {!searchQuery && (
                <div className="mt-1.5 flex items-center gap-1 overflow-x-auto">
                  <button
                    onClick={() => setSearchQuery('organic')}
                    className="whitespace-nowrap rounded-md border border-brand-primary/20 bg-brand-primary/10 px-1.5 py-0.5 text-xs font-medium text-brand-primary transition-colors duration-150 hover:bg-brand-primary/20"
                  >
                    Organic
                  </button>
                  <button
                    onClick={() => setSearchQuery('eggs')}
                    className="hover:bg-background-elevated whitespace-nowrap rounded-md border border-border-default bg-background-surface px-1.5 py-0.5 text-xs font-medium text-text-body transition-colors duration-150"
                  >
                    Eggs
                  </button>
                  <button
                    onClick={() => setSearchQuery('vegetables')}
                    className="hover:bg-background-elevated whitespace-nowrap rounded-md border border-border-default bg-background-surface px-1.5 py-0.5 text-xs font-medium text-text-body transition-colors duration-150"
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
              className="h-full w-full"
            />
          </div>

          {/* Mobile: Enhanced Bottom Sheet with Farm List */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 md:hidden">
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
              <div className="bg-background-canvas/95 border-b border-border-default px-4 py-4 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-brand-primary"></div>
                      <span className="text-sm font-semibold text-text-heading">
                        {filteredFarms.length} farms nearby
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-1 h-1 w-8 rounded-full bg-border-default"></div>
                    <span className="text-xs font-medium text-text-muted">Pull up</span>
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
                    onClick={() => {
                      /* TODO: Implement quick filters */
                    }}
                    className="hover:bg-background-elevated flex items-center gap-2 rounded-lg border border-border-default bg-background-surface px-3 py-2 transition-colors duration-150"
                  >
                    <span className="h-4 w-4 text-text-body">⚡</span>
                    <span className="text-xs font-medium text-text-body">Quick</span>
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
          <div className="absolute bottom-0 right-0 top-0 hidden w-96 border-l border-border-default bg-background-canvas shadow-premium-lg md:block">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-background-canvas p-8 text-center shadow-premium-xl">
            <div className="relative mb-6">
              <div className="mx-auto h-16 w-16 rounded-full border-4 border-border-default"></div>
              <div className="absolute inset-0 mx-auto h-16 w-16 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text-heading">Loading Farms</h3>
            <p className="text-sm text-text-body">Finding local farm shops near you...</p>

            {/* Progress indicator */}
            <div className="mt-6 h-2 w-full rounded-full bg-background-surface">
              <div
                className="h-2 animate-pulse rounded-full bg-brand-primary"
                style={{ width: '60%' }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
