'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Leaf, Calendar, ArrowRight, Sprout } from 'lucide-react'
import type { FarmProduce } from '@/types/farm'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

interface FarmSeasonalProduceProps {
  produce: FarmProduce[]
  farmName: string
}

/**
 * Check if produce is currently in season
 * Handles wrap-around seasons (e.g., Nov-Apr for kale)
 */
function isInSeason(item: FarmProduce, month: number): boolean {
  if (item.seasonStart <= item.seasonEnd) {
    return month >= item.seasonStart && month <= item.seasonEnd
  }
  // Wrap-around season (e.g., Nov-Apr)
  return month >= item.seasonStart || month <= item.seasonEnd
}

/**
 * Check if produce is coming soon (within next 2 months)
 */
function isComingSoon(item: FarmProduce, month: number): boolean {
  if (isInSeason(item, month)) return false

  const nextMonth = month === 12 ? 1 : month + 1
  const monthAfter = nextMonth === 12 ? 1 : nextMonth + 1

  return isInSeason(item, nextMonth) || isInSeason(item, monthAfter)
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getSeasonRange(item: FarmProduce): string {
  const start = MONTH_NAMES[item.seasonStart - 1]
  const end = MONTH_NAMES[item.seasonEnd - 1]
  return `${start} - ${end}`
}

export function FarmSeasonalProduce({ produce, farmName }: FarmSeasonalProduceProps) {
  const currentMonth = new Date().getMonth() + 1

  const { inSeason, comingSoon, outOfSeason } = useMemo(() => {
    const inSeason: FarmProduce[] = []
    const comingSoon: FarmProduce[] = []
    const outOfSeason: FarmProduce[] = []

    produce.forEach(item => {
      if (isInSeason(item, currentMonth)) {
        inSeason.push(item)
      } else if (isComingSoon(item, currentMonth)) {
        comingSoon.push(item)
      } else {
        outOfSeason.push(item)
      }
    })

    return { inSeason, comingSoon, outOfSeason }
  }, [produce, currentMonth])

  if (produce.length === 0) return null

  return (
    <motion.section
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeInUp}
      className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-10 shadow-2xl border border-border-default/30"
    >
      <h2 className="text-3xl font-heading font-bold text-text-heading mb-8 flex items-center gap-3">
        <Leaf className="w-8 h-8 text-green-600" />
        What&apos;s in Season Here
      </h2>

      {/* In Season Now */}
      {inSeason.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
              Available Now
            </h3>
          </div>
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {inSeason.map((item) => (
              <motion.div key={item.slug} variants={staggerItem}>
                <Link
                  href={`/seasonal/${item.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all duration-fast ease-gentle-spring hover:shadow-premium"
                >
                  {item.icon && <span className="text-2xl">{item.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-green-800 dark:text-green-300 group-hover:text-green-600 dark:group-hover:text-green-200 transition-colors block truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {getSeasonRange(item)}
                    </span>
                  </div>
                  {item.isPYO && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
                      PYO
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Coming Soon */}
      {comingSoon.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
              Coming Soon
            </h3>
          </div>
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {comingSoon.map((item) => (
              <motion.div key={item.slug} variants={staggerItem}>
                <Link
                  href={`/seasonal/${item.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-fast ease-gentle-spring hover:shadow-premium"
                >
                  {item.icon && <span className="text-2xl">{item.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 group-hover:text-amber-600 dark:group-hover:text-amber-200 transition-colors block truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      From {MONTH_NAMES[item.seasonStart - 1]}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Out of Season (collapsed by default) */}
      {outOfSeason.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 text-text-muted hover:text-text-body transition-colors">
              <Sprout className="w-4 h-4" />
              <span className="text-sm font-medium">
                {outOfSeason.length} more item{outOfSeason.length > 1 ? 's' : ''} available other times of year
              </span>
              <span className="ml-2 text-xs group-open:hidden">Show</span>
              <span className="ml-2 text-xs hidden group-open:inline">Hide</span>
            </div>
          </summary>
          <motion.div
            variants={staggerContainer}
            className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            {outOfSeason.map((item) => (
              <Link
                key={item.slug}
                href={`/seasonal/${item.slug}`}
                className="group flex items-center gap-2 p-3 rounded-xl bg-background-canvas border border-border-default/50 hover:border-border-default transition-all duration-fast ease-gentle-spring"
              >
                {item.icon && <span className="text-lg opacity-50">{item.icon}</span>}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-text-muted group-hover:text-text-body transition-colors block truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-text-muted/70">
                    {getSeasonRange(item)}
                  </span>
                </div>
              </Link>
            ))}
          </motion.div>
        </details>
      )}

      {/* Link to seasonal guide */}
      <div className="mt-8 pt-6 border-t border-border-default/50">
        <Link
          href="/seasonal"
          className="group inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          View full seasonal guide
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.section>
  )
}
