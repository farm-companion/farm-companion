/**
 * Seasonal Utilities
 *
 * Helper functions for determining what produce is in season.
 * Used by the "What's In Season Now" homepage module.
 */

import { PRODUCE, type Produce } from '@/data/produce'

export interface SeasonalProduce extends Produce {
  seasonStatus: 'peak' | 'in-season' | 'ending'
}

/**
 * Get produce items that are in season for a given month.
 * @param month - Month number (1-12, where 1 = January)
 * @returns Array of produce items sorted by peak status first
 */
export function getProduceInSeason(month: number): SeasonalProduce[] {
  const inSeason = PRODUCE.filter(p => p.monthsInSeason.includes(month))

  return inSeason.map(p => ({
    ...p,
    seasonStatus: getSeasonStatus(p, month)
  })).sort((a, b) => {
    // Sort: peak first, then in-season, then ending
    const order = { peak: 0, 'in-season': 1, ending: 2 }
    return order[a.seasonStatus] - order[b.seasonStatus]
  })
}

/**
 * Determine the season status for a produce item.
 */
function getSeasonStatus(produce: Produce, month: number): 'peak' | 'in-season' | 'ending' {
  if (produce.peakMonths?.includes(month)) {
    return 'peak'
  }

  const monthIndex = produce.monthsInSeason.indexOf(month)
  const isLastMonth = monthIndex === produce.monthsInSeason.length - 1

  if (isLastMonth) {
    return 'ending'
  }

  return 'in-season'
}

/**
 * Get the current month (1-12).
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1 // getMonth() returns 0-11
}

/**
 * Get month name from number.
 */
export function getMonthName(month: number): string {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return names[month - 1] || ''
}
