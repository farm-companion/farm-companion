'use client'

import Link from 'next/link'
import { Leaf, Calendar, ArrowRight } from 'lucide-react'
import { PRODUCE, type Produce } from '@/data/produce'

interface FarmSeasonalProduceProps {
  offerings?: string[]
  className?: string
}

/**
 * Displays seasonal produce that matches farm offerings
 * Shows what's currently in season that this farm may offer
 */
export function FarmSeasonalProduce({ offerings = [], className = '' }: FarmSeasonalProduceProps) {
  const currentMonth = new Date().getMonth() + 1 // 1-12

  // Find produce that matches the farm's offerings and is currently in season
  const matchingProduce = PRODUCE.filter(produce => {
    // Check if in season
    if (!produce.monthsInSeason.includes(currentMonth)) return false

    // Check if any farm offering matches this produce
    const produceName = produce.name.toLowerCase()
    return offerings.some(offering => {
      const offeringLower = offering.toLowerCase()
      // Match if produce name is in offering or offering contains produce-related terms
      return (
        offeringLower.includes(produceName) ||
        produceName.includes(offeringLower) ||
        (offeringLower.includes('vegetable') && produce.slug.match(/carrot|potato|onion|cabbage|leek|parsnip|beetroot|turnip/)) ||
        (offeringLower.includes('fruit') && produce.slug.match(/apple|pear|plum|strawberry|raspberry|blackberry|cherry/)) ||
        (offeringLower.includes('organic') && produce.monthsInSeason.includes(currentMonth))
      )
    })
  }).slice(0, 4)

  // If no specific matches, show any produce that's in season now
  const inSeasonNow = matchingProduce.length > 0
    ? matchingProduce
    : PRODUCE.filter(p => p.monthsInSeason.includes(currentMonth)).slice(0, 4)

  if (inSeasonNow.length === 0) return null

  const monthName = new Date().toLocaleString('en-GB', { month: 'long' })

  return (
    <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
          <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            In Season This {monthName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Fresh produce available now
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {inSeasonNow.map(produce => {
          const isPeak = produce.peakMonths?.includes(currentMonth)
          return (
            <Link
              key={produce.slug}
              href={`/seasonal/${produce.slug}`}
              className="group flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">
                  {produce.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                  {produce.name}
                </p>
                {isPeak && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Peak season
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      <Link
        href="/seasonal"
        className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        View full seasonal guide
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}

export default FarmSeasonalProduce
