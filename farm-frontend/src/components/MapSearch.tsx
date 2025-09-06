'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, X, Navigation, Loader2, Globe, Clock } from 'lucide-react'

interface FilterState {
  county?: string
  category?: string
  openNow?: boolean
}

interface MapSearchProps {
  onSearch: (query: string) => void
  onNearMe: () => void
  onFilterChange: (filters: FilterState) => void
  onW3WCoordinates?: (coordinates: { lat: number; lng: number }) => void
  counties: string[]
  categories: string[]
  className?: string
  isLocationLoading?: boolean
  hasLocation?: boolean
  compact?: boolean
}

interface W3WResponse {
  coordinates: {
    lat: number
    lng: number
  }
  words: string
  language: string
  map: string
}

export default function MapSearch({
  onSearch,
  onNearMe,
  onFilterChange,
  onW3WCoordinates,
  counties,
  categories,
  className = '',
  isLocationLoading = false,
  hasLocation = false,
  compact = false
}: MapSearchProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [showFilters, setShowFilters] = useState(false)
  const [isW3WLoading, setIsW3WLoading] = useState(false)
  const [searchType, setSearchType] = useState<'text' | 'w3w'>('text')
  const searchRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && searchType === 'text') {
        onSearch(query)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchType, onSearch])

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!searchRef.current || !window.google?.maps?.places) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(searchRef.current, {
      types: ['postal_code'],
      componentRestrictions: { country: 'uk' },
      fields: ['geometry', 'formatted_address']
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (place?.geometry?.location) {
        const { lat, lng } = place.geometry.location
        setQuery(place.formatted_address || '')
        console.log('Selected location:', { lat: lat(), lng: lng() })
      }
    })

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [])

  // Handle what3words search
  const handleW3WSearch = useCallback(async () => {
    if (!query || searchType !== 'w3w') return

    setIsW3WLoading(true)
    try {
      const response = await fetch(`/api/w3w/convert?words=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to convert what3words')
      }
      
      const data: W3WResponse = await response.json()
      console.log('what3words coordinates:', data.coordinates)
      
      // Emit coordinates to parent component
      if (onW3WCoordinates) {
        onW3WCoordinates(data.coordinates)
      }
      
    } catch (error) {
      console.error('what3words error:', error)
      alert('Invalid what3words address. Please check the format (e.g., "filled.count.soap")')
    } finally {
      setIsW3WLoading(false)
    }
  }, [query, searchType, onW3WCoordinates])

  // Handle search type change
  const handleSearchTypeChange = useCallback((type: 'text' | 'w3w') => {
    setSearchType(type)
    setQuery('')
    if (type === 'w3w') {
      // Disable Google Places autocomplete for w3w
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
    } else {
      // Re-enable Google Places autocomplete
      if (searchRef.current && window.google?.maps?.places) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(searchRef.current, {
          types: ['postal_code'],
          componentRestrictions: { country: 'uk' },
          fields: ['geometry', 'formatted_address']
        })
      }
    }
  }, [])

  const handleNearMe = useCallback(() => {
    onNearMe()
  }, [onNearMe])

  const handleFilterChange = useCallback((key: keyof FilterState, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }, [filters, onFilterChange])

  const clearFilters = useCallback(() => {
    setFilters({})
    onFilterChange({})
  }, [onFilterChange])

  const hasActiveFilters = filters.county || filters.category || filters.openNow

  // Compact mobile version
  if (compact) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search farms..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-serum focus:border-transparent outline-none"
            aria-label="Search farms"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        <button
          onClick={handleNearMe}
          disabled={isLocationLoading}
          className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1 text-xs ${
            hasLocation 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-serum text-white hover:bg-serum/90'
          } disabled:opacity-50`}
          title="Find farms near me"
        >
          {isLocationLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Navigation className="w-3 h-3" />
          )}
          Near
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 ${className}`}>
      {/* Search Type Toggle */}
      <div className="flex mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => handleSearchTypeChange('text')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            searchType === 'text' 
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Search
        </button>
        <button
          onClick={() => handleSearchTypeChange('w3w')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            searchType === 'w3w' 
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          what3words
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            ref={searchRef}
            type="text"
            placeholder={
              searchType === 'w3w' 
                ? "Enter what3words address (e.g., filled.count.soap)" 
                : "Search by name, postcode, or address..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchType === 'w3w') {
                e.preventDefault()
                handleW3WSearch()
              }
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-serum focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
            aria-label={searchType === 'w3w' ? 'Enter what3words address' : 'Search farms'}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {searchType === 'w3w' && (
          <button
            onClick={handleW3WSearch}
            disabled={isW3WLoading || !query}
            className="px-4 py-3 rounded-lg transition-colors flex items-center gap-2 bg-serum text-white hover:bg-serum/90 disabled:opacity-50"
            aria-label="Convert what3words address"
          >
            {isW3WLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Convert</span>
          </button>
        )}
        
        <button
          onClick={handleNearMe}
          disabled={isLocationLoading}
          className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
            hasLocation 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-serum text-white hover:bg-serum/90'
          } disabled:opacity-50`}
          aria-label="Find farms near me"
        >
          {isLocationLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {hasLocation ? 'Near Me' : 'Near Me'}
          </span>
        </button>
      </div>

      {/* what3words Info */}
      {searchType === 'w3w' && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">what3words Address</p>
              <p>Enter a 3-word address like &ldquo;filled.count.soap&rdquo; to find the exact location.</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex items-center gap-2 mb-4">
        {/* Open Now Filter */}
        <button
          onClick={() => handleFilterChange('openNow', !filters.openNow)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            filters.openNow 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
          aria-label="Show only open farms"
        >
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">Open Now</span>
        </button>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">More Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-serum rounded-full" />
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
          {filters.openNow && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
              <Clock className="w-3 h-3" />
              Open now
              <button
                onClick={() => handleFilterChange('openNow', undefined)}
                className="hover:bg-green-200 rounded-full p-0.5"
                aria-label="Remove open now filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
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
