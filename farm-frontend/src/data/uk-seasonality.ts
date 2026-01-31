/**
 * UK Seasonal Produce Calendar
 *
 * Month-by-month UK-grown produce availability.
 * Based on the Vegetarian Society's "Seasonal UK Grown Produce" lists.
 *
 * This file provides:
 * 1. Full UK seasonal calendar (80+ items)
 * 2. Helper functions for seasonality checks
 * 3. Integration with existing produce.ts data
 */

import { PRODUCE, type Produce } from './produce'

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export const MONTH_NAMES: Record<Month, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December'
}

/**
 * UK seasonal produce by month
 * Each month maps to an array of produce names in season
 */
export const UK_SEASONAL_CALENDAR: Record<Month, string[]> = {
  1: [
    'Apples', 'Beetroot', 'Brussels Sprouts', 'Carrots', 'Celeriac', 'Celery',
    'Chicory', 'Jerusalem Artichokes', 'Kale', 'Leeks', 'Mushrooms', 'Onions',
    'Parsnips', 'Pears', 'Red Cabbage', 'Salsify', 'Savoy Cabbage', 'Spring Greens',
    'Spring Onions', 'Squash', 'Swedes', 'Turnips', 'White Cabbage'
  ],
  2: [
    'Apples', 'Beetroot', 'Brussels Sprouts', 'Carrots', 'Celeriac', 'Chicory',
    'Jerusalem Artichokes', 'Kale', 'Leeks', 'Mushrooms', 'Onions', 'Parsnips',
    'Pears', 'Purple Sprouting Broccoli', 'Red Cabbage', 'Salsify', 'Savoy Cabbage',
    'Spring Greens', 'Spring Onions', 'Squash', 'Swedes', 'White Cabbage'
  ],
  3: [
    'Artichoke', 'Beetroot', 'Carrots', 'Chicory', 'Leeks', 'Parsnips',
    'Purple Sprouting Broccoli', 'Radishes', 'Rhubarb', 'Sorrel', 'Spring Greens',
    'Spring Onions', 'Watercress'
  ],
  4: [
    'Artichoke', 'Beetroot', 'Carrots', 'Chicory', 'New Potatoes', 'Kale',
    'Morel Mushrooms', 'Parsnips', 'Radishes', 'Rhubarb', 'Rocket', 'Sorrel',
    'Spinach', 'Spring Greens', 'Spring Onions', 'Watercress'
  ],
  5: [
    'Artichoke', 'Asparagus', 'Aubergine', 'Beetroot', 'Chicory', 'Chillies',
    'Elderflowers', 'Lettuce', 'Marrow', 'New Potatoes', 'Peas', 'Peppers',
    'Radishes', 'Rhubarb', 'Rocket', 'Samphire', 'Sorrel', 'Spinach',
    'Spring Greens', 'Spring Onions', 'Strawberries', 'Sweetheart Cabbage', 'Watercress'
  ],
  6: [
    'Asparagus', 'Aubergine', 'Beetroot', 'Blackcurrants', 'Broad Beans', 'Broccoli',
    'Cauliflower', 'Cherries', 'Chicory', 'Chillies', 'Courgettes', 'Cucumber',
    'Elderflowers', 'Gooseberries', 'Lettuce', 'Marrow', 'New Potatoes', 'Peas',
    'Peppers', 'Radishes', 'Raspberries', 'Redcurrants', 'Rhubarb', 'Rocket',
    'Runner Beans', 'Samphire', 'Sorrel', 'Spring Greens', 'Spring Onions',
    'Strawberries', 'Summer Squash', 'Sweetheart Cabbage', 'Swiss Chard',
    'Tayberries', 'Turnips', 'Watercress'
  ],
  7: [
    'Aubergine', 'Beetroot', 'Blackberries', 'Blackcurrants', 'Blueberries',
    'Broad Beans', 'Broccoli', 'Carrots', 'Cauliflower', 'Cherries', 'Chicory',
    'Chillies', 'Courgettes', 'Cucumber', 'Gooseberries', 'Greengages', 'Fennel',
    'French Beans', 'Garlic', 'Kohlrabi', 'Loganberries', 'New Potatoes', 'Onions',
    'Peas', 'Potatoes', 'Radishes', 'Raspberries', 'Redcurrants', 'Rhubarb',
    'Rocket', 'Runner Beans', 'Samphire', 'Sorrel', 'Spring Greens', 'Spring Onions',
    'Strawberries', 'Summer Squash', 'Sweetheart Cabbage', 'Swiss Chard',
    'Tomatoes', 'Turnips', 'Watercress'
  ],
  8: [
    'Aubergine', 'Beetroot', 'Blackberries', 'Blackcurrants', 'Broad Beans',
    'Broccoli', 'Carrots', 'Cauliflower', 'Cherries', 'Chicory', 'Chillies',
    'Courgettes', 'Cucumber', 'Damsons', 'Fennel', 'French Beans', 'Garlic',
    'Greengages', 'Kohlrabi', 'Leeks', 'Lettuce', 'Loganberries', 'Mangetout',
    'Marrow', 'Mushrooms', 'Parsnips', 'Peas', 'Peppers', 'Potatoes', 'Plums',
    'Pumpkin', 'Radishes', 'Raspberries', 'Redcurrants', 'Rhubarb', 'Rocket',
    'Runner Beans', 'Samphire', 'Sorrel', 'Spring Greens', 'Spring Onions',
    'Strawberries', 'Summer Squash', 'Sweetcorn', 'Sweetheart Cabbage',
    'Swiss Chard', 'Tomatoes', 'Watercress', 'White Cabbage'
  ],
  9: [
    'Aubergine', 'Beetroot', 'Blackberries', 'Broccoli', 'Brussels Sprouts',
    'Butternut Squash', 'Carrots', 'Cauliflower', 'Celery', 'Courgettes', 'Chicory',
    'Chillies', 'Cucumber', 'Damsons', 'Garlic', 'Kale', 'Kohlrabi', 'Leeks',
    'Lettuce', 'Mangetout', 'Marrow', 'Onions', 'Parsnips', 'Pears', 'Peas',
    'Peppers', 'Plums', 'Potatoes', 'Pumpkin', 'Radishes', 'Raspberries',
    'Red Cabbage', 'Rhubarb', 'Rocket', 'Runner Beans', 'Samphire', 'Sorrel',
    'Spinach', 'Spring Greens', 'Spring Onions', 'Strawberries', 'Summer Squash',
    'Sweetcorn', 'Sweetheart Cabbage', 'Swiss Chard', 'Tomatoes', 'Turnips',
    'Watercress', 'Wild Mushrooms', 'White Cabbage'
  ],
  10: [
    'Aubergine', 'Apples', 'Beetroot', 'Blackberries', 'Broccoli', 'Brussels Sprouts',
    'Butternut Squash', 'Carrots', 'Cauliflower', 'Celeriac', 'Celery', 'Chestnuts',
    'Chicory', 'Chillies', 'Courgettes', 'Cucumber', 'Elderberries', 'Kale', 'Leeks',
    'Lettuce', 'Marrow', 'Onions', 'Parsnips', 'Pears', 'Peas', 'Potatoes',
    'Pumpkin', 'Quince', 'Radishes', 'Red Cabbage', 'Rocket', 'Runner Beans',
    'Salsify', 'Savoy Cabbage', 'Spinach', 'Spring Greens', 'Spring Onions',
    'Summer Squash', 'Swede', 'Sweetcorn', 'Sweetheart Cabbage', 'Swiss Chard',
    'Tomatoes', 'Turnips', 'Watercress', 'Wild Mushrooms', 'Winter Squash',
    'White Cabbage'
  ],
  11: [
    'Apples', 'Beetroot', 'Brussels Sprouts', 'Butternut Squash', 'Carrots',
    'Cauliflower', 'Celeriac', 'Celery', 'Chestnuts', 'Chicory', 'Cranberries',
    'Elderberries', 'Jerusalem Artichokes', 'Kale', 'Leeks', 'Onions', 'Parsnips',
    'Pears', 'Potatoes', 'Pumpkin', 'Quince', 'Red Cabbage', 'Salsify',
    'Savoy Cabbage', 'Swede', 'Swiss Chard', 'Turnips', 'Watercress',
    'Wild Mushrooms', 'Winter Squash', 'White Cabbage'
  ],
  12: [
    'Apples', 'Beetroot', 'Brussels Sprouts', 'Carrots', 'Celeriac', 'Celery',
    'Chestnuts', 'Chicory', 'Cranberries', 'Jerusalem Artichokes', 'Kale', 'Leeks',
    'Mushrooms', 'Onions', 'Parsnips', 'Pears', 'Potatoes', 'Pumpkin', 'Quince',
    'Red Cabbage', 'Salsify', 'Savoy Cabbage', 'Swede', 'Swiss Chard', 'Turnips',
    'Watercress', 'Winter Squash', 'White Cabbage'
  ]
}

