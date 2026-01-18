'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, MapPin, ArrowRight } from 'lucide-react'

interface SeasonalItem {
  name: string
  slug: string
  icon: string
  seasonStart: number
  seasonEnd: number
}

// UK Seasonal produce data (matches seed data)
const SEASONAL_PRODUCE: SeasonalItem[] = [
  { name: 'Asparagus', slug: 'asparagus', icon: '🌿', seasonStart: 4, seasonEnd: 6 },
  { name: 'Purple Sprouting Broccoli', slug: 'purple-sprouting-broccoli', icon: '🥦', seasonStart: 1, seasonEnd: 4 },
  { name: 'Strawberries', slug: 'strawberries', icon: '🍓', seasonStart: 5, seasonEnd: 8 },
  { name: 'Tomatoes', slug: 'tomato', icon: '🍅', seasonStart: 6, seasonEnd: 10 },
  { name: 'Sweetcorn', slug: 'sweetcorn', icon: '🌽', seasonStart: 7, seasonEnd: 9 },
  { name: 'Runner Beans', slug: 'runner-beans', icon: '🫛', seasonStart: 7, seasonEnd: 10 },
  { name: 'Blackberries', slug: 'blackberries', icon: '🫐', seasonStart: 7, seasonEnd: 9 },
  { name: 'Apples', slug: 'apples', icon: '🍎', seasonStart: 9, seasonEnd: 12 },
  { name: 'Plums', slug: 'plums', icon: '🍑', seasonStart: 8, seasonEnd: 10 },
  { name: 'Pumpkins', slug: 'pumpkins', icon: '🎃', seasonStart: 9, seasonEnd: 11 },
  { name: 'Kale', slug: 'kale', icon: '🥬', seasonStart: 11, seasonEnd: 4 },
  { name: 'Leeks', slug: 'leeks', icon: '🧅', seasonStart: 9, seasonEnd: 4 },
]

function isInSeason(item: SeasonalItem, month: number): boolean {
  if (item.seasonStart <= item.seasonEnd) {
    return month >= item.seasonStart && month <= item.seasonEnd
  }
  return month >= item.seasonStart || month <= item.seasonEnd
}

const STORAGE_KEY = 'seasonal-banner-dismissed'
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export function SeasonalBanner() {
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash
  const [mounted, setMounted] = useState(false)
  const [peakProduce, setPeakProduce] = useState<SeasonalItem[]>([])

  // Check localStorage and compute seasonal data on mount (client-side only)
  useEffect(() => {
    setMounted(true)

    // Compute current month on client only to avoid hydration mismatch
    const currentMonth = new Date().getMonth() + 1
    const inSeason = SEASONAL_PRODUCE.filter(item => isInSeason(item, currentMonth)).slice(0, 3)
    setPeakProduce(inSeason)

    const dismissedAt = localStorage.getItem(STORAGE_KEY)
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      if (Date.now() - dismissedTime < DISMISS_DURATION_MS) {
        setDismissed(true)
        return
      }
    }
    setDismissed(false)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
  }

  // Don't render on server or if dismissed
  if (!mounted || dismissed || peakProduce.length === 0) return null

  const primaryProduce = peakProduce[0]

  return (
    <div className="relative bg-gradient-to-r from-green-50 via-green-50/80 to-amber-50/60 dark:from-green-900/30 dark:via-green-900/20 dark:to-amber-900/20 border-b border-green-200/50 dark:border-green-800/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-2.5 sm:py-3">
          {/* Content */}
          <div className="flex flex-1 items-center gap-3 min-w-0">
            {/* Season indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-800/40 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300 whitespace-nowrap">In Season</span>
            </div>

            {/* Produce icons - mobile: show 2, desktop: show 3 */}
            <div className="flex items-center gap-1">
              {peakProduce.slice(0, 2).map(item => (
                <span key={item.slug} className="text-lg sm:text-xl" title={item.name}>{item.icon}</span>
              ))}
              <span className="hidden sm:inline text-xl" title={peakProduce[2]?.name}>{peakProduce[2]?.icon}</span>
            </div>

            {/* Text */}
            <p className="text-sm text-text-body truncate">
              <span className="font-medium">{primaryProduce.name}</span>
              <span className="hidden sm:inline text-text-muted"> and more are at peak season</span>
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/map?produce=${primaryProduce.slug}`}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/50 hover:bg-green-200 dark:hover:bg-green-700/50 rounded-full transition-all duration-fast ease-gentle-spring"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Find nearby</span>
              <span className="sm:hidden">Find</span>
            </Link>

            <Link
              href="/seasonal"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-text-muted hover:text-text-body transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-text-muted hover:text-text-body hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss seasonal banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
