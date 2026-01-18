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
      className={`relative grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 min-h-[72px] rounded-2xl
                  transition-all duration-200 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
                  ${selected
                    ? 'bg-brand-primary/5 dark:bg-brand-primary/10 border-2 border-brand-primary/30 shadow-sm'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-700/60 hover:border-brand-primary/30 hover:shadow-md hover:-translate-y-0.5'
                  }`}
    >
      {/* Icon */}
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 transition-colors ${
        selected
          ? 'bg-brand-primary/20 dark:bg-brand-primary/30'
          : 'bg-neutral-100 dark:bg-neutral-800'
      }`}>
        <MapPin className={`h-5 w-5 ${selected ? 'text-brand-primary' : 'text-neutral-500 dark:text-neutral-400'}`} />
      </div>

      {/* Content */}
      <div className="min-w-0">
        <div className={`truncate font-semibold transition-colors ${
          selected ? 'text-brand-primary' : 'text-neutral-900 dark:text-white'
        }`}>
          {farm.name}
        </div>
        <div className="truncate text-sm text-neutral-500 dark:text-neutral-400">
          {farm.location?.county || 'UK'}
          {farm.location?.postcode && (
            <span className="ml-2 text-neutral-400 dark:text-neutral-500">| {farm.location.postcode}</span>
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
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-brand-primary/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            aria-label={`Get directions to ${farm.name}`}
          >
            <Navigation className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          </button>
        )}
        <ArrowRight className={`h-4 w-4 flex-shrink-0 transition-colors ${
          selected ? 'text-brand-primary' : 'text-neutral-400 dark:text-neutral-500'
        }`} />
      </div>
    </li>
  )
}
