'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Leaf, ArrowRight, Sparkles, Clock } from 'lucide-react'
import { getProduceInSeason, getCurrentMonth, getMonthName } from '@/lib/seasonal-utils'
import type { SeasonalProduce } from '@/lib/seasonal-utils'

interface WhatsInSeasonProps {
  /** Farm's offerings to filter relevant produce */
  offerings?: string[]
  /** Maximum number of items to show */
  limit?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Map farm offerings to produce categories
 */
const OFFERING_TO_CATEGORY: Record<string, string[]> = {
  // Fruits
  'fruit': ['fruit'],
  'fruits': ['fruit'],
  'apples': ['fruit'],
  'berries': ['fruit'],
  'soft fruit': ['fruit'],
  'orchard': ['fruit'],

  // Vegetables
  'vegetables': ['vegetable'],
  'veg': ['vegetable'],
  'salad': ['vegetable'],
  'potatoes': ['vegetable'],
  'root vegetables': ['vegetable'],

  // Herbs
  'herbs': ['herb'],
  'fresh herbs': ['herb'],

  // General produce
  'produce': ['fruit', 'vegetable'],
  'fresh produce': ['fruit', 'vegetable'],
  'seasonal produce': ['fruit', 'vegetable'],
  'local produce': ['fruit', 'vegetable'],

  // Pick your own (likely fruits/veg)
  'pyo': ['fruit', 'vegetable'],
  'pick your own': ['fruit', 'vegetable'],
}

/**
 * Get relevant produce categories from farm offerings
 */
function getRelevantCategories(offerings?: string[]): string[] {
  if (!offerings || offerings.length === 0) {
    // Default to showing fruit and vegetables
    return ['fruit', 'vegetable']
  }

  const categories = new Set<string>()

  for (const offering of offerings) {
    const lowerOffering = offering.toLowerCase()
    for (const [key, cats] of Object.entries(OFFERING_TO_CATEGORY)) {
      if (lowerOffering.includes(key)) {
        cats.forEach(c => categories.add(c))
      }
    }
  }

  // Default if no matches
  if (categories.size === 0) {
    return ['fruit', 'vegetable']
  }

  return Array.from(categories)
}

/**
 * Filter produce by relevant categories
 */
function filterProduceByCategories(produce: SeasonalProduce[], categories: string[]): SeasonalProduce[] {
  return produce.filter(p => categories.includes(p.category || 'other'))
}

/**
 * Get season status badge config
 */
function getSeasonBadge(status: string): { icon: typeof Sparkles; label: string; className: string } {
  switch (status) {
    case 'peak':
      return {
        icon: Sparkles,
        label: 'Peak',
        className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      }
    case 'starting':
      return {
        icon: Leaf,
        label: 'New',
        className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      }
    case 'ending':
      return {
        icon: Clock,
        label: 'Ending',
        className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      }
    default:
      return {
        icon: Leaf,
        label: 'In Season',
        className: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
      }
  }
}

/**
 * WhatsInSeason Component
 *
 * Shows seasonal produce relevant to a farm shop's offerings.
 * Cross-references farm categories with current season data.
 */
export function WhatsInSeason({
  offerings,
  limit = 4,
  className = '',
}: WhatsInSeasonProps) {
  const currentMonth = getCurrentMonth()
  const monthName = getMonthName(currentMonth)
  const allSeasonal = getProduceInSeason(currentMonth)

  // Filter by relevant categories based on farm offerings
  const relevantCategories = getRelevantCategories(offerings)
  const relevantProduce = filterProduceByCategories(allSeasonal, relevantCategories)

  // Sort by season status priority: peak > starting > in-season > ending
  const sortedProduce = [...relevantProduce].sort((a, b) => {
    const priority: Record<string, number> = { peak: 0, starting: 1, 'in-season': 2, ending: 3 }
    return (priority[a.seasonStatus] || 4) - (priority[b.seasonStatus] || 4)
  })

  const displayProduce = sortedProduce.slice(0, limit)

  if (displayProduce.length === 0) {
    return null
  }

  return (
    <div className={`bg-gradient-to-br from-emerald-50 to-primary-50 dark:from-emerald-950/20 dark:to-primary-950/20 rounded-xl p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white dark:bg-[#121214] rounded-lg shadow-sm dark:shadow-none dark:border dark:border-white/[0.08]">
            <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-body font-semibold dark:font-medium text-slate-900 dark:text-zinc-50">
              In Season Now
            </h3>
            <p className="text-small text-slate-500 dark:text-zinc-500">
              {monthName} highlights
            </p>
          </div>
        </div>
      </div>

      {/* Produce Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {displayProduce.map((produce) => {
          const badge = getSeasonBadge(produce.seasonStatus)
          const BadgeIcon = badge.icon

          return (
            <Link
              key={produce.slug}
              href={`/seasonal/${produce.slug}`}
              className="group flex items-center gap-3 p-2.5 bg-white dark:bg-[#121214] rounded-lg border border-slate-100 dark:border-white/[0.06] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm dark:hover:shadow-none transition-all"
            >
              {/* Image */}
              {produce.images?.[0]?.src && (
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/[0.04]">
                  <Image
                    src={produce.images[0].src}
                    alt={produce.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-caption font-medium dark:font-normal text-slate-900 dark:text-zinc-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {produce.name}
                </p>
                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium dark:font-normal ${badge.className}`}>
                  <BadgeIcon className="w-2.5 h-2.5" />
                  {badge.label}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* View All Link */}
      <Link
        href="/seasonal"
        className="flex items-center justify-center gap-1.5 py-2 text-caption text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium dark:font-normal transition-colors group"
      >
        View all seasonal produce
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  )
}

/**
 * Compact version for sidebars
 */
export function WhatsInSeasonCompact({
  offerings,
  limit = 3,
  className = '',
}: WhatsInSeasonProps) {
  const currentMonth = getCurrentMonth()
  const allSeasonal = getProduceInSeason(currentMonth)

  const relevantCategories = getRelevantCategories(offerings)
  const relevantProduce = filterProduceByCategories(allSeasonal, relevantCategories)
    .slice(0, limit)

  if (relevantProduce.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      <div className="flex items-center gap-1.5 text-small text-slate-600 dark:text-zinc-400">
        <span>In season:</span>
        <span className="text-slate-900 dark:text-zinc-200 font-medium dark:font-normal">
          {relevantProduce.map(p => p.name).join(', ')}
        </span>
      </div>
    </div>
  )
}
