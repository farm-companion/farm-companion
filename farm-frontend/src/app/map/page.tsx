'use client'

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search, Navigation, Loader2, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { calculateDistance, formatDistance } from '@/features/locations'
import { SearchAreaControl, FilterOverlayPanel } from '@/features/map'
// MapSearch and LocationTracker removed - search is now a floating bar built into the page
import FilterPills, { useFilterPills, applyPillFilters, type FilterPillsState } from '@/features/map/ui/FilterPills'
import { isFarmOpen } from '@/features/map/lib/pin-icons'
import { MapAccessibilityFallback, MapStateDescription } from '@/components/accessibility'
import FarmList from '@/components/FarmList'
import BottomSheet from '@/components/BottomSheet'

import { useHaptic } from '@/components/HapticFeedback'
import FarmPreviewCard from '@/features/map/ui/FarmPreviewCard'
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

function MapPageContent() {
  // Read URL search params for pre-filtering (e.g., /map?q=strawberries)
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [farms, setFarms] = useState<FarmShop[]>([])
  const [filteredFarms, setFilteredFarms] = useState<FarmShop[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
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
  const [hoveredFarmId, setHoveredFarmId] = useState<string | null>(null)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [previewFarm, setPreviewFarm] = useState<FarmShop | null>(null)

  // Filter pills state for quick toggles
  const { filters: pillFilters, setFilters: setPillFilters } = useFilterPills()

  const locationWatchIdRef = useRef<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Base filtered farms (search + panel filters + pill filters, NO bounds)
  // This is what the MAP receives - it handles its own spatial visibility via clustering
  const farmsForMap = useMemo(() => {
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

    // 3) filters (panel filters)
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

    // 3.5) Quick filter pills (floating toggles)
    result = applyPillFilters(result, pillFilters, isFarmOpen)

    // NO bounds filtering here - map handles its own visibility via clustering

    return result
  }, [farms, userLocation, debouncedQuery, filters, pillFilters])

  // Farms for the LIST (includes bounds filtering for "what's in view")
  const farmsForList = useMemo(() => {
    let result = farmsForMap

    // Apply bounds filter for the list only
    if (activeBounds) {
      result = result.filter(f => {
        const { lat, lng } = f.location
        return lat >= activeBounds.south && lat <= activeBounds.north &&
               lng >= activeBounds.west && lng <= activeBounds.east
      })
    }

    // Sort by distance if available
    if (userLocation) {
      result = [...result].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    }

    return result
  }, [farmsForMap, activeBounds, userLocation])

  // Update filtered farms state for components that need it
  useEffect(() => {
    setFilteredFarms(farmsForList)
  }, [farmsForList])

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

  // Handle farm selection - show preview on desktop, scroll on mobile
  const handleFarmSelect = useCallback((farmId: string) => {
    setSelectedFarmId(farmId)
    const farm = farms.find(f => f.id === farmId)
    if (farm && window.innerWidth >= 768) {
      setPreviewFarm(farm)
    } else if (window.innerWidth < 768) {
      const farmElement = document.querySelector(`[data-farm-id="${farmId}"]`)
      if (farmElement) {
        farmElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [farms])

  // Navigate to farm detail page
  const handleViewFarmDetails = useCallback((farmId: string) => {
    const farm = farms.find(f => f.id === farmId)
    if (farm) {
      window.location.href = `/shop/${farm.slug}`
    }
  }, [farms])

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

  // Panel width for responsive padding
  const panelWidth = isDesktop ? (isPanelCollapsed ? 0 : 380) : 0

  return (
    <div className="h-[calc(100svh-var(--header-h,64px))] relative overflow-hidden bg-gray-50 dark:bg-gray-900">
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

      {/* ========== MAP (full viewport, everything else floats on top) ========== */}
      <div className="absolute inset-0">
        <MapShellWithNoSSR
          farms={farmsForMap}
          selectedFarmId={selectedFarmId}
          hoveredFarmId={hoveredFarmId}
          onFarmSelect={handleFarmSelect}
          onFarmHover={setHoveredFarmId}
          onBoundsChange={handleBoundsChange}
          onZoomChange={handleZoomChange}
          userLocation={userLocation}
          bottomSheetHeight={bottomSheetHeight}
          isDesktop={isDesktop}
          onMapReady={setMapInstance}
          className="w-full h-full"
        />
      </div>

      {/* ========== FLOATING SEARCH BAR (on top of map) ========== */}
      <div className="absolute top-3 left-3 right-3 md:left-auto md:right-auto md:top-4 z-20 pointer-events-none flex justify-center"
        style={isDesktop ? { left: '24px', right: `${panelWidth + 24}px` } : undefined}
      >
        <div className="pointer-events-auto w-full md:w-auto md:min-w-[400px] md:max-w-[600px]">
          <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-shadow duration-200">
            <Search className="absolute left-4 w-5 h-5 text-[#8C8C8C]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search farms, produce, or places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-2 py-3 bg-transparent border-none rounded-full text-[16px] text-[#1A1A1A] dark:text-white placeholder-[#8C8C8C] focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
              aria-label="Search farms, produce, or places"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 mr-1 text-[#8C8C8C] hover:text-[#1A1A1A] transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="w-px h-6 bg-[#E0E0E0] mr-2" />
            <button
              onClick={() => { getCurrentLocation(); }}
              disabled={isLocationLoading}
              className="flex items-center gap-1.5 mr-2 px-3 py-1.5 bg-[#2D5016] text-white text-sm font-semibold rounded-full hover:bg-[#234012] disabled:opacity-50 transition-colors whitespace-nowrap"
              aria-label="Find farms near me"
            >
              {isLocationLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Near Me</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========== FLOATING FILTER PILLS (below search bar) ========== */}
      <div className="absolute top-16 md:top-[68px] left-3 z-20 pointer-events-none"
        style={isDesktop ? { left: '24px' } : undefined}
      >
        <div className="pointer-events-auto overflow-x-auto scrollbar-hide">
          <FilterPills
            filters={pillFilters}
            onFilterChange={setPillFilters}
            onMoreClick={() => setIsFilterPanelOpen(true)}
            className="flex-nowrap"
          />
        </div>
      </div>

      {/* ========== SEARCH AS I MOVE (top right, below search) ========== */}
      <div className="absolute top-16 md:top-[68px] z-20"
        style={isDesktop ? { right: `${panelWidth + 24}px` } : { right: '12px' }}
      >
        <SearchAreaControl
          searchAsIMove={searchAsIMove}
          onToggle={handleToggleSearchAsIMove}
          onSearchThisArea={handleSearchThisArea}
          hasPendingSearch={!searchAsIMove && mapBounds !== activeBounds}
          farmCount={filteredFarms.length}
        />
      </div>

      {/* ========== FARM PREVIEW CARD (desktop marker click) ========== */}
      {previewFarm && isDesktop && (
        <div className="absolute z-30 bottom-6 pointer-events-none flex justify-center"
          style={{ left: '24px', right: `${panelWidth + 24}px` }}
        >
          <div className="pointer-events-auto relative">
            <FarmPreviewCard
              farm={previewFarm}
              onClose={() => setPreviewFarm(null)}
              onViewDetails={handleViewFarmDetails}
              formatDistance={formatDistance}
            />
          </div>
        </div>
      )}

      {/* ========== FILTER OVERLAY PANEL ========== */}
      <FilterOverlayPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        counties={counties}
        categories={categories}
        farmCount={filteredFarms.length}
      />

      {/* ========== MOBILE: BOTTOM SHEET ========== */}
      <div
        id="mobile-farm-list-region"
        role="region"
        aria-label="Farm shop list"
        className="md:hidden absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
      >
        <BottomSheet
          isOpen={true}
          snapPoints={[80, 320, 560]}
          defaultSnap={0}
          onHeightChange={(height) => {
            setBottomSheetHeight(height)
            window.dispatchEvent(new CustomEvent('map:setBottomPadding', { detail: height }))
          }}
          nonBlocking
        >
          {/* Bottom Sheet Header */}
          <div className="px-4 pt-2 pb-3 border-b border-[#EDEDED] dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-medium text-[#1A1A1A] dark:text-white">
                {filteredFarms.length} farms nearby
              </span>
              <label className="flex items-center gap-2 text-sm text-[#5C5C5C]">
                <input
                  type="checkbox"
                  checked={searchAsIMove}
                  onChange={handleToggleSearchAsIMove}
                  className="rounded border-gray-300 text-[#2D5016] focus:ring-[#2D5016]"
                />
                Update as I move
              </label>
            </div>
          </div>

          {/* Farm List */}
          <div className="flex-1 overflow-hidden">
            <FarmList
              farms={filteredFarms}
              selectedFarmId={selectedFarmId}
              hoveredFarmId={hoveredFarmId}
              onFarmSelect={handleFarmSelect}
              onFarmHover={setHoveredFarmId}
              userLocation={userLocation}
              formatDistance={formatDistance}
              className="h-full"
            />
          </div>
        </BottomSheet>
      </div>

      {/* ========== DESKTOP: COLLAPSIBLE LIST PANEL ========== */}
      <div
        id="farm-list-region"
        role="complementary"
        aria-label="Farm shop list"
        className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 transition-transform duration-300 ease-out"
        style={{
          width: '380px',
          transform: isPanelCollapsed ? 'translateX(100%)' : 'translateX(0)',
        }}
      >
        <div className="flex flex-col w-full bg-white dark:bg-gray-900 shadow-lg border-l border-[#EDEDED] dark:border-gray-700">
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-[#EDEDED] dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[16px] font-medium text-[#1A1A1A] dark:text-white">
                {filteredFarms.length} farms in view
              </span>
              <button
                onClick={() => setIsPanelCollapsed(true)}
                className="text-sm text-[#8C8C8C] hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
                aria-label="Hide farm list"
              >
                Hide <ChevronRight className="w-3.5 h-3.5 inline" />
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#5C5C5C]">
              <input
                type="checkbox"
                checked={searchAsIMove}
                onChange={handleToggleSearchAsIMove}
                className="rounded border-gray-300 text-[#2D5016] focus:ring-[#2D5016]"
              />
              Update as I move
            </label>
          </div>

          {/* Farm List */}
          <div className="flex-1 overflow-hidden">
            <FarmList
              farms={filteredFarms}
              selectedFarmId={selectedFarmId}
              hoveredFarmId={hoveredFarmId}
              onFarmSelect={handleFarmSelect}
              onFarmHover={setHoveredFarmId}
              userLocation={userLocation}
              formatDistance={formatDistance}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* ========== PANEL EXPAND TAB (visible when collapsed) ========== */}
      {isPanelCollapsed && (
        <button
          onClick={() => setIsPanelCollapsed(false)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 items-center gap-1 pl-2 pr-1 py-3 bg-white dark:bg-gray-900 border border-r-0 border-[#EDEDED] dark:border-gray-700 rounded-l-lg shadow-lg text-sm text-[#5C5C5C] hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
          aria-label="Show farm list"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-medium [writing-mode:vertical-lr] rotate-180">Show list</span>
        </button>
      )}

      {/* ========== LOADING OVERLAY ========== */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl mx-4 max-w-sm w-full">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-gray-100 dark:border-gray-600 rounded-full mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-[#2D5016] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <h3 className="text-body font-semibold text-gray-900 dark:text-white mb-2">Loading Farms</h3>
            <p className="text-gray-600 dark:text-gray-300 text-caption">Finding local farm shops near you...</p>
            <div className="mt-6 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-[#2D5016] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense>
      <MapPageContent />
    </Suspense>
  )
}
