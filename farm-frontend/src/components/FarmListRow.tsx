'use client'

import React from 'react'
import { MapPin, ArrowRight, Navigation } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

interface FarmListRowProps {
  farm: FarmShop
  selected: boolean
  onSelect: (farm: FarmShop) => void
  onDirections?: (farm: FarmShop) => void
}

export function FarmListRow({ farm, selected, onSelect, onDirections }: FarmListRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(farm)
    }
  }

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onSelect(farm)}
      onKeyDown={handleKeyDown}
      aria-current={selected ? 'true' : undefined}
      className={`relative grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 min-h-[72px] rounded-2xl 
                  bg-background-canvas hover:bg-background-canvas/70 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  ${selected ? 'ring-2 ring-primary-500 ring-offset-0 bg-primary-50' : ''}`}
    >
      {/* Icon */}
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
        selected ? 'bg-primary-100' : 'bg-primary-50'
      }`}>
        <MapPin className={`h-4 w-4 ${selected ? 'text-primary-700' : 'text-primary-600'}`} />
      </div>
      
      {/* Content */}
      <div className="min-w-0">
        <div className={`truncate font-medium ${
          selected ? 'text-primary-900' : 'text-text-heading'
        }`}>
          {farm.name}
        </div>
        <div className="truncate text-caption text-text-muted">
          {farm.location?.county || 'UK'}
          {farm.location?.postcode && (
            <span className="ml-2">• {farm.location.postcode}</span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        {onDirections && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDirections(farm)
            }}
            className="p-1 rounded-md hover:bg-background-canvas/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={`Get directions to ${farm.name}`}
          >
            <Navigation className="h-4 w-4 text-text-muted" />
          </button>
        )}
        <ArrowRight className={`h-4 w-4 flex-shrink-0 ${
          selected ? 'text-primary-600' : 'text-text-muted'
        }`} />
      </div>
    </li>
  )
}
