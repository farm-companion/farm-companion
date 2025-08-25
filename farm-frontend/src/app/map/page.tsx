'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import GoogleMapComponent from '@/components/GoogleMapComponent'
import type { FarmShop } from '@/types/farm'
import { fetchFarmDataClient } from '@/lib/farm-data-client'

export default function MapPage() {
  const [farms, setFarms] = useState<FarmShop[] | null>(null)
  const [filteredFarms, setFilteredFarms] = useState<FarmShop[]>([])
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [bounds, setBounds] = useState<{ west: number; south: number; east: number; north: number } | null>(null)
  const [selectedFarm, setSelectedFarm] = useState<FarmShop | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [dataQuality, setDataQuality] = useState<{ total: number; valid: number; invalid: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadFarmData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 Loading farm data...')
      const farmData = await fetchFarmDataClient()
      console.log('✅ Farm data loaded:', farmData.length, 'farms')
      
      setFarms(farmData)
      setFilteredFarms(farmData)
      
      // Calculate data quality
      const valid = farmData.filter(farm => 
        farm.location?.lat && farm.location?.lng &&
        farm.location.lat >= 49.9 && farm.location.lat <= 60.9 &&
        farm.location.lng >= -8.6 && farm.location.lng <= 1.8
      ).length
      
      setDataQuality({
        total: farmData.length,
        valid,
        invalid: farmData.length - valid
      })
      
      console.log('📊 Data quality:', { total: farmData.length, valid, invalid: farmData.length - valid })
      
    } catch (err) {
      console.error('❌ Failed to load farm data:', err)
      setError('Failed to load farm data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Filter farms based on search query
  useEffect(() => {
    if (!farms) {
      console.log('🔍 Search: No farms data available')
      return
    }
    
    console.log('🔍 Search: Processing query:', searchQuery, 'with', farms.length, 'farms')
    
    if (!searchQuery.trim()) {
      console.log('🔍 Search: Empty query, showing all farms')
      setFilteredFarms(farms)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = farms.filter(farm => 
      farm.name.toLowerCase().includes(query) ||
      farm.location?.county?.toLowerCase().includes(query) ||
      farm.location?.postcode?.toLowerCase().includes(query) ||
      farm.location?.address?.toLowerCase().includes(query)
    )
    
    console.log('🔍 Search: Found', filtered.length, 'matching farms')
    if (filtered.length > 0) {
      console.log('🔍 Search: First matching farm:', filtered[0])
      console.log('🔍 Search: Farm coordinates:', filtered[0].location?.lat, filtered[0].location?.lng)
      
      // If we have search results, update bounds to show them
      const validFarms = filtered.filter(farm => 
        farm.location?.lat && farm.location?.lng && 
        typeof farm.location.lat === 'number' && typeof farm.location.lng === 'number'
      )
      
      if (validFarms.length > 0) {
        const lats = validFarms.map(f => f.location!.lat)
        const lngs = validFarms.map(f => f.location!.lng)
        const newBounds = {
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lngs),
          west: Math.min(...lngs)
        }
        console.log('🔍 Search: Updating bounds to show results:', newBounds)
        setBounds(newBounds)
      }
    }
    setFilteredFarms(filtered)
  }, [searchQuery, farms])

  // Load farm data on mount
  useEffect(() => {
    loadFarmData()
  }, [loadFarmData])

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Geolocation error:', error)
          // Default to UK center if geolocation fails
          setUserLoc({ lat: 54.5, lng: -2.5 })
        }
      )
    } else {
      // Default to UK center if geolocation not available
      setUserLoc({ lat: 54.5, lng: -2.5 })
    }
  }, [])

  if (error && !farms) {
    return (
      <div className="min-h-screen bg-background-canvas flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-heading mb-2">Unable to Load Map</h1>
          <p className="text-text-body mb-4">{error}</p>
          <button
            onClick={loadFarmData}
            className="bg-serum text-black px-4 py-2 rounded-md hover:bg-serum/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background-canvas relative">
      {/* Mobile-friendly Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <div className="relative max-w-sm mx-auto sm:mx-0 sm:max-w-xs lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search farms..."
            className="w-full bg-background-canvas/90 backdrop-blur-sm border border-border-default/30 rounded-full px-10 py-2.5 text-sm text-text-body placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary shadow-md"
            autoComplete="off"
          />
          {/* Search Results Counter */}
          {farms && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-text-muted bg-background-canvas/80 px-2 py-1 rounded-full">
              {filteredFarms.length} of {farms.length}
            </div>
          )}
        </div>
      </div>

      <GoogleMapComponent
        farms={farms}
        filteredFarms={filteredFarms}
        userLoc={userLoc}
        setUserLoc={setUserLoc}
        bounds={bounds}
        setBounds={setBounds}
        selectedFarm={selectedFarm}
        setSelectedFarm={setSelectedFarm}
        loadFarmData={loadFarmData}
        isLoading={isLoading}
        error={error}
        retryCount={retryCount}
        isRetrying={isRetrying}
        dataQuality={dataQuality}
      />
    </div>
  )
}
