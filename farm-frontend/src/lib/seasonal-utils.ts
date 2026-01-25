/**
 * Seasonal Utilities
 *
 * Helper functions for determining what produce is in season.
 * Used by the "What's In Season Now" homepage module.
 */

import { PRODUCE, type Produce } from '@/data/produce'

export type SeasonStatus = 'peak' | 'in-season' | 'ending' | 'starting'
export type SeasonPhase = 'early' | 'mid' | 'late'
export type ProduceCategory = 'fruit' | 'vegetable' | 'herb' | 'other'

export interface SeasonalProduce extends Produce {
  seasonStatus: SeasonStatus
  seasonPhase: SeasonPhase
  seasonProgress: number // 0-100, percentage through the season
  daysRemaining: number | null // days until season ends, null if not in season
  daysUntilSeason: number | null // days until season starts, null if in season
  category: ProduceCategory
}

// Category mappings for produce
const PRODUCE_CATEGORIES: Record<string, ProduceCategory> = {
  'strawberries': 'fruit',
  'blackberries': 'fruit',
  'apples': 'fruit',
  'plums': 'fruit',
  'tomato': 'fruit', // botanically a fruit
  'sweetcorn': 'vegetable',
  'runner-beans': 'vegetable',
  'asparagus': 'vegetable',
  'kale': 'vegetable',
  'leeks': 'vegetable',
  'pumpkins': 'vegetable',
  'purple-sprouting-broccoli': 'vegetable',
}

/**
 * Get the category for a produce item.
 */
export function getProduceCategory(slug: string): ProduceCategory {
  return PRODUCE_CATEGORIES[slug] || 'other'
}

/**
 * Calculate the season phase (early, mid, late) based on position in season.
 */
function getSeasonPhase(produce: Produce, month: number): SeasonPhase {
  const monthIndex = produce.monthsInSeason.indexOf(month)
  if (monthIndex === -1) return 'mid'

  const totalMonths = produce.monthsInSeason.length
  const position = monthIndex / totalMonths

  if (position < 0.33) return 'early'
  if (position > 0.66) return 'late'
  return 'mid'
}

/**
 * Calculate season progress as a percentage (0-100).
 * Accounts for current day within the month.
 */
function getSeasonProgress(produce: Produce, currentDate: Date): number {
  const month = currentDate.getMonth() + 1
  const dayOfMonth = currentDate.getDate()
  const daysInMonth = new Date(currentDate.getFullYear(), month, 0).getDate()

  if (!produce.monthsInSeason.includes(month)) return 0

  const monthIndex = produce.monthsInSeason.indexOf(month)
  const totalMonths = produce.monthsInSeason.length

  // Calculate progress: completed months + fraction of current month
  const completedMonths = monthIndex
  const currentMonthProgress = dayOfMonth / daysInMonth
  const progress = ((completedMonths + currentMonthProgress) / totalMonths) * 100

  return Math.min(100, Math.max(0, Math.round(progress)))
}

/**
 * Calculate days remaining in season from current date.
 */
function getDaysRemaining(produce: Produce, currentDate: Date): number | null {
  const month = currentDate.getMonth() + 1
  if (!produce.monthsInSeason.includes(month)) return null

  const lastMonth = produce.monthsInSeason[produce.monthsInSeason.length - 1]
  const year = currentDate.getFullYear()

  // Handle year wrap (e.g., season ending in January)
  const adjustedYear = lastMonth < month ? year + 1 : year

  // End of last month in season
  const seasonEnd = new Date(adjustedYear, lastMonth, 0) // Last day of the month

  const diffTime = seasonEnd.getTime() - currentDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Calculate days until season starts from current date.
 */
function getDaysUntilSeason(produce: Produce, currentDate: Date): number | null {
  const month = currentDate.getMonth() + 1
  if (produce.monthsInSeason.includes(month)) return null

  const firstMonth = produce.monthsInSeason[0]
  const year = currentDate.getFullYear()

  // Handle year wrap (e.g., season starting in January when current month is December)
  const adjustedYear = firstMonth < month ? year + 1 : year

  // First day of first month in season
  const seasonStart = new Date(adjustedYear, firstMonth - 1, 1)

  const diffTime = seasonStart.getTime() - currentDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Get produce items that are in season for a given month.
 * @param month - Month number (1-12, where 1 = January)
 * @returns Array of produce items sorted by peak status first
 */
export function getProduceInSeason(month: number): SeasonalProduce[] {
  const currentDate = new Date()
  const inSeason = PRODUCE.filter(p => p.monthsInSeason.includes(month))

  return inSeason.map(p => ({
    ...p,
    seasonStatus: getSeasonStatus(p, month),
    seasonPhase: getSeasonPhase(p, month),
    seasonProgress: getSeasonProgress(p, currentDate),
    daysRemaining: getDaysRemaining(p, currentDate),
    daysUntilSeason: getDaysUntilSeason(p, currentDate),
    category: getProduceCategory(p.slug),
  })).sort((a, b) => {
    // Sort: peak first, then in-season, then ending
    const order = { peak: 0, starting: 1, 'in-season': 2, ending: 3 }
    return order[a.seasonStatus] - order[b.seasonStatus]
  })
}

/**
 * Get all produce with seasonal metadata for the current date.
 */
export function getAllProduceWithSeasonalData(): SeasonalProduce[] {
  const currentDate = new Date()
  const month = currentDate.getMonth() + 1

  return PRODUCE.map(p => ({
    ...p,
    seasonStatus: p.monthsInSeason.includes(month) ? getSeasonStatus(p, month) : 'ending',
    seasonPhase: getSeasonPhase(p, month),
    seasonProgress: getSeasonProgress(p, currentDate),
    daysRemaining: getDaysRemaining(p, currentDate),
    daysUntilSeason: getDaysUntilSeason(p, currentDate),
    category: getProduceCategory(p.slug),
  }))
}

/**
 * Determine the season status for a produce item.
 */
function getSeasonStatus(produce: Produce, month: number): SeasonStatus {
  if (produce.peakMonths?.includes(month)) {
    return 'peak'
  }

  const monthIndex = produce.monthsInSeason.indexOf(month)
  const isFirstMonth = monthIndex === 0
  const isLastMonth = monthIndex === produce.monthsInSeason.length - 1

  if (isFirstMonth) {
    return 'starting'
  }

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

/**
 * Get short month name from number.
 */
export function getShortMonthName(month: number): string {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return names[month - 1] || ''
}

/**
 * Format days remaining as human-readable string.
 */
export function formatDaysRemaining(days: number | null): string {
  if (days === null) return 'Not in season'
  if (days === 0) return 'Last day'
  if (days === 1) return '1 day left'
  if (days < 7) return `${days} days left`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? '1 week left' : `${weeks} weeks left`
  }
  const months = Math.round(days / 30)
  return months === 1 ? '1 month left' : `${months} months left`
}

/**
 * Format days until season as human-readable string.
 */
export function formatDaysUntilSeason(days: number | null): string {
  if (days === null) return 'In season now'
  if (days === 0) return 'Starts today'
  if (days === 1) return 'Starts tomorrow'
  if (days < 7) return `In ${days} days`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? 'In 1 week' : `In ${weeks} weeks`
  }
  const months = Math.round(days / 30)
  return months === 1 ? 'In 1 month' : `In ${months} months`
}
