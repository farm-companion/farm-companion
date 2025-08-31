'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MapPin, Filter, X, Navigation } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

interface MapSearchProps {
  onSearch: (query: string) => void
  onNearMe: () => void
  onFilterChange: (filters: FilterState) => void
  counties: string[]
  categories: string[]
  className?: string
}

interface FilterState {
  county?: string
  category?: string
}

export default function MapSearch({
  onSearch,
  onNearMe,
  onFilterChange,
  counties,
  categories,
  className = ''
}: MapSearchProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [showFilters, setShowFilters] = useState(false)
  const [isNearMeLoading, setIsNearMeLoading] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, onSearch])

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!searchRef.current || !window.google?.maps?.places) return

    autocompleteRef.current = new google.maps.places.Autocomplete(searchRef.current, {
      types: ['postal_code'],
      componentRestrictions: { country: 'uk' },
      fields: ['geometry', 'formatted_address']
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (place?.geometry?.location) {
        const { lat, lng } = place.geometry.location
        setQuery(place.formatted_address || '')
        // You can emit the coordinates here if needed
        console.log('Selected location:', { lat: lat(), lng: lng() })
      }
    })

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [])

  const handleNearMe = useCallback(async () => {
    setIsNearMeLoading(true)
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser')
        return
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const { latitude, longitude } = position.coords
      console.log('User location:', { lat: latitude, lng: longitude })
      onNearMe()
    } catch (error) {
      console.error('Geolocation error:', error)
      alert('Unable to get your location. Please check your browser permissions.')
    } finally {
      setIsNearMeLoading(false)
    }
  }, [onNearMe])

  const handleFilterChange = useCallback((key: keyof FilterState, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }, [filters, onFilterChange])

  const clearFilters = useCallback(() => {
    setFilters({})
    onFilterChange({})
  }, [onFilterChange])

  const hasActiveFilters = filters.county || filters.category

  return (
    <div className={`bg-white shadow-lg rounded-lg p-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by name, postcode, or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-serum focus:border-transparent outline-none transition-all"
            aria-label="Search farms"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button
          onClick={handleNearMe}
          disabled={isNearMeLoading}
          className="px-4 py-3 bg-serum text-white rounded-lg hover:bg-serum/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          aria-label="Find farms near me"
        >
          <Navigation className="w-4 h-4" />
          {isNearMeLoading ? '...' : 'Near Me'}
        </button>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-serum rounded-full" />
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div id="filter-panel" className="space-y-4">
          {/* County Filter */}
          <div>
            <label htmlFor="county-filter" className="block text-sm font-medium text-gray-700 mb-2">
              County
            </label>
            <select
              id="county-filter"
              value={filters.county || ''}
              onChange={(e) => handleFilterChange('county', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-serum focus:border-transparent outline-none"
            >
              <option value="">All counties</option>
              {counties.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category-filter"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-serum focus:border-transparent outline-none"
            >
              <option value="">All categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.county && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-serum/10 text-serum rounded-full text-sm">
              {filters.county}
              <button
                onClick={() => handleFilterChange('county', undefined)}
                className="hover:bg-serum/20 rounded-full p-0.5"
                aria-label={`Remove ${filters.county} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-serum/10 text-serum rounded-full text-sm">
              {filters.category}
              <button
                onClick={() => handleFilterChange('category', undefined)}
                className="hover:bg-serum/20 rounded-full p-0.5"
                aria-label={`Remove ${filters.category} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