/**
 * Get produce in season for a given month
 */
export function getProduceInSeason(month: Month): string[] {
  return UK_SEASONAL_CALENDAR[month]
}

/**
 * Check if a produce item is in season for a given month
 */
export function isInSeason(produceName: string, month: Month): boolean {
  const seasonal = UK_SEASONAL_CALENDAR[month]
  return seasonal.some(p => p.toLowerCase() === produceName.toLowerCase())
}

/**
 * Get all months when a produce item is in season
 */
export function getSeasonsForProduce(produceName: string): Month[] {
  const months: Month[] = []
  for (let m = 1; m <= 12; m++) {
    if (isInSeason(produceName, m as Month)) {
      months.push(m as Month)
    }
  }
  return months
}

/**
 * Get current month's seasonal produce
 */
export function getCurrentSeasonalProduce(): string[] {
  const currentMonth = (new Date().getMonth() + 1) as Month
  return getProduceInSeason(currentMonth)
}

// ============================================================================
// INTEGRATION WITH produce.ts
// ============================================================================

/**
 * Get produce items from produce.ts that are in season for a given month
 * Returns full Produce objects with all metadata
 */
export function getProduceItemsInSeason(month: Month): Produce[] {
  return PRODUCE.filter(p => p.monthsInSeason.includes(month))
}

