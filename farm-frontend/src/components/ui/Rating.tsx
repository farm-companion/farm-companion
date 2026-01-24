'use client'

/**
 * Rating Component
 *
 * Star rating display with optional interactive mode.
 *
 * @example
 * ```tsx
 * // Display rating
 * <Rating value={4.5} max={5} />
 *
 * // With count
 * <Rating value={4.2} max={5} count={342} />
 *
 * // Interactive (for forms)
 * <Rating
 *   value={rating}
 *   onChange={setRating}
 *   interactive
 * />
 *
 * // Different sizes
 * <Rating value={5} size="sm" />
 * <Rating value={4} size="lg" />
 * ```
 */

import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RatingProps {
  value: number
  max?: number
  onChange?: (value: number) => void
  interactive?: boolean
  count?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Rating({
  value,
  max = 5,
  onChange,
  interactive = false,
  count,
  size = 'md',
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)

  const displayValue = hoverValue !== null ? hoverValue : value
  const isInteractive = interactive && onChange

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const stars = Array.from({ length: max }, (_, i) => {
    const starValue = i + 1
    const fillPercentage = Math.min(Math.max((displayValue - i) * 100, 0), 100)

    return (
      <button
        key={i}
        type="button"
        disabled={!isInteractive}
        onClick={() => isInteractive && onChange(starValue)}
        onMouseEnter={() => isInteractive && setHoverValue(starValue)}
        onMouseLeave={() => isInteractive && setHoverValue(null)}
        className={cn(
          'relative',
          isInteractive && 'cursor-pointer transition-transform hover:scale-110',
          !isInteractive && 'cursor-default'
        )}
        aria-label={`Rate ${starValue} out of ${max} stars`}
      >
        {/* Background star (empty) */}
        <Star
          className={cn(
            sizeClasses[size],
            'text-slate-200 dark:text-slate-700',
            isInteractive && 'transition-colors'
          )}
        />

        {/* Filled star (overlay) */}
        {fillPercentage > 0 && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fillPercentage}%` }}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'fill-amber-400 text-amber-400',
                isInteractive && 'transition-colors'
              )}
            />
          </div>
        )}
      </button>
    )
  })

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">{stars}</div>

      {value > 0 && (
        <span className="ml-1 text-caption font-medium text-slate-900 dark:text-slate-50">
          {value.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className="ml-1 text-caption text-slate-500 dark:text-slate-400">({count})</span>
      )}
    </div>
  )
}
