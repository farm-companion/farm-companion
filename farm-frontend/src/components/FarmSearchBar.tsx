'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, MapPin, CheckCircle } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

export default function FarmSearchBar({ farms }: { farms: FarmShop[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [filteredFarms, setFilteredFarms] = useState<FarmShop[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Filter farms based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFarms([])
      setShowResults(false)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = farms.filter(farm => 
      farm.name.toLowerCase().includes(query) ||
      farm.location.address.toLowerCase().includes(query) ||
      farm.location.county.toLowerCase().includes(query) ||
      (farm.location.postcode && farm.location.postcode.toLowerCase().includes(query))
    ).slice(0, 8) // Limit to 8 results for better UX

    setFilteredFarms(filtered)
    setShowResults(true)
  }, [searchQuery, farms])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
        setIsSearchFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFarmClick = (farm: FarmShop) => {
    setSearchQuery('')
    setShowResults(false)
    setIsSearchFocused(false)
    
    // Scroll to the farm card
    const element = document.getElementById(`farm-${farm.slug}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add highlight effect
      element.classList.add('ring-2', 'ring-serum', 'ring-opacity-50')
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-serum', 'ring-opacity-50')
      }, 2000)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto mb-8">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-muted dark:text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="Search farms by name, address, county, or postcode..."
          className="w-full pl-12 pr-12 py-4 bg-white dark:bg-gray-800 border border-border-default/30 rounded-2xl text-text-heading dark:text-white placeholder-text-muted dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-serum focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              setShowResults(false)
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted dark:text-gray-400 hover:text-text-heading dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && filteredFarms.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-border-default/30 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-text-muted dark:text-gray-400 px-3 py-2 uppercase tracking-wide">
              {filteredFarms.length} result{filteredFarms.length !== 1 ? 's' : ''} found
            </div>
            {filteredFarms.map((farm) => (
              <button
                key={farm.id}
                onClick={() => handleFarmClick(farm)}
                className="w-full text-left p-3 rounded-xl hover:bg-background-canvas dark:hover:bg-gray-700 transition-colors duration-150 group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-serum/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-serum" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-heading dark:text-white group-hover:text-serum transition-colors truncate">
                      {farm.name}
                    </div>
                    <div className="text-sm text-text-muted dark:text-gray-400 truncate">
                      {farm.location.address}
                      {farm.location.postcode && ` • ${farm.location.postcode}`}
                    </div>
                    <div className="text-xs text-text-muted dark:text-gray-400 mt-1">
                      {farm.location.county}
                    </div>
                  </div>
                  {farm.verified && (
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified</span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && searchQuery && filteredFarms.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-border-default/30 rounded-2xl shadow-xl z-50 p-6 text-center">
          <div className="text-text-muted dark:text-gray-400 mb-2">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <div className="font-medium text-text-heading dark:text-white mb-1">No farms found</div>
            <div className="text-sm">Try searching with different keywords or browse by county below</div>
          </div>
        </div>
      )}
    </div>
  )
}
