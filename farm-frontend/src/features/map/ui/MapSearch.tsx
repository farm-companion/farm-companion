'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, X, Navigation, Loader2, Globe, Clock, MapPin } from 'lucide-react'
import {
  searchPlaces,
  autocompletePostcode,
  isUKPostcode,
  type GeocodingResult,
} from '@/lib/geocoding'

interface FilterState {
  county?: string
  category?: string
  openNow?: boolean
}

interface SearchSuggestion {
  id: string
  type: 'place' | 'postcode' | 'farm'
  displayName: string
  lat?: number
  lng?: number
  source?: 'nominatim' | 'postcodes.io'
}

interface MapSearchProps {
  onSearch: (query: string) => void
  onNearMe: () => void
  onFilterChange: (filters: FilterState) => void
  onW3WCoordinates?: (coordinates: { lat: number; lng: number }) => void
  onLocationSelect?: (coordinates: { lat: number; lng: number; displayName: string }) => void
  counties: string[]
  categories: string[]
  className?: string
  isLocationLoading?: boolean
  hasLocation?: boolean
  compact?: boolean
  /** Optional farm names for local search suggestions */
  farmNames?: Array<{ name: string; slug: string; lat: number; lng: number }>
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
  onLocationSelect,
  counties,
  categories,
  className = '',
  isLocationLoading = false,
  hasLocation = false,
  compact = false,
  farmNames = [],
}: MapSearchProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [showFilters, setShowFilters] = useState(false)
  const [isW3WLoading, setIsW3WLoading] = useState(false)
  const [searchType, setSearchType] = useState<'text' | 'w3w'>('text')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced search and suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query && searchType === 'text' && query.length >= 2) {
        onSearch(query)
        await fetchSuggestions(query)
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchType, onSearch])

  // Fetch search suggestions using our free geocoding
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    setIsLoadingSuggestions(true)
    const results: SearchSuggestion[] = []

    try {
      // Check for matching farm names first (fast, local)
      if (farmNames.length > 0) {
        const queryLower = searchQuery.toLowerCase()
        const matchingFarms = farmNames
          .filter(farm => farm.name.toLowerCase().includes(queryLower))
          .slice(0, 3)
          .map(farm => ({
            id: `farm-${farm.slug}`,
            type: 'farm' as const,
            displayName: farm.name,
            lat: farm.lat,
            lng: farm.lng,
          }))
        results.push(...matchingFarms)
      }

      // If it looks like a postcode, use fast postcode autocomplete
      if (isUKPostcode(searchQuery) || /^[A-Z]{1,2}[0-9]/i.test(searchQuery)) {
        const postcodes = await autocompletePostcode(searchQuery, 3)
        results.push(
          ...postcodes.map(p => ({
            id: `postcode-${p.postcode}`,
            type: 'postcode' as const,
            displayName: p.displayName,
            source: 'postcodes.io' as const,
          }))
        )
      }

      // Use Nominatim for general place search (rate limited)
      const places = await searchPlaces(searchQuery, { limit: 3 })
      results.push(
        ...places.map((place: GeocodingResult, index: number) => ({
          id: `place-${index}-${place.lat}-${place.lng}`,
          type: 'place' as const,
          displayName: place.displayName,
          lat: place.lat,
          lng: place.lng,
          source: place.source,
        }))
      )

      setSuggestions(results.slice(0, 6)) // Limit to 6 total suggestions
      setShowSuggestions(results.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.warn('[MapSearch] Failed to fetch suggestions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [farmNames])

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(async (suggestion: SearchSuggestion) => {
    setQuery(suggestion.displayName)
    setShowSuggestions(false)

    // If we already have coordinates, emit them
    if (suggestion.lat !== undefined && suggestion.lng !== undefined) {
      onLocationSelect?.({
        lat: suggestion.lat,
        lng: suggestion.lng,
        displayName: suggestion.displayName,
      })
      return
    }

    // For postcodes without coordinates, look them up
    if (suggestion.type === 'postcode') {
      const places = await searchPlaces(suggestion.displayName, { limit: 1 })
      if (places.length > 0) {
        onLocationSelect?.({
          lat: places[0].lat,
          lng: places[0].lng,
          displayName: places[0].displayName,
        })
      }
    }
  }, [onLocationSelect])

  // Keyboard navigation for suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSelectSuggestion])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
      console.warn('[MapSearch] what3words error:', error)
      alert('Invalid what3words address. Please check the format (e.g., "filled.count.soap")')
    } finally {
      setIsW3WLoading(false)
    }
  }, [query, searchType, onW3WCoordinates])

  // Handle search type change
  const handleSearchTypeChange = useCallback((type: 'text' | 'w3w') => {
    setSearchType(type)
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
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
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 w-3 h-3 z-10" />
          <input
            ref={searchRef}
            type="text"
            id="map-search-compact"
            name="map-search"
            placeholder="Search farms..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.length === 0) {
                setSuggestions([])
                setShowSuggestions(false)
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-serum focus:border-transparent outline-none"
            aria-label="Search farms"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="map-search-suggestions-compact"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setSuggestions([])
                setShowSuggestions(false)
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 z-10"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Compact Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
              role="listbox"
            >
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-gray-50' : ''
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <span className="truncate block">{suggestion.displayName}</span>
                </button>
              ))}
            </div>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 w-4 h-4 z-10" />
          <input
            ref={searchRef}
            type="text"
            id="map-search"
            name="map-search"
            placeholder={
              searchType === 'w3w'
                ? "Enter what3words address (e.g., filled.count.soap)"
                : "Search by name, postcode, or address..."
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.length === 0) {
                setSuggestions([])
                setShowSuggestions(false)
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0 && searchType === 'text') {
                setShowSuggestions(true)
              }
            }}
            onKeyDown={(e) => {
              if (searchType === 'w3w' && e.key === 'Enter') {
                e.preventDefault()
                handleW3WSearch()
              } else {
                handleKeyDown(e)
              }
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-serum focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-300 dark:border-gray-600"
            aria-label={searchType === 'w3w' ? 'Enter what3words address' : 'Search farms'}
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls="map-search-suggestions"
            role="combobox"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setSuggestions([])
                setShowSuggestions(false)
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 z-10"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchType === 'text' && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
              role="listbox"
            >
              {isLoadingSuggestions && suggestions.length === 0 && (
                <div className="flex items-center justify-center py-4 text-gray-600 dark:text-gray-300">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm">Searching...</span>
                </div>
              )}

              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {suggestion.type === 'farm' && (
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                    {suggestion.type === 'postcode' && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Navigation className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    {suggestion.type === 'place' && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Globe className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.displayName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {suggestion.type === 'farm' && 'Farm shop'}
                      {suggestion.type === 'postcode' && 'Postcode'}
                      {suggestion.type === 'place' && 'Location'}
                    </p>
                  </div>
                </button>
              ))}

              {!isLoadingSuggestions && suggestions.length === 0 && query.length >= 2 && (
                <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  No suggestions found for &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
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
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
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
