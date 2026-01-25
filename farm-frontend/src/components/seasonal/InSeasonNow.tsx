'use client'

/**
 * InSeasonNow Component
 *
 * Homepage module showing top seasonal items for the current month.
 * Follows design tokens: 8px grid, semantic typography, minimal animation.
 *
 * Design System Compliance:
 * - Spacing: 8px baseline grid
 * - Typography: text-heading, text-body, text-caption
 * - Colors: primary-500, success, warning semantic colors
 * - Animation: Only fade-in (purposeful motion)
 * - Touch targets: 44px minimum
 */

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Leaf, Sparkles, Clock, ChevronRight, Sunrise } from 'lucide-react'
import {
  getProduceInSeason,
  getCurrentMonth,
  getMonthName,
  type SeasonalProduce
} from '@/lib/seasonal-utils'

interface InSeasonNowProps {
  /** Maximum items to display (default: 4) */
  limit?: number
  /** Optional custom month (1-12) for preview */
  month?: number
}

export function InSeasonNow({ limit = 4, month }: InSeasonNowProps) {
  const currentMonth = month ?? getCurrentMonth()
  const monthName = getMonthName(currentMonth)

  const seasonalProduce = useMemo(() => {
    return getProduceInSeason(currentMonth).slice(0, limit)
  }, [currentMonth, limit])

  if (seasonalProduce.length === 0) {
    return null
  }

  return (
    <section
      className="animate-fade-in"
      aria-labelledby="in-season-heading"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <Leaf className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2
              id="in-season-heading"
              className="text-heading font-semibold text-slate-900 dark:text-slate-50"
            >
              In Season Now
            </h2>
            <p className="text-caption text-slate-600 dark:text-slate-400">
              Fresh picks for {monthName}
            </p>
          </div>
        </div>

        <Link
          href="/seasonal"
          className="inline-flex items-center gap-1 text-caption font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors min-h-[44px] px-3"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Produce Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {seasonalProduce.map((produce) => (
          <ProduceCard key={produce.slug} produce={produce} />
        ))}
      </div>
    </section>
  )
}

/**
 * Individual produce card with status badge.
 */
function ProduceCard({ produce }: { produce: SeasonalProduce }) {
  const firstImage = produce.images[0]

  return (
    <Link
      href={`/seasonal/${produce.slug}`}
      className="group block rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
        {firstImage ? (
          <Image
            src={firstImage.src}
            alt={firstImage.alt}
            fill
            className="object-cover transition-transform duration-base group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <SeasonStatusBadge status={produce.seasonStatus} />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-body font-semibold text-slate-900 dark:text-slate-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
          {produce.name}
        </h3>
        <p className="text-small text-slate-500 dark:text-slate-400 mt-1">
          {formatSeasonMonths(produce.monthsInSeason)}
        </p>
      </div>
    </Link>
  )
}

/**
 * Season status badge with appropriate colors.
 */
function SeasonStatusBadge({ status }: { status: SeasonalProduce['seasonStatus'] }) {
  const config = {
    peak: {
      icon: Sparkles,
      label: 'Peak',
      className: 'bg-emerald-500/90 text-white'
    },
    starting: {
      icon: Sunrise,
      label: 'Just Started',
      className: 'bg-sky-500/90 text-white'
    },
    'in-season': {
      icon: Leaf,
      label: 'In Season',
      className: 'bg-primary-500/90 text-white'
    },
    ending: {
      icon: Clock,
      label: 'Ending Soon',
      className: 'bg-amber-500/90 text-white'
    }
  }

  const { icon: Icon, label, className } = config[status]

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full
        text-small font-semibold backdrop-blur-sm shadow-sm
        ${className}
      `}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

/**
 * Format month numbers to readable range.
 */
function formatSeasonMonths(months: number[]): string {
  if (months.length === 0) return ''

  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const first = names[months[0] - 1]
  const last = names[months[months.length - 1] - 1]

  if (months.length === 1) return first
  return `${first} - ${last}`
}

export default InSeasonNow
