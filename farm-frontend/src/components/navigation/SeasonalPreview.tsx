'use client'

/**
 * SeasonalPreview Component
 *
 * Shows top seasonal produce in the mega menu dropdown.
 * Displays items currently in season with peak indicators.
 *
 * Design System Compliance:
 * - Spacing: 8px grid
 * - Typography: text-small, text-caption
 * - Touch targets: 44px minimum height
 * - Colors: Semantic status colors
 */

import Link from 'next/link'
import { Calendar, ArrowRight, Leaf, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProduceInSeason, getCurrentMonth, getMonthName } from '@/lib/seasonal-utils'
import { useMemo } from 'react'

interface SeasonalPreviewProps {
  /** Maximum number of items to show */
  limit?: number
  /** Additional CSS classes */
  className?: string
}

export function SeasonalPreview({
  limit = 3,
  className = '',
}: SeasonalPreviewProps) {
  const currentMonth = getCurrentMonth()
  const monthName = getMonthName(currentMonth)

  const seasonalItems = useMemo(() => {
    return getProduceInSeason(currentMonth).slice(0, limit)
  }, [currentMonth, limit])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          <span className="text-small font-semibold text-slate-900 dark:text-slate-100">
            In Season Now
          </span>
          <span className="text-caption text-slate-500 dark:text-slate-400">
            {monthName}
          </span>
        </div>
        <Link
          href="/seasonal"
          className="text-small font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Seasonal items */}
      <div className="space-y-1">
        {seasonalItems.map((item) => (
          <Link
            key={item.slug}
            href={`/seasonal/${item.slug}`}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'hover:bg-slate-100 dark:hover:bg-white/[0.04]',
              'transition-colors duration-150',
              'min-h-[44px]'
            )}
          >
            {/* Icon with status color */}
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg',
                item.seasonStatus === 'peak'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20'
                  : item.seasonStatus === 'ending'
                    ? 'bg-amber-100 dark:bg-amber-500/20'
                    : 'bg-primary-100 dark:bg-primary-500/20'
              )}
            >
              <Leaf
                className={cn(
                  'w-4 h-4',
                  item.seasonStatus === 'peak'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : item.seasonStatus === 'ending'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-primary-600 dark:text-primary-400'
                )}
              />
            </div>

            {/* Item info */}
            <div className="flex-1 min-w-0">
              <span className="block text-small font-medium text-slate-900 dark:text-slate-100 truncate">
                {item.name}
              </span>
              <span className="text-caption text-slate-500 dark:text-slate-400">
                {item.seasonStatus === 'peak' && 'Peak season'}
                {item.seasonStatus === 'in-season' && 'In season'}
                {item.seasonStatus === 'ending' && 'Season ending'}
              </span>
            </div>

            {/* Peak indicator */}
            {item.seasonStatus === 'peak' && (
              <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            )}
          </Link>
        ))}
      </div>

      {/* Quick action */}
      <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06]">
        <Link
          href="/seasonal"
          className={cn(
            'flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg',
            'bg-emerald-50 dark:bg-emerald-500/10',
            'text-small font-medium text-emerald-600 dark:text-emerald-400',
            'hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
            'transition-colors duration-150',
            'min-h-[44px]'
          )}
        >
          <Calendar className="w-4 h-4" />
          Full seasonal calendar
        </Link>
      </div>
    </div>
  )
}

export default SeasonalPreview
