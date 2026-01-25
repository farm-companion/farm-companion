'use client'

/**
 * CountyDensityBadge Component
 *
 * Shows shop count with visual weight based on density.
 * Higher counts get more prominent, vibrant styling.
 *
 * Design System Compliance:
 * - Spacing: 8px grid (px-2 = 8px, px-3 = 12px)
 * - Typography: text-small, text-caption, text-body
 * - Colors: Semantic based on density level
 * - Animation: None (static indicator)
 */

interface CountyDensityBadgeProps {
  /** Number of shops in the county */
  count: number
  /** Display variant */
  variant?: 'compact' | 'full'
  /** Additional CSS classes */
  className?: string
}

type DensityLevel = 'low' | 'medium' | 'high' | 'very-high'

/**
 * Determine density level based on shop count.
 * Thresholds based on UK farm shop distribution.
 */
function getDensityLevel(count: number): DensityLevel {
  if (count >= 40) return 'very-high'
  if (count >= 20) return 'high'
  if (count >= 10) return 'medium'
  return 'low'
}

/**
 * Get styling config for density level.
 */
function getDensityConfig(level: DensityLevel) {
  const configs = {
    low: {
      bgClass: 'bg-slate-100 dark:bg-slate-800',
      textClass: 'text-slate-600 dark:text-slate-400',
      ringClass: '',
      label: 'Few shops',
    },
    medium: {
      bgClass: 'bg-primary-100 dark:bg-primary-900/30',
      textClass: 'text-primary-700 dark:text-primary-300',
      ringClass: '',
      label: 'Good selection',
    },
    high: {
      bgClass: 'bg-primary-500 dark:bg-primary-600',
      textClass: 'text-white',
      ringClass: 'ring-2 ring-primary-300 dark:ring-primary-400/50',
      label: 'Popular area',
    },
    'very-high': {
      bgClass: 'bg-gradient-to-r from-primary-500 to-emerald-500 dark:from-primary-600 dark:to-emerald-600',
      textClass: 'text-white font-bold',
      ringClass: 'ring-2 ring-emerald-300 dark:ring-emerald-400/50 shadow-md',
      label: 'Top destination',
    },
  }
  return configs[level]
}

/**
 * Compact badge showing shop count with visual density indicator.
 */
export function CountyDensityBadge({
  count,
  variant = 'compact',
  className = '',
}: CountyDensityBadgeProps) {
  const level = getDensityLevel(count)
  const config = getDensityConfig(level)

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span
          className={`
            inline-flex items-center justify-center px-3 py-1.5 rounded-lg
            text-caption font-semibold
            ${config.bgClass} ${config.textClass} ${config.ringClass}
          `}
        >
          {count} {count === 1 ? 'shop' : 'shops'}
        </span>
        <span className="text-small text-slate-500 dark:text-slate-400">
          {config.label}
        </span>
      </div>
    )
  }

  // Compact variant: just the count with visual weight
  return (
    <span
      className={`
        inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full
        text-small font-semibold transition-all
        ${config.bgClass} ${config.textClass} ${config.ringClass}
        ${className}
      `}
      title={`${count} farm ${count === 1 ? 'shop' : 'shops'} - ${config.label}`}
    >
      {count}
    </span>
  )
}

/**
 * Density legend for map or listings.
 */
export function CountyDensityLegend({ className = '' }: { className?: string }) {
  const levels: DensityLevel[] = ['low', 'medium', 'high', 'very-high']

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <span className="text-caption text-slate-600 dark:text-slate-400 font-medium">
        Density:
      </span>
      {levels.map((level) => {
        const config = getDensityConfig(level)
        return (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className={`
                inline-flex w-4 h-4 rounded-full
                ${config.bgClass} ${config.ringClass}
              `}
            />
            <span className="text-small text-slate-600 dark:text-slate-400">
              {config.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default CountyDensityBadge
