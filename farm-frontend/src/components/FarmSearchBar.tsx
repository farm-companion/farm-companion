'use client'

import { useState, useCallback, useMemo } from 'react'
import { Search } from 'lucide-react'
import { MapPin } from 'lucide-react'
import { X } from 'lucide-react'
import { Filter } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

interface FarmSearchBarProps {
  farms: FarmShop[]
  onSearchResults: (results: FarmShop[]) => void
  className?: string
}

export default function FarmSearchBar({ farms, onSearchResults, className = '' }: FarmSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCounty, setSelectedCounty] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Get unique counties for filter dropdown
  const counties = useMemo(() => {
    const countySet = new Set(farms.map(farm => farm.location.county).filter(Boolean))
    return Array.from(countySet).sort()
  }, [farms])

  // Filter farms based on search query and county filter
  const filteredFarms = useMemo(() => {
    let results = farms

    // Filter by county first
    if (selectedCounty) {
      results = results.filter(farm => farm.location.county === selectedCounty)
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      results = results.filter(farm => {
        const nameMatch = farm.name.toLowerCase().includes(query)
        const addressMatch = farm.location.address.toLowerCase().includes(query)
        const countyMatch = farm.location.county?.toLowerCase().includes(query)
        const descriptionMatch = farm.description?.toLowerCase().includes(query)
        
        return nameMatch || addressMatch || countyMatch || descriptionMatch
      })
    }

    return results
  }, [farms, searchQuery, selectedCounty])

  // Update parent component with search results
  useCallback(() => {
    onSearchResults(filteredFarms)
  }, [filteredFarms, onSearchResults])()

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedCounty('')
  }

  const hasActiveFilters = searchQuery.trim() || selectedCounty

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-border-default/30 shadow-lg ${className}`}>
      {/* Main Search Bar */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search farm shops by name, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search farm shops"
              className="w-full pl-12 pr-4 py-3 bg-background-canvas dark:bg-gray-700 border border-border-default/30 rounded-xl focus:ring-2 focus:ring-serum/50 focus:border-serum transition-all duration-200 text-text-heading dark:text-white placeholder-text-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Hide filters' : 'Show filters'}
            aria-expanded={isExpanded}
            className={`p-3 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
              selectedCounty 
                ? 'bg-serum/10 border-serum/30 text-serum' 
                : 'bg-background-canvas dark:bg-gray-700 border-border-default/30 text-text-muted hover:border-serum/50'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={clearSearch}
              className="px-4 py-3 text-sm text-text-muted hover:text-text-heading dark:hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Expanded Filter Section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border-default/30">
            <div className="flex flex-wrap gap-4">
              {/* County Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-text-heading dark:text-white mb-2">
                  County
                </label>
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  aria-label="Filter by county"
                  className="w-full px-4 py-2 bg-background-canvas dark:bg-gray-700 border border-border-default/30 rounded-lg focus:ring-2 focus:ring-serum/50 focus:border-serum transition-all duration-200 text-text-heading dark:text-white"
                >
                  <option value="">All Counties</option>
                  {counties.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-border-default/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted dark:text-gray-400">
                Showing {filteredFarms.length} of {farms.length} farm shops
              </span>
              {filteredFarms.length > 0 && (
                <span className="text-serum font-medium">
                  {Math.round((filteredFarms.length / farms.length) * 100)}% of total
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
