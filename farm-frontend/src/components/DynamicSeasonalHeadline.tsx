'use client'

import { useState, useEffect } from 'react'
import { getProduceInSeason, getCurrentMonth, getMonthName } from '@/lib/seasonal-utils'

interface SeasonalHeadlineData {
  headline: string
  subheadline: string
  accent: string
  seasonalHighlight: string | null
}

type TimeOfDay = 'morning' | 'afternoon' | 'evening'
type Season = 'winter' | 'spring' | 'summer' | 'autumn'

/**
 * Get the current time of day based on hours.
 */
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  return 'evening'
}

/**
 * Get the current season based on month.
 */
function getSeason(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

/**
 * Get dynamic headline data based on month, season, and time of day.
 */
function getSeasonalHeadlineData(month: number): SeasonalHeadlineData {
  const season = getSeason(month)
  const timeOfDay = getTimeOfDay()
  const monthName = getMonthName(month)

  // Get top in-season produce for highlight
  const inSeasonProduce = getProduceInSeason(month)
  const peakProduce = inSeasonProduce.filter(p => p.seasonStatus === 'peak')
  const topProduce = peakProduce.length > 0 ? peakProduce[0] : inSeasonProduce[0]

  // Time-based greetings
  const timeGreetings: Record<TimeOfDay, string> = {
    morning: 'Start your day with',
    afternoon: 'Discover',
    evening: 'Plan tomorrow with',
  }

  // Season-specific headlines
  const seasonHeadlines: Record<Season, SeasonalHeadlineData> = {
    winter: {
      headline: 'Warm Your Winter',
      subheadline: `${timeGreetings[timeOfDay]} hearty root vegetables, fresh game, and artisan preserves from local farm shops.`,
      accent: 'with Local Flavour',
      seasonalHighlight: topProduce?.name || null,
    },
    spring: {
      headline: 'Fresh Spring Harvest',
      subheadline: `${timeGreetings[timeOfDay]} tender asparagus, spring lamb, and wild garlic from farms across the UK.`,
      accent: 'Awaits You',
      seasonalHighlight: topProduce?.name || null,
    },
    summer: {
      headline: 'Summer',
      subheadline: `${timeGreetings[timeOfDay]} sun-ripened berries, fresh salads, and farm-fresh eggs from local producers.`,
      accent: 'at Its Peak',
      seasonalHighlight: topProduce?.name || null,
    },
    autumn: {
      headline: 'Autumn Abundance',
      subheadline: `${timeGreetings[timeOfDay]} orchard apples, golden squash, and foraged mushrooms from UK farm shops.`,
      accent: 'Has Arrived',
      seasonalHighlight: topProduce?.name || null,
    },
  }

  // Month-specific overrides for special occasions
  const monthOverrides: Partial<Record<number, Partial<SeasonalHeadlineData>>> = {
    12: { // December
      headline: 'Festive Farm',
      accent: 'Favourites',
      subheadline: `${timeGreetings[timeOfDay]} Christmas hampers, locally reared turkey, and artisan treats for the holidays.`,
    },
    10: { // October
      headline: 'Harvest Festival',
      accent: 'Season',
      subheadline: `${timeGreetings[timeOfDay]} pumpkins, game birds, and orchard fruits for your autumn table.`,
    },
    6: { // June
      headline: 'Midsummer',
      accent: 'Bounty',
      subheadline: `${timeGreetings[timeOfDay]} strawberries, new potatoes, and fresh herbs at their absolute best.`,
    },
  }

  const baseData = seasonHeadlines[season]
  const override = monthOverrides[month]

  return {
    ...baseData,
    ...override,
  }
}

interface DynamicSeasonalHeadlineProps {
  className?: string
  accentClassName?: string
}

export function DynamicSeasonalHeadline({
  className = '',
  accentClassName = 'text-serum',
}: DynamicSeasonalHeadlineProps) {
  const [headlineData, setHeadlineData] = useState<SeasonalHeadlineData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const month = getCurrentMonth()
    setHeadlineData(getSeasonalHeadlineData(month))
  }, [])

  // SSR fallback
  if (!mounted || !headlineData) {
    return (
      <>
        <span className={className}>Find Fresh Local</span>
        <span className={`block ${accentClassName}`}>Farm Shops</span>
      </>
    )
  }

  return (
    <>
      <span className={className}>{headlineData.headline}</span>
      <span className={`block ${accentClassName}`}>{headlineData.accent}</span>
    </>
  )
}

export function DynamicSeasonalSubheadline({
  countyCount,
  className = '',
}: {
  countyCount: number
  className?: string
}) {
  const [subheadline, setSubheadline] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const month = getCurrentMonth()
    const data = getSeasonalHeadlineData(month)
    setSubheadline(data.subheadline)
  }, [])

  // SSR fallback
  if (!mounted || !subheadline) {
    return (
      <span className={className}>
        Find farm shops near you with fresh local produce, seasonal UK fruit and vegetables,
        and authentic farm experiences across {countyCount} counties.
      </span>
    )
  }

  return (
    <span className={className}>
      {subheadline} Explore {countyCount} counties of local flavour.
    </span>
  )
}

/**
 * Get the current season badge for display.
 */
export function SeasonBadge({ className = '' }: { className?: string }) {
  const [seasonData, setSeasonData] = useState<{ season: Season; monthName: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const month = getCurrentMonth()
    setSeasonData({
      season: getSeason(month),
      monthName: getMonthName(month),
    })
  }, [])

  if (!mounted || !seasonData) return null

  const seasonIcons: Record<Season, string> = {
    winter: '❄',
    spring: '🌱',
    summer: '☀',
    autumn: '🍂',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-small font-medium ${className}`}>
      <span>{seasonIcons[seasonData.season]}</span>
      <span>{seasonData.monthName}</span>
    </span>
  )
}
