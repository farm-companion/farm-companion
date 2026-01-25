'use client'

import { useMemo } from 'react'
import type { SeasonStatus } from '@/lib/seasonal-utils'

interface SeasonProgressProps {
  monthsInSeason: number[]
  peakMonths?: number[]
  currentMonth: number
  progress: number
  daysRemaining: number | null
  seasonStatus: SeasonStatus
  variant?: 'compact' | 'full'
  className?: string
}

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

/**
 * SeasonProgress Component
 *
 * Visual progress bar showing:
 * - Which months the produce is in season
 * - Current position within the season
 * - Peak months highlighted
 * - Days remaining indicator
 */
export function SeasonProgress({
  monthsInSeason,
  peakMonths = [],
  currentMonth,
  progress,
  daysRemaining,
  seasonStatus,
  variant = 'full',
  className = '',
}: SeasonProgressProps) {
  // Create month segments
  const segments = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const isInSeason = monthsInSeason.includes(month)
      const isPeak = peakMonths.includes(month)
      const isCurrent = month === currentMonth

      return {
        month,
        label: MONTH_LABELS[i],
        isInSeason,
        isPeak,
        isCurrent,
      }
    })
  }, [monthsInSeason, peakMonths, currentMonth])

  // Status colors
  const statusColors = {
    peak: 'bg-amber-500',
    starting: 'bg-emerald-500',
    'in-season': 'bg-primary-500',
    ending: 'bg-orange-500',
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Mini progress bar */}
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusColors[seasonStatus]}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Days remaining badge */}
        {daysRemaining !== null && (
          <span className="text-small text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {daysRemaining === 0 ? 'Last day' : `${daysRemaining}d left`}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Month segments */}
      <div className="flex gap-0.5">
        {segments.map((segment) => (
          <div
            key={segment.month}
            className="flex-1 flex flex-col items-center gap-1"
          >
            {/* Segment bar */}
            <div
              className={`
                w-full h-2 rounded-sm transition-all duration-300
                ${segment.isInSeason
                  ? segment.isPeak
                    ? 'bg-amber-400'
                    : 'bg-primary-400'
                  : 'bg-slate-200 dark:bg-slate-700'
                }
                ${segment.isCurrent && segment.isInSeason ? 'ring-2 ring-primary-600 ring-offset-1' : ''}
              `}
            />

            {/* Month label */}
            <span
              className={`
                text-[10px] font-medium transition-colors
                ${segment.isCurrent
                  ? 'text-primary-600 dark:text-primary-400 font-bold'
                  : segment.isInSeason
                    ? 'text-slate-600 dark:text-slate-400'
                    : 'text-slate-400 dark:text-slate-600'
                }
              `}
            >
              {segment.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between text-small">
        <div className="flex items-center gap-2">
          <StatusBadge status={seasonStatus} />
          <span className="text-slate-600 dark:text-slate-400">
            {progress}% through season
          </span>
        </div>

        {daysRemaining !== null && (
          <span className="text-slate-500 dark:text-slate-500">
            {formatDaysRemaining(daysRemaining)}
          </span>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: SeasonStatus }) {
  const config = {
    peak: { label: 'Peak', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
    starting: { label: 'Just started', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    'in-season': { label: 'In season', bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-400' },
    ending: { label: 'Ending soon', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  }

  const { label, bg, text } = config[status]

  return (
    <span className={`px-2 py-0.5 rounded-full text-small font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}

function formatDaysRemaining(days: number): string {
  if (days === 0) return 'Last day'
  if (days === 1) return '1 day left'
  if (days < 7) return `${days} days left`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? '~1 week left' : `~${weeks} weeks left`
  }
  const months = Math.round(days / 30)
  return months === 1 ? '~1 month left' : `~${months} months left`
}
