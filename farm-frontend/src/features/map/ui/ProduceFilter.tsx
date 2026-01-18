'use client'

import { useMemo } from 'react'
import { Leaf, Check } from 'lucide-react'

export interface ProduceItem {
  slug: string
  name: string
  icon?: string
  seasonStart: number
  seasonEnd: number
  category: string
}

interface ProduceFilterProps {
  produce: ProduceItem[]
  selectedProduce?: string
  onSelect: (slug: string | undefined) => void
  className?: string
}

/**
 * Check if produce is currently in season
 * Handles wrap-around seasons (e.g., Nov-Apr for kale)
 */
function isInSeason(item: ProduceItem, month: number): boolean {
  if (item.seasonStart <= item.seasonEnd) {
    return month >= item.seasonStart && month <= item.seasonEnd
  }
  // Wrap-around season (e.g., Nov-Apr)
  return month >= item.seasonStart || month <= item.seasonEnd
}

/**
 * ProduceFilter Component
 *
 * Displays seasonal produce as selectable filter chips with
 * "In Season" badges for items currently available.
 */
export function ProduceFilter({
  produce,
  selectedProduce,
  onSelect,
  className = ''
}: ProduceFilterProps) {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, [])

  // Sort produce: in-season first, then alphabetically
  const sortedProduce = useMemo(() => {
    return [...produce].sort((a, b) => {
      const aInSeason = isInSeason(a, currentMonth)
      const bInSeason = isInSeason(b, currentMonth)
      if (aInSeason && !bInSeason) return -1
      if (!aInSeason && bInSeason) return 1
      return a.name.localeCompare(b.name)
    })
  }, [produce, currentMonth])

  if (produce.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <Leaf className="w-4 h-4 inline mr-1" />
        Seasonal Produce
      </label>

      <div className="flex flex-wrap gap-2">
        {/* All produce option */}
        <button
          onClick={() => onSelect(undefined)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
            !selectedProduce
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {!selectedProduce && <Check className="w-3 h-3" />}
          All
        </button>

        {sortedProduce.map((item) => {
          const inSeason = isInSeason(item, currentMonth)
          const isSelected = selectedProduce === item.slug

          return (
            <button
              key={item.slug}
              onClick={() => onSelect(isSelected ? undefined : item.slug)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isSelected
                  ? 'bg-primary-500 text-white'
                  : inSeason
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={inSeason ? `${item.name} is in season now` : `${item.name} (not in season)`}
            >
              {item.icon && <span className="text-base">{item.icon}</span>}
              {isSelected && <Check className="w-3 h-3" />}
              <span>{item.name}</span>
              {inSeason && !isSelected && (
                <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-medium rounded-full">
                  Now
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectedProduce && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Showing farms with {sortedProduce.find(p => p.slug === selectedProduce)?.name || selectedProduce}
        </p>
      )}
    </div>
  )
}

export default ProduceFilter
