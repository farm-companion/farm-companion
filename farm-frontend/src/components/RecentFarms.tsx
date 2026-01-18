'use client'

import { Clock, MapPin, X } from 'lucide-react'
import Link from 'next/link'
import { useRecentFarms } from '@/hooks/useRecentFarms'

interface RecentFarmsProps {
  onFarmClick?: (farmId: string) => void
  className?: string
  compact?: boolean
}

/**
 * Displays recently viewed farms
 * Shows a list of farms the user has recently interacted with
 */
export function RecentFarms({ onFarmClick, className = '', compact = false }: RecentFarmsProps) {
  const { recentFarms, clearRecentFarms } = useRecentFarms()

  if (recentFarms.length === 0) {
    return null
  }

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Recent</span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {recentFarms.slice(0, 5).map(farm => (
            <button
              key={farm.id}
              onClick={() => onFarmClick?.(farm.id)}
              className="flex-shrink-0 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {farm.name.length > 15 ? farm.name.slice(0, 15) + '...' : farm.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-serum" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Recently Viewed</h3>
        </div>
        <button
          onClick={clearRecentFarms}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Clear recent farms"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2">
        {recentFarms.slice(0, 5).map(farm => (
          <Link
            key={farm.id}
            href={`/farm/${farm.slug}`}
            onClick={() => onFarmClick?.(farm.id)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <div className="w-8 h-8 bg-serum/10 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-serum" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-serum transition-colors">
                {farm.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {farm.county}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {recentFarms.length > 5 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          +{recentFarms.length - 5} more
        </p>
      )}
    </div>
  )
}

export default RecentFarms