/**
 * Get produce items from produce.ts that are at peak season for a given month
 */
export function getPeakProduceItems(month: Month): Produce[] {
  return PRODUCE.filter(p => p.peakMonths?.includes(month))
}

/**
 * Get current month's produce items with full metadata
 */
export function getCurrentProduceItems(): Produce[] {
  const currentMonth = (new Date().getMonth() + 1) as Month
  return getProduceItemsInSeason(currentMonth)
}

/**
 * Get current month's peak produce items
 */
export function getCurrentPeakItems(): Produce[] {
  const currentMonth = (new Date().getMonth() + 1) as Month
  return getPeakProduceItems(currentMonth)
}

/**
 * Find produce items missing from our database that are in season
 * Useful for identifying items to add
 */
export function getMissingSeasonalProduce(month: Month): string[] {
  const inSeason = UK_SEASONAL_CALENDAR[month]
  const existingSlugs = PRODUCE.map(p => p.name.toLowerCase())

  return inSeason.filter(name => {
    const lower = name.toLowerCase()
    return !existingSlugs.some(slug =>
      slug === lower ||
      slug.includes(lower) ||
      lower.includes(slug)
    )
  })
}

/**
 * Validate produce.ts seasonality against UK calendar
 * Returns discrepancies for review
 */
export function validateSeasonality(): Array<{
  slug: string
  name: string
  produceMonths: number[]
  ukCalendarMonths: number[]
  discrepancy: 'missing' | 'extra' | 'match'
}> {
  const results: Array<{
    slug: string
    name: string
    produceMonths: number[]
    ukCalendarMonths: number[]
    discrepancy: 'missing' | 'extra' | 'match'
  }> = []

  for (const item of PRODUCE) {
    const ukMonths = getSeasonsForProduce(item.name)

    if (ukMonths.length === 0) {
      // Item not found in UK calendar - might need different name
      continue
    }

    const produceSet = new Set(item.monthsInSeason)
    const ukSet = new Set(ukMonths)

    const hasMissing = ukMonths.some(m => !produceSet.has(m))
    const hasExtra = item.monthsInSeason.some(m => !ukSet.has(m))

    let discrepancy: 'missing' | 'extra' | 'match' = 'match'
    if (hasMissing && hasExtra) {
      discrepancy = 'missing' // prioritize missing
    } else if (hasMissing) {
      discrepancy = 'missing'
    } else if (hasExtra) {
      discrepancy = 'extra'
    }

    if (discrepancy !== 'match') {
      results.push({
        slug: item.slug,
        name: item.name,
        produceMonths: item.monthsInSeason,
        ukCalendarMonths: ukMonths,
        discrepancy
      })
    }
  }

  return results
}

/**
 * Get all produce that could be generated (from UK calendar)
 * but don't exist in produce.ts yet
 */
export function getGeneratableProduce(): string[] {
  const allUkProduce = new Set<string>()

  for (let m = 1; m <= 12; m++) {
    for (const name of UK_SEASONAL_CALENDAR[m as Month]) {
      allUkProduce.add(name)
    }
  }

  const existingNames = new Set(PRODUCE.map(p => p.name.toLowerCase()))

  return Array.from(allUkProduce).filter(name =>
    !existingNames.has(name.toLowerCase())
  ).sort()
}
