'use client'

/**
 * CountiesPreview Component
 *
 * Shows popular counties in the mega menu dropdown.
 * Displays top counties by farm count with quick links.
 *
 * Design System Compliance:
 * - Spacing: 8px grid
 * - Typography: text-small, text-caption
 * - Touch targets: 44px minimum height
 * - Colors: Semantic primary accent
 */

import Link from 'next/link'
import { MapPin, ArrowRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Popular UK counties with high farm shop density.
 * Sorted by typical farm count (pre-computed for performance).
 */
const POPULAR_COUNTIES = [
  { name: 'Devon', slug: 'devon', farms: 89 },
  { name: 'Somerset', slug: 'somerset', farms: 67 },
  { name: 'Cornwall', slug: 'cornwall', farms: 58 },
  { name: 'Kent', slug: 'kent', farms: 54 },
  { name: 'Yorkshire', slug: 'yorkshire', farms: 52 },
  { name: 'Norfolk', slug: 'norfolk', farms: 48 },
]

interface CountiesPreviewProps {
  /** Maximum number of counties to show */
  limit?: number
  /** Additional CSS classes */
  className?: string
}

export function CountiesPreview({
  limit = 6,
  className = '',
}: CountiesPreviewProps) {
  const counties = POPULAR_COUNTIES.slice(0, limit)

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          <span className="text-small font-semibold text-slate-900 dark:text-slate-100">
            Popular Regions
          </span>
        </div>
        <Link
          href="/counties"
          className="text-small font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Counties grid */}
      <div className="grid grid-cols-2 gap-2">
        {counties.map((county) => (
          <Link
            key={county.slug}
            href={`/counties/${county.slug}`}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg',
              'text-small text-slate-700 dark:text-slate-300',
              'hover:bg-slate-100 dark:hover:bg-white/[0.04]',
              'transition-colors duration-150',
              'min-h-[44px]'
            )}
          >
            <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <span className="flex-1 truncate">{county.name}</span>
            <span className="text-caption text-slate-400 dark:text-slate-500 tabular-nums">
              {county.farms}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06]">
        <Link
          href="/map"
          className={cn(
            'flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg',
            'bg-primary-50 dark:bg-primary-500/10',
            'text-small font-medium text-primary-600 dark:text-primary-400',
            'hover:bg-primary-100 dark:hover:bg-primary-500/20',
            'transition-colors duration-150',
            'min-h-[44px]'
          )}
        >
          <MapPin className="w-4 h-4" />
          Find farms near you
        </Link>
      </div>
    </div>
  )
}

export default CountiesPreview
