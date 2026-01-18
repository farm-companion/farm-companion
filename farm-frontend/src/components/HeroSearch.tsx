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
        {/* Main Search Bar - Premium glassmorphism */}
        <div className="relative flex items-center bg-white/98 dark:bg-neutral-900/98 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-700/50 transition-all duration-200 hover:shadow-3xl focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-brand-primary/30">
          <Search className="absolute left-6 w-6 h-6 text-neutral-400" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for farms, produce, or products..."
            className="flex-1 py-6 pl-16 pr-4 text-lg bg-transparent border-none outline-none placeholder-neutral-400 dark:text-white text-neutral-900"
          />

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-4 rounded-xl mx-1 transition-all duration-150 ${showFilters ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400'}`}
            aria-label="Toggle filters"
          >
            <Filter className="w-6 h-6" />
          </button>

          {/* Location Button */}
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={isLocating}
            className={`p-4 rounded-xl mx-1 transition-all duration-150 disabled:opacity-50 ${filters.location ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400'}`}
            aria-label="Use my location"
          >
            {isLocating ? (
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <MapPin className="w-6 h-6" />
            )}
          </button>

          {/* Search Button - Premium */}
          <Button
            type="submit"
            variant="primary"
            className="m-2 px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/90 shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30"
          >
            Search
          </Button>
        </div>

        {/* Filters Panel - Premium card */}
        {showFilters && (
          <div className="mt-4 p-6 bg-white/98 dark:bg-neutral-900/98 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Filters</h3>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toggleFilter('organic')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  filters.organic
                    ? 'bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-md shadow-brand-primary/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                Organic
              </button>

              <button
                type="button"
                onClick={() => toggleFilter('pickYourOwn')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  filters.pickYourOwn
                    ? 'bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-md shadow-brand-primary/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                Pick Your Own
              </button>

              <button
                type="button"
                onClick={() => toggleFilter('farmShop')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  filters.farmShop
                    ? 'bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-md shadow-brand-primary/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                Farm Shop
              </button>

              {filters.location && (
                <button
                  type="button"
                  onClick={clearLocation}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-md shadow-brand-primary/20 hover:shadow-lg transition-all duration-150 flex items-center gap-2"
                >
                  Near me
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Popular Searches - Premium chips */}
      {!query && !showFilters && (
        <div className="mt-6 animate-fade-in">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((search) => (
              <button
                key={search}
                type="button"
                onClick={() => handlePopularSearch(search)}
                className="px-4 py-2 text-sm bg-white/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800 hover:border-brand-primary/30 hover:shadow-md transition-all duration-150 backdrop-blur-sm"
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
