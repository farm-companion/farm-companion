'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface CountiesSearchProps {
  counties: string[]
}

export default function CountiesSearch({ counties }: CountiesSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCounties, setFilteredCounties] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Filter counties based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCounties([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const query = searchQuery.toLowerCase()
    const filtered = counties.filter(county => 
      county.toLowerCase().includes(query)
    )
    setFilteredCounties(filtered)
  }, [searchQuery, counties])

  // Handle county selection
  const handleCountySelect = (county: string) => {
    const countySlug = county.toLowerCase().replace(/\s+/g, '-')
    window.location.href = `/counties/${countySlug}`
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setFilteredCounties([])
    setIsSearching(false)
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-muted" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search counties..."
          className="w-full pl-12 pr-12 py-4 bg-background-surface border border-border-default rounded-xl text-text-body placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-all duration-200 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-heading transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background-surface border border-border-default rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {filteredCounties.length > 0 ? (
            <div className="py-2">
              {filteredCounties.map((county) => (
                <button
                  key={county}
                  onClick={() => handleCountySelect(county)}
                  className="w-full px-4 py-3 text-left text-text-body hover:bg-background-canvas hover:text-text-heading transition-colors flex items-center justify-between"
                >
                  <span>{county}</span>
                  <span className="text-text-muted text-caption">→</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-text-muted">
              <p>No counties found matching &quot;{searchQuery}&quot;</p>
              <p className="text-caption mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      {/* Search Stats */}
      {searchQuery && (
        <div className="mt-2 text-caption text-text-muted">
          {filteredCounties.length > 0 ? (
            <span>Found {filteredCounties.length} county{filteredCounties.length !== 1 ? 'ies' : 'y'}</span>
          ) : (
            <span>No results found</span>
          )}
        </div>
      )}
    </div>
  )
}
