'use client'

import { useState, useCallback } from 'react'
import { MapPin, Phone, Globe, Clock, Star, Navigation, Circle } from 'lucide-react'
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
}

export default function FarmList({
  farms,
  selectedFarmId,
  onFarmSelect,
  className = '',
  formatDistance
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
        className={`p-4 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1 ${
          isSelected
            ? 'bg-brand-primary/5 dark:bg-brand-primary/10 border-l-4 border-l-brand-primary shadow-sm'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-l-4 border-l-transparent'
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
            <h3 className={`font-semibold truncate transition-colors ${isSelected ? 'text-brand-primary' : 'text-neutral-900 dark:text-white'}`}>{farm.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand-primary" />
              <span className="truncate">
                {farm.location.address}, {farm.location.county}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {/* Opening Status */}
            {openingStatus && (
              <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                openingStatus.isOpen
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800/50'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-100 dark:border-neutral-700/50'
              }`}>
                <Circle className={`w-2 h-2 ${openingStatus.isOpen ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">
                  {openingStatus.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            )}

            {/* Verified Badge */}
            {farm.verified && (
              <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-800/50">
                <Star className="w-3 h-3" />
                <span className="hidden sm:inline">Verified</span>
              </div>
            )}

            {/* Distance Badge */}
            {hasDistance && (
              <div className="flex items-center gap-1 text-xs font-medium text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full border border-brand-primary/20">
                <Navigation className="w-3 h-3" />
                <span>{formatDistance(farm.distance!)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Farm Details */}
        <div className="space-y-3">
          {/* Offerings */}
          {farm.offerings && farm.offerings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {farm.offerings.slice(0, 3).map((offering, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2.5 py-1 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded-full border border-brand-primary/20"
                >
                  {offering}
                </span>
              ))}
              {farm.offerings.length > 3 && (
                <span className="inline-block px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-medium rounded-full">
                  +{farm.offerings.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Contact Info */}
          {hasContact && (
            <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
              {farm.contact?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">{farm.contact.phone}</span>
                </div>
              )}
              {farm.contact?.website && (
                <a
                  href={farm.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-brand-primary hover:text-brand-primary/80 transition-colors font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="truncate">Website</span>
                </a>
              )}
            </div>
          )}

          {/* Opening Hours */}
          {hasHours && farm.hours && (
            <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <div className="min-w-0">
                {openingStatus && !openingStatus.isOpen && openingStatus.nextOpening && (
                  <div className="text-orange-500 font-medium mb-1 text-xs">
                    {openingStatus.nextOpening}
                  </div>
                )}
                {farm.hours.slice(0, 2).map((hour, idx) => (
                  <div key={idx} className="truncate text-xs">
                    {hour.day}: {hour.open} - {hour.close}
                  </div>
                ))}
                {farm.hours.length > 2 && (
                  <span className="text-neutral-400 dark:text-neutral-500 text-xs">+{farm.hours.length - 2} more days</span>
                )}
              </div>
            </div>
          )}

          {/* Description (expanded view) */}
          {isExpanded && farm.description && (
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {farm.description}
              </p>
            </div>
          )}
        </div>

        {/* Distance indicator (if available) */}
        {hasDistance && (
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-brand-primary" />
            <span>{formatDistance(farm.distance!)} away</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <QuickActions farm={farm} variant="compact" />
        </div>
      </div>
    )
  }, [selectedFarmId, expandedFarmId, handleFarmClick, formatDistance])

  const EmptyState = useCallback(() => (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
        <MapPin className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No farms found</h3>
      <p className="text-neutral-500 dark:text-neutral-400 max-w-sm text-sm">
        Try adjusting your search or filters to find farm shops in your area.
      </p>
    </div>
  ), [])

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
