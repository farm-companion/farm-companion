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

  // Compact mobile version - Premium styling
  if (compact) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search farms..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all duration-150"
            aria-label="Search farms"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={handleNearMe}
          disabled={isLocationLoading}
          className={`px-3.5 py-2.5 rounded-xl transition-all duration-150 flex items-center gap-1.5 text-xs font-medium ${
            hasLocation
              ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
              : 'bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-md shadow-brand-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
          } disabled:opacity-50`}
          title="Find farms near me"
        >
          {isLocationLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          Near
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white/98 dark:bg-neutral-900/98 backdrop-blur-xl shadow-xl rounded-2xl p-5 border border-neutral-200/50 dark:border-neutral-700/50 ${className}`}>
      {/* Search Type Toggle - Premium segmented control */}
      <div className="flex mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
        <button
          onClick={() => handleSearchTypeChange('text')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
            searchType === 'text'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-md'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Search
        </button>
        <button
          onClick={() => handleSearchTypeChange('w3w')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
            searchType === 'w3w'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-md'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          what3words
        </button>
      </div>

      {/* Search Bar - Premium styling */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500 w-4 h-4" />
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
            className="w-full pl-11 pr-10 py-3.5 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all duration-150 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
            aria-label={searchType === 'w3w' ? 'Enter what3words address' : 'Search farms'}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
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
            className="px-5 py-3.5 rounded-xl transition-all duration-150 flex items-center gap-2 bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-md shadow-brand-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-md"
            aria-label="Convert what3words address"
          >
            {isW3WLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            <span className="hidden sm:inline font-medium">Convert</span>
          </button>
        )}

        <button
          onClick={handleNearMe}
          disabled={isLocationLoading}
          className={`px-5 py-3.5 rounded-xl transition-all duration-150 flex items-center gap-2 font-medium ${
            hasLocation
              ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
              : 'bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-md shadow-brand-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
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

      {/* what3words Info - Premium info box */}
      {searchType === 'w3w' && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">what3words Address</p>
              <p className="text-blue-600 dark:text-blue-300">Enter a 3-word address like &ldquo;filled.count.soap&rdquo; to find the exact location.</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filters - Premium filter chips */}
      <div className="flex items-center gap-2 mb-4">
        {/* Open Now Filter */}
        <button
          onClick={() => handleFilterChange('openNow', !filters.openNow)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-150 font-medium text-sm ${
            filters.openNow
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
          aria-label="Show only open farms"
        >
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">Open Now</span>
        </button>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 font-medium text-sm"
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">More Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors px-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel - Premium styling */}
      {showFilters && (
        <div id="filter-panel" className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50 animate-fade-in">
          {/* County Filter */}
          <div>
            <label htmlFor="county-filter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              County
            </label>
            <select
              id="county-filter"
              value={filters.county || ''}
              onChange={(e) => handleFilterChange('county', e.target.value || undefined)}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all duration-150"
            >
              <option value="">All counties</option>
              {counties.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Category
            </label>
            <select
              id="category-filter"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all duration-150"
            >
              <option value="">All categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Display - Premium tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.openNow && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium border border-green-100 dark:border-green-800/50">
              <Clock className="w-3.5 h-3.5" />
              Open now
              <button
                onClick={() => handleFilterChange('openNow', undefined)}
                className="hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full p-0.5 transition-colors"
                aria-label="Remove open now filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filters.county && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-medium border border-brand-primary/20">
              {filters.county}
              <button
                onClick={() => handleFilterChange('county', undefined)}
                className="hover:bg-brand-primary/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${filters.county} filter`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-medium border border-brand-primary/20">
              {filters.category}
              <button
                onClick={() => handleFilterChange('category', undefined)}
                className="hover:bg-brand-primary/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${filters.category} filter`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
