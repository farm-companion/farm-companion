'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Globe, Clock, Star, Navigation, Circle, X, RefreshCw, Search } from 'lucide-react'
import { Virtuoso } from 'react-virtuoso'
import type { FarmShop } from '@/types/farm'
import { formatOpeningStatus } from '@/lib/opening-hours'
import QuickActions from './QuickActions'

interface FarmListProps {
  farms: FarmShop[]
  selectedFarmId?: string | null
  onFarmSelect: (farmId: string) => void
  className?: string
  userLocation?: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: number
  } | null
  formatDistance?: (distance: number) => string
  hasFilters?: boolean
  hasSearch?: boolean
  searchQuery?: string
  countyFilter?: string
  onClearFilters?: () => void
  onClearSearch?: () => void
}

export default function FarmList({
  farms,
  selectedFarmId,
  onFarmSelect,
  className = '',
  formatDistance,
  hasFilters = false,
  hasSearch = false,
  searchQuery = '',
  countyFilter,
  onClearFilters,
  onClearSearch
}: FarmListProps) {
  const [expandedFarmId, setExpandedFarmId] = useState<string | null>(null)

  const handleFarmClick = useCallback((farmId: string) => {
    onFarmSelect(farmId)
    setExpandedFarmId(expandedFarmId === farmId ? null : farmId)
  }, [onFarmSelect, expandedFarmId])

  const FarmCard = useCallback(({ farm }: { farm: FarmShop; index: number }) => {
    const isSelected = selectedFarmId === farm.id
    const isExpanded = expandedFarmId === farm.id
    const hasContact = farm.contact?.phone || farm.contact?.website
    const hasHours = farm.hours && farm.hours.length > 0
    const hasDistance = farm.distance !== undefined && formatDistance
    const openingStatus = hasHours ? formatOpeningStatus(farm.hours!) : null

    return (
      <div
        className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
          isSelected ? 'bg-serum/5 border-l-4 border-l-serum' : 'hover:bg-gray-50'
        }`}
        onClick={() => handleFarmClick(farm.id)}
        role="button"
        tabIndex={0}
        aria-label={`Select ${farm.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleFarmClick(farm.id)
          }
        }}
      >
        {/* Farm Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{farm.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {farm.location.address}, {farm.location.county}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {/* Opening Status */}
            {openingStatus && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                openingStatus.isOpen 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-gray-50 text-gray-600'
              }`}>
                <Circle className={`w-2 h-2 ${openingStatus.isOpen ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">
                  {openingStatus.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            )}
            
            {/* Verified Badge */}
            {farm.verified && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <Star className="w-3 h-3" />
                <span className="hidden sm:inline">Verified</span>
              </div>
            )}
            
            {/* Distance Badge */}
            {hasDistance && (
              <div className="flex items-center gap-1 text-xs text-serum bg-serum/10 px-2 py-1 rounded-full">
                <Navigation className="w-3 h-3" />
                <span>{formatDistance(farm.distance!)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Farm Details */}
        <div className="space-y-2">
          {/* Offerings */}
          {farm.offerings && farm.offerings.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {farm.offerings.slice(0, 3).map((offering, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-1 bg-serum/10 text-serum text-xs rounded-full"
                >
                  {offering}
                </span>
              ))}
              {farm.offerings.length > 3 && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{farm.offerings.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Contact Info */}
          {hasContact && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {farm.contact?.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span className="truncate">{farm.contact.phone}</span>
                </div>
              )}
              {farm.contact?.website && (
                <a
                  href={farm.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-serum hover:text-serum/80 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="w-3 h-3" />
                  <span className="truncate">Website</span>
                </a>
              )}
            </div>
          )}

          {/* Opening Hours */}
          {hasHours && farm.hours && (
            <div className="flex items-start gap-1 text-sm text-gray-600">
              <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                {openingStatus && !openingStatus.isOpen && openingStatus.nextOpening && (
                  <div className="text-orange-600 font-medium mb-1">
                    {openingStatus.nextOpening}
                  </div>
                )}
                {farm.hours.slice(0, 2).map((hour, idx) => (
                  <div key={idx} className="truncate">
                    {hour.day}: {hour.open} - {hour.close}
                  </div>
                ))}
                {farm.hours.length > 2 && (
                  <span className="text-gray-500">+{farm.hours.length - 2} more days</span>
                )}
              </div>
            </div>
          )}

          {/* Description (expanded view) */}
          {isExpanded && farm.description && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                {farm.description}
              </p>
            </div>
          )}
        </div>

        {/* Distance indicator (if available) */}
        {hasDistance && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            <span>{formatDistance(farm.distance!)} away</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <QuickActions farm={farm} variant="compact" />
        </div>
      </div>
    )
  }, [selectedFarmId, expandedFarmId, handleFarmClick, formatDistance])

  const EmptyState = useCallback(() => (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No farms found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-6">
        {hasSearch && searchQuery
          ? `No results for "${searchQuery}". Try a different search term.`
          : hasFilters
          ? 'No farms match your current filters.'
          : 'Try searching or adjusting the map view to find farm shops.'}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        {/* Clear Search */}
        {hasSearch && searchQuery && onClearSearch && (
          <button
            onClick={onClearSearch}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-serum text-black font-medium rounded-lg hover:bg-serum/90 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear search
          </button>
        )}

        {/* Clear Filters */}
        {hasFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-serum text-black font-medium rounded-lg hover:bg-serum/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Clear filters
          </button>
        )}

        {/* Browse Counties */}
        {countyFilter && (
          <Link
            href="/counties"
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Browse other counties
          </Link>
        )}

        {/* View All Farms */}
        {!hasSearch && !hasFilters && (
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Browse all farms
          </Link>
        )}
      </div>
    </div>
  ), [hasSearch, searchQuery, hasFilters, countyFilter, onClearSearch, onClearFilters])

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Farm List */}
      <div className="flex-1 overflow-hidden">
        {farms.length === 0 ? (
          <EmptyState />
        ) : (
          <Virtuoso
            data={farms}
            itemContent={(index, farm) => <FarmCard farm={farm} index={index} />}
            overscan={5}
            className="h-full"
            components={{
              Footer: () => <div className="h-4" /> // Bottom padding
            }}
          />
        )}
      </div>
    </div>
  )
}
