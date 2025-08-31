'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Loader2 } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import MapSearch from '@/components/MapSearch'
import BottomSheet from '@/components/BottomSheet'
import FarmList from '@/components/FarmList'

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-serum" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Loading Map</h1>
        <p className="text-gray-600">Preparing your farm discovery experience...</p>
      </div>
    </div>
  )
})

interface FilterState {
  county?: string
  category?: string
}

export default function MapPage() {
  const [farms, setFarms] = useState<FarmShop[]>([])
  const [filteredFarms, setFilteredFarms] = useState<FarmShop[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counties, setCounties] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Load farm data
  useEffect(() => {
    const loadFarms = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/farms')
        if (!response.ok) {
          throw new Error('Failed to load farm data')
        }

        const data = await response.json()
        setFarms(data.farms)
        setFilteredFarms(data.farms)
        setCounties(data.facets?.counties || [])
        setCategories(data.facets?.categories || [])
      } catch (err) {
        console.error('Error loading farms:', err)
        setError('Failed to load farm data')
      } finally {
        setIsLoading(false)
      }
    }

    loadFarms()
  }, [])

  // Apply search and filters
  useEffect(() => {
    let filtered = farms

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(farm => {
        const searchText = `${farm.name} ${farm.location.address} ${farm.location.county} ${farm.location.postcode}`.toLowerCase()
        return searchText.includes(query)
      })
    }

    // Apply filters
    if (filters.county) {
      filtered = filtered.filter(farm => farm.location.county === filters.county)
    }

    if (filters.category) {
      filtered = filtered.filter(farm => 
        farm.offerings && farm.offerings.includes(filters.category!)
      )
    }

    setFilteredFarms(filtered)
  }, [farms, searchQuery, filters])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle near me
  const handleNearMe = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          
          // Calculate distances and sort by proximity
          const farmsWithDistance = farms.map(farm => {
            if (!farm.location.lat || !farm.location.lng) return farm
            
            const distance = calculateDistance(
              latitude, longitude,
              farm.location.lat, farm.location.lng
            )
            return { ...farm, distance }
          }).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
          
          setFarms(farmsWithDistance)
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Unable to get your location. Please check your browser permissions.')
        }
      )
    }
  }, [farms])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  // Handle farm selection
  const handleFarmSelect = useCallback((farmId: string) => {
    setSelectedFarmId(farmId)
  }, [])

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  // Get selected farm
  const selectedFarm = useMemo(() => {
    return farms.find(farm => farm.id === selectedFarmId)
  }, [farms, selectedFarmId])

  // Map center based on user location or UK center
  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation
    if (selectedFarm) {
      return { lat: selectedFarm.location.lat, lng: selectedFarm.location.lng }
    }
    return { lat: 54.0, lng: -2.0 } // UK center
  }, [userLocation, selectedFarm])

  if (error) {
    return (
      <div className="min-h-screen bg-background-canvas flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Map Unavailable</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-serum text-white rounded-lg hover:bg-serum/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-canvas flex flex-col">
      {/* Header */}
      <div className="bg-background-surface border-b border-border-default/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-heading">Farm Map</h1>
              <p className="text-text-muted">Discover local farm shops across the UK</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <MapPin className="w-4 h-4" />
              <span>{filteredFarms.length} farms found</span>
            </div>
          </div>
          
          {/* Search Component */}
          <MapSearch
            onSearch={handleSearch}
            onNearMe={handleNearMe}
            onFilterChange={handleFilterChange}
            counties={counties}
            categories={categories}
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <Map
          farms={filteredFarms}
          selectedFarmId={selectedFarmId}
          onFarmSelect={handleFarmSelect}
          center={mapCenter}
          zoom={selectedFarm ? 14 : 6}
          className="w-full h-full"
        />
      </div>

      {/* Bottom Sheet with Farm List */}
      <BottomSheet
        isOpen={true}
        snapPoints={[200, 400, 600]}
        defaultSnap={1}
        className="z-50"
      >
        <FarmList
          farms={filteredFarms}
          selectedFarmId={selectedFarmId}
          onFarmSelect={handleFarmSelect}
        />
      </BottomSheet>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-serum" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Farms</h2>
            <p className="text-gray-600">Preparing your farm discovery experience...</p>
          </div>
        </div>
      )}
    </div>
  )
}
