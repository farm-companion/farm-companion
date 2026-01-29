'use client'

import { useState, useCallback } from 'react'
import { Clock, Leaf, Cherry, Coffee, Sparkles } from 'lucide-react'

export interface FilterPillsState {
  openNow: boolean
  organic: boolean
  pyo: boolean
  cafe: boolean
}

interface FilterPillsProps {
  filters: FilterPillsState
  onFilterChange: (filters: FilterPillsState) => void
  className?: string
}

interface PillConfig {
  key: keyof FilterPillsState
  label: string
  icon: React.ReactNode
  activeColor: string
}

const PILLS: PillConfig[] = [
  {
    key: 'openNow',
    label: 'Open Now',
    icon: <Clock className="w-3.5 h-3.5" />,
    activeColor: 'bg-secondary text-secondary-foreground',
  },
  {
    key: 'organic',
    label: 'Organic',
    icon: <Leaf className="w-3.5 h-3.5" />,
    activeColor: 'bg-secondary text-secondary-foreground',
  },
  {
    key: 'pyo',
    label: 'PYO',
    icon: <Cherry className="w-3.5 h-3.5" />,
    activeColor: 'bg-destructive text-destructive-foreground',
  },
  {
    key: 'cafe',
    label: 'Cafe',
    icon: <Coffee className="w-3.5 h-3.5" />,
    activeColor: 'bg-warning text-warning-foreground',
  },
]

/**
 * FilterPills - Floating quick-toggle filter buttons
 *
 * Sits on top of the map for instant filtering:
 * - Open Now (green) - Shows only currently open farms
 * - Organic (green) - Shows organic certified farms
 * - PYO (red) - Shows Pick Your Own farms
 * - Cafe (amber) - Shows farms with cafes
 */
export default function FilterPills({
  filters,
  onFilterChange,
  className = '',
}: FilterPillsProps) {
  const toggleFilter = useCallback(
    (key: keyof FilterPillsState) => {
      onFilterChange({
        ...filters,
        [key]: !filters[key],
      })
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
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200 ease-out
              shadow-sm hover:shadow-md
              ${
                isActive
                  ? `${pill.activeColor} ring-2 ring-offset-1 ring-offset-background ring-current`
                  : 'bg-card text-foreground-secondary border border-border hover:bg-card-hover hover:border-border-strong'
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

      {activeCount > 0 && (
        <button
          onClick={() =>
            onFilterChange({
              openNow: false,
              organic: false,
              pyo: false,
              cafe: false,
            })
          }
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
          aria-label="Clear all filters"
        >
          <Sparkles className="w-3 h-3" />
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
    // Open Now filter
    if (filters.openNow && !isFarmOpen(farm.hours)) {
      return false
    }

    // Organic filter
    if (filters.organic) {
      const hasOrganic = farm.offerings?.some(
        (o) => o.toLowerCase().includes('organic')
      )
      if (!hasOrganic) return false
    }

    // PYO filter
    if (filters.pyo) {
      const hasPYO = farm.offerings?.some(
        (o) =>
          o.toLowerCase().includes('pick your own') ||
          o.toLowerCase().includes('pyo')
      )
      if (!hasPYO) return false
    }

    // Cafe filter
    if (filters.cafe) {
      const hasCafe = farm.offerings?.some(
        (o) =>
          o.toLowerCase().includes('cafe') ||
          o.toLowerCase().includes('coffee') ||
          o.toLowerCase().includes('tea room')
      )
      if (!hasCafe) return false
    }

    return true
  })
}
