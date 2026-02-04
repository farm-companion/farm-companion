'use client'

import { useState, useCallback } from 'react'
import { Clock, Leaf, Cherry, Coffee, UtensilsCrossed, SlidersHorizontal, X } from 'lucide-react'

export interface FilterPillsState {
  openNow: boolean
  organic: boolean
  pyo: boolean
  cafe: boolean
  butcher: boolean
}

interface FilterPillsProps {
  filters: FilterPillsState
  onFilterChange: (filters: FilterPillsState) => void
  onMoreClick?: () => void
  className?: string
}

interface PillConfig {
  key: keyof FilterPillsState
  label: string
  icon: React.ReactNode
}

const PILLS: PillConfig[] = [
  { key: 'openNow', label: 'Open Now', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'cafe', label: 'Cafe', icon: <Coffee className="w-3.5 h-3.5" /> },
  { key: 'pyo', label: 'PYO', icon: <Cherry className="w-3.5 h-3.5" /> },
  { key: 'organic', label: 'Organic', icon: <Leaf className="w-3.5 h-3.5" /> },
  { key: 'butcher', label: 'Butcher', icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
]

/**
 * FilterPills - Floating quick-toggle filter buttons on the map.
 * Styled per the god-tier redesign spec: pill-shaped, white default, brand green active.
 */
export default function FilterPills({
  filters,
  onFilterChange,
  onMoreClick,
  className = '',
}: FilterPillsProps) {
  const toggleFilter = useCallback(
    (key: keyof FilterPillsState) => {
      onFilterChange({ ...filters, [key]: !filters[key] })
    },
    [filters, onFilterChange]
  )

  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {PILLS.map((pill) => {
        const isActive = filters[pill.key]
        return (
          <button
            key={pill.key}
            onClick={() => toggleFilter(pill.key)}
            className={`
              flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium
              transition-all duration-150 ease-out whitespace-nowrap
              ${
                isActive
                  ? 'bg-[#2D5016] text-white shadow-sm'
                  : 'bg-white text-[#5C5C5C] border border-[#E0E0E0] hover:bg-[#F5F5F5] hover:border-[#CCCCCC] hover:text-[#1A1A1A] shadow-sm'
              }
            `}
            aria-pressed={isActive}
            aria-label={`${isActive ? 'Remove' : 'Add'} ${pill.label} filter`}
          >
            {pill.icon}
            <span>{pill.label}</span>
          </button>
        )
      })}

      {/* More filters button */}
      {onMoreClick && (
        <button
          onClick={onMoreClick}
          className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium bg-white text-[#5C5C5C] border border-[#E0E0E0] hover:bg-[#F5F5F5] hover:border-[#CCCCCC] hover:text-[#1A1A1A] shadow-sm transition-all duration-150 whitespace-nowrap"
          aria-label="More filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>More</span>
        </button>
      )}

      {activeCount > 0 && (
        <button
          onClick={() =>
            onFilterChange({
              openNow: false,
              organic: false,
              pyo: false,
              cafe: false,
              butcher: false,
            })
          }
          className="flex items-center gap-1 h-9 px-3 rounded-full text-xs text-[#8C8C8C] hover:text-[#1A1A1A] hover:bg-white/80 transition-colors whitespace-nowrap"
          aria-label="Clear all filters"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  )
}

/**
 * Hook to manage filter pills state
 */
export function useFilterPills(initialState?: Partial<FilterPillsState>) {
  const [filters, setFilters] = useState<FilterPillsState>({
    openNow: false,
    organic: false,
    pyo: false,
    cafe: false,
    butcher: false,
    ...initialState,
  })

  return { filters, setFilters }
}

/**
 * Filter farms based on pill state
 */
export function applyPillFilters<T extends {
  offerings?: string[]
  hours?: Array<{ day: string; open: string; close: string }>
}>(
  farms: T[],
  filters: FilterPillsState,
  isFarmOpen: (hours?: Array<{ day: string; open: string; close: string }>) => boolean
): T[] {
  return farms.filter((farm) => {
    if (filters.openNow && !isFarmOpen(farm.hours)) return false

    if (filters.organic) {
      if (!farm.offerings?.some((o) => o.toLowerCase().includes('organic'))) return false
    }

    if (filters.pyo) {
      if (!farm.offerings?.some((o) =>
        o.toLowerCase().includes('pick your own') || o.toLowerCase().includes('pyo')
      )) return false
    }

    if (filters.cafe) {
      if (!farm.offerings?.some((o) =>
        o.toLowerCase().includes('cafe') || o.toLowerCase().includes('coffee') || o.toLowerCase().includes('tea room')
      )) return false
    }

    if (filters.butcher) {
      if (!farm.offerings?.some((o) =>
        o.toLowerCase().includes('butcher') || o.toLowerCase().includes('meat')
      )) return false
    }

    return true
  })
}
