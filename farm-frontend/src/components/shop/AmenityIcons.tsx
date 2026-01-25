'use client'

/**
 * AmenityIcons Component
 *
 * Displays amenity icons for quick visual scanning on shop cards.
 * Follows design tokens: 8px grid, semantic colors, 44px touch targets.
 *
 * Design System Compliance:
 * - Spacing: 8px gap (gap-1)
 * - Icons: 16px (w-4 h-4) for compact, 20px (w-5 h-5) for full
 * - Typography: text-small for labels
 * - Touch targets: 44px minimum when interactive
 * - Animation: None (icons are static)
 */

import { type Amenity, getAmenities, sortAmenitiesByPriority } from '@/lib/data/amenities'

interface AmenityIconsProps {
  /** Array of amenity IDs to display */
  amenityIds: string[]
  /** Maximum number of icons to show (default: 4) */
  limit?: number
  /** Display variant */
  variant?: 'compact' | 'full'
  /** Show overflow count badge */
  showOverflow?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Compact row of amenity icons for cards.
 */
export function AmenityIcons({
  amenityIds,
  limit = 4,
  variant = 'compact',
  showOverflow = true,
  className = '',
}: AmenityIconsProps) {
  const amenities = sortAmenitiesByPriority(getAmenities(amenityIds))

  if (amenities.length === 0) {
    return null
  }

  const visibleAmenities = amenities.slice(0, limit)
  const overflowCount = amenities.length - limit

  if (variant === 'full') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {amenities.map((amenity) => (
          <AmenityBadge key={amenity.id} amenity={amenity} />
        ))}
      </div>
    )
  }

  // Compact variant: icons only with tooltip
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {visibleAmenities.map((amenity) => (
        <AmenityIconCompact key={amenity.id} amenity={amenity} />
      ))}
      {showOverflow && overflowCount > 0 && (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-small font-medium text-slate-600 dark:text-slate-400">
          +{overflowCount}
        </span>
      )}
    </div>
  )
}

/**
 * Single compact amenity icon with tooltip.
 */
function AmenityIconCompact({ amenity }: { amenity: Amenity }) {
  const Icon = amenity.icon

  return (
    <span
      className={`
        inline-flex items-center justify-center w-6 h-6 rounded-md
        ${amenity.bgClass}
        transition-colors
      `}
      title={amenity.label}
      aria-label={amenity.label}
    >
      <Icon className={`w-4 h-4 ${amenity.colorClass}`} />
    </span>
  )
}

/**
 * Full amenity badge with label.
 */
function AmenityBadge({ amenity }: { amenity: Amenity }) {
  const Icon = amenity.icon

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
        ${amenity.bgClass}
        text-small font-medium
      `}
    >
      <Icon className={`w-4 h-4 ${amenity.colorClass}`} />
      <span className={amenity.colorClass}>{amenity.shortLabel}</span>
    </span>
  )
}

/**
 * Amenity list with full labels (for shop detail pages).
 */
export function AmenityList({
  amenityIds,
  className = '',
}: {
  amenityIds: string[]
  className?: string
}) {
  const amenities = sortAmenitiesByPriority(getAmenities(amenityIds))

  if (amenities.length === 0) {
    return null
  }

  return (
    <ul className={`space-y-2 ${className}`}>
      {amenities.map((amenity) => (
        <li key={amenity.id} className="flex items-center gap-3">
          <span
            className={`
              inline-flex items-center justify-center w-8 h-8 rounded-lg
              ${amenity.bgClass}
            `}
          >
            <amenity.icon className={`w-5 h-5 ${amenity.colorClass}`} />
          </span>
          <span className="text-body text-slate-700 dark:text-slate-300">
            {amenity.label}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default AmenityIcons
