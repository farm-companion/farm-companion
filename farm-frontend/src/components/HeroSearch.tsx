'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Filter, X } from 'lucide-react'
import { Button } from './ui/Button'

interface HeroSearchProps {
  onSearch?: (query: string, filters: SearchFilters) => void
  className?: string
}

interface SearchFilters {
  organic?: boolean
  pickYourOwn?: boolean
  farmShop?: boolean
  location?: { latitude: number; longitude: number }
}

const POPULAR_SEARCHES = [
  'Organic vegetables',
  'Pick your own strawberries',
  'Farm shop near me',
  'Fresh eggs',
  'Local meat',
  'Dairy farm'
]

/**
 * Enhanced search component for homepage hero section
 * Features: autocomplete, location detection, filter chips, popular searches
 */
export function HeroSearch({ onSearch, className = '' }: HeroSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (onSearch) {
      onSearch(query, filters)
    } else {
      // Navigate to map/shop page with search params
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (filters.organic) params.set('organic', 'true')
      if (filters.pickYourOwn) params.set('pyo', 'true')
      if (filters.farmShop) params.set('shop', 'true')
      if (filters.location) {
        params.set('lat', filters.location.latitude.toString())
        params.set('lng', filters.location.longitude.toString())
      }

      router.push(`/shop?${params.toString()}`)
    }
  }

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      setFilters(prev => ({
        ...prev,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      }))
    } catch (error) {
      console.error('Error getting location:', error)
      alert('Unable to get your location. Please try searching manually.')
    } finally {
      setIsLocating(false)
    }
  }

  const toggleFilter = (filterKey: keyof Omit<SearchFilters, 'location'>) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }))
  }

  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    inputRef.current?.focus()
  }

  const clearLocation = () => {
    setFilters(prev => {
      const { location, ...rest } = prev
      return rest
    })
  }

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        {/* Main Search Bar */}
        <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-2xl shadow-premium-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-fast hover:shadow-premium-xl focus-within:ring-2 focus-within:ring-brand-primary">
          <Search className="absolute left-6 w-6 h-6 text-gray-400" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for farms, produce, or products..."
            className="flex-1 py-6 pl-16 pr-4 text-lg bg-transparent border-none outline-none placeholder-gray-400 dark:text-white"
          />

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${showFilters ? 'bg-brand-primary/10' : ''}`}
            aria-label="Toggle filters"
          >
            <Filter className={`w-6 h-6 ${showFilters ? 'text-brand-primary' : 'text-gray-400'}`} />
          </button>

          {/* Location Button */}
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={isLocating}
            className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            aria-label="Use my location"
          >
            {isLocating ? (
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <MapPin className={`w-6 h-6 ${filters.location ? 'text-brand-primary' : 'text-gray-400'}`} />
            )}
          </button>

          {/* Search Button */}
          <Button
            type="submit"
            variant="primary"
            className="m-2 px-8 py-4 text-lg font-semibold"
          >
            Search
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-premium border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toggleFilter('organic')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.organic
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Organic
              </button>

              <button
                type="button"
                onClick={() => toggleFilter('pickYourOwn')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.pickYourOwn
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Pick Your Own
              </button>

              <button
                type="button"
                onClick={() => toggleFilter('farmShop')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.farmShop
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Farm Shop
              </button>

              {filters.location && (
                <button
                  type="button"
                  onClick={clearLocation}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors flex items-center gap-2"
                >
                  Near me
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Popular Searches */}
      {!query && !showFilters && (
        <div className="mt-6 animate-fade-in">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((search) => (
              <button
                key={search}
                type="button"
                onClick={() => handlePopularSearch(search)}
                className="px-3 py-1.5 text-sm bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-full hover:bg-white dark:hover:bg-gray-800 hover:shadow-premium transition-all duration-fast backdrop-blur-sm"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
