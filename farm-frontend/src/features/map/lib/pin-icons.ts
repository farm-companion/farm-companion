/**
 * Category-Based Pin Icons for Map Markers
 *
 * Provides distinct visual icons for farm categories to improve
 * at-a-glance identification on the map.
 *
 * Design principles:
 * - Simple, recognizable silhouettes
 * - Consistent stroke width and style
 * - High contrast for visibility at all zoom levels
 * - Semantic grouping (produce, animals, experiences)
 */

export interface CategoryPinConfig {
  slug: string
  name: string
  /** Primary color for the marker */
  color: string
  /** SVG path for the icon (16x16 viewBox) */
  iconPath: string
  /** Priority for when farm has multiple categories */
  priority: number
}

/**
 * Category pin configurations
 * Higher priority = shown when farm has multiple categories
 */
export const CATEGORY_PINS: CategoryPinConfig[] = [
  // High priority - distinctive categories
  {
    slug: 'organic-farms',
    name: 'Organic',
    color: '#16A34A', // Green-600
    iconPath: 'M8 2a6 6 0 0 0-6 6c0 4 6 8 6 8s6-4 6-8a6 6 0 0 0-6-6Zm0 3a1.5 1.5 0 0 1 1.5 1.5A1.5 1.5 0 0 1 8 8a1.5 1.5 0 0 1-1.5-1.5A1.5 1.5 0 0 1 8 5Z', // Leaf
    priority: 10,
  },
  {
    slug: 'pick-your-own',
    name: 'PYO',
    color: '#DC2626', // Red-600
    iconPath: 'M12 4c-1.1 0-2 .9-2 2 0 .7.4 1.4 1 1.7V12c0 1.7-1.3 3-3 3s-3-1.3-3-3V7.7c.6-.3 1-1 1-1.7 0-1.1-.9-2-2-2s-2 .9-2 2c0 .7.4 1.4 1 1.7V12c0 2.8 2.2 5 5 5s5-2.2 5-5V7.7c.6-.3 1-1 1-1.7 0-1.1-.9-2-2-2Z', // Strawberry
    priority: 9,
  },
  {
    slug: 'dairy-farms',
    name: 'Dairy',
    color: '#0284C7', // Sky-600
    iconPath: 'M6 2c-.5 0-1 .5-1 1v2.5c0 .3.2.5.5.5h5c.3 0 .5-.2.5-.5V3c0-.5-.5-1-1-1H6Zm-2 5c-.5 0-1 .5-1 1v4c0 1.7 1.3 3 3 3h4c1.7 0 3-1.3 3-3V8c0-.5-.5-1-1-1H4Z', // Milk bottle
    priority: 8,
  },
  {
    slug: 'meat-producers',
    name: 'Meat',
    color: '#B91C1C', // Red-700
    iconPath: 'M4 4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4Zm2 2h4v1H6V6Zm0 3h4v1H6V9Z', // Steak
    priority: 7,
  },
  {
    slug: 'farm-shops',
    name: 'Shop',
    color: '#00C2B2', // Serum (default)
    iconPath: 'M3 3v2h1v8c0 .5.5 1 1 1h6c.5 0 1-.5 1-1V5h1V3H3Zm3 3h4v2H6V6Zm0 3h4v2H6V9Z', // Store
    priority: 6,
  },
  {
    slug: 'vegetable-farms',
    name: 'Vegetables',
    color: '#EA580C', // Orange-600
    iconPath: 'M8 2c-.3 0-.6.1-.8.3L4.8 4.7c-.5.3-.8.9-.8 1.5v5.6c0 .6.3 1.2.8 1.5l2.4 1.4c.5.3 1.1.3 1.6 0l2.4-1.4c.5-.3.8-.9.8-1.5V6.2c0-.6-.3-1.2-.8-1.5L8.8 3.3C8.6 2.1 8.3 2 8 2Z', // Carrot
    priority: 5,
  },
  {
    slug: 'fruit-farms',
    name: 'Fruit',
    color: '#DC2626', // Red-600
    iconPath: 'M10 2c-.5 0-1 .2-1.4.6L8 3.2l-.6-.6C7 2.2 6.5 2 6 2c-1.1 0-2 .9-2 2 0 .5.2 1 .6 1.4L8 8.8l3.4-3.4c.4-.4.6-.9.6-1.4 0-1.1-.9-2-2-2Z', // Apple
    priority: 5,
  },
  {
    slug: 'farm-cafes',
    name: 'Cafe',
    color: '#78350F', // Amber-900
    iconPath: 'M3 5v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V5H3Zm9 0v2c1.1 0 2 .9 2 2s-.9 2-2 2v1h1c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-1Z', // Coffee cup
    priority: 4,
  },
  {
    slug: 'farmers-markets',
    name: 'Market',
    color: '#7C3AED', // Violet-600
    iconPath: 'M8 2L2 5v1h12V5L8 2ZM3 7v5h2V7H3Zm4 0v5h2V7H7Zm4 0v5h2V7h-2ZM2 13v1h12v-1H2Z', // Market stall
    priority: 4,
  },
  {
    slug: 'honey-beekeeping',
    name: 'Honey',
    color: '#D97706', // Amber-600
    iconPath: 'M8 2l2.3 4H12l-4 7-4-7h1.7L8 2Z', // Honeycomb
    priority: 3,
  },
  {
    slug: 'cheese-makers',
    name: 'Cheese',
    color: '#FCD34D', // Amber-300
    iconPath: 'M2 6v6c0 .5.5 1 1 1h10c.5 0 1-.5 1-1V6l-6-4-6 4Zm4 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm4 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z', // Cheese wedge
    priority: 3,
  },
  {
    slug: 'vineyards',
    name: 'Vineyard',
    color: '#7C2D12', // Amber-900
    iconPath: 'M8 2C6 2 4 4 4 6c0 1.3.7 2.4 1.7 3H5v5c0 .5.5 1 1 1h4c.5 0 1-.5 1-1V9h-.7c1-.6 1.7-1.7 1.7-3 0-2-2-4-4-4Z', // Wine glass
    priority: 3,
  },
  {
    slug: 'christmas-trees',
    name: 'Christmas',
    color: '#15803D', // Green-700
    iconPath: 'M8 2l-4 5h2l-3 5h10l-3-5h2l-4-5ZM7 13v1h2v-1H7Z', // Christmas tree
    priority: 2,
  },
  {
    slug: 'pumpkin-patches',
    name: 'Pumpkin',
    color: '#EA580C', // Orange-600
    iconPath: 'M8 3c-.5 0-1 .5-1 1v1c-2 .5-3.5 2.3-3.5 4.5C3.5 12 5.5 14 8 14s4.5-2 4.5-4.5c0-2.2-1.5-4-3.5-4.5V4c0-.5-.5-1-1-1Z', // Pumpkin
    priority: 2,
  },
  {
    slug: 'free-range-eggs',
    name: 'Eggs',
    color: '#FBBF24', // Amber-400
    iconPath: 'M8 2c-2 0-4 2.5-4 5.5S6 14 8 14s4-3.5 4-6.5S10 2 8 2Z', // Egg
    priority: 2,
  },
  {
    slug: 'farm-stays',
    name: 'Stays',
    color: '#059669', // Emerald-600
    iconPath: 'M8 2L2 7v6c0 .5.5 1 1 1h4V9h2v5h4c.5 0 1-.5 1-1V7L8 2Z', // House
    priority: 2,
  },
  {
    slug: 'alpaca-farms',
    name: 'Alpaca',
    color: '#A855F7', // Purple-500
    iconPath: 'M10 4c0-1.1-.9-2-2-2s-2 .9-2 2c0 .5.2 1 .5 1.3C5.4 6.1 5 7.5 5 9v3c0 1.1.9 2 2 2v-1c0-.5.5-1 1-1s1 .5 1 1v1c1.1 0 2-.9 2-2V9c0-1.5-.4-2.9-1.5-3.7.3-.3.5-.8.5-1.3Z', // Alpaca head
    priority: 2,
  },
  {
    slug: 'farm-parks',
    name: 'Farm Park',
    color: '#10B981', // Emerald-500
    iconPath: 'M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm4 1c-.5 0-1 .5-1 1v1c0 .5.5 1 1 1s1-.5 1-1V6c0-.5-.5-1-1-1ZM4 9v3c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V9H4Z', // Animal
    priority: 2,
  },
]

/**
 * Default pin config for farms without category match
 */
export const DEFAULT_PIN: CategoryPinConfig = {
  slug: 'default',
  name: 'Farm',
  color: '#00C2B2', // Serum brand color
  iconPath: 'M8 2a6 6 0 0 0-6 6c0 4 6 8 6 8s6-4 6-8a6 6 0 0 0-6-6Zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z', // Pin
  priority: 0,
}

/**
 * Get the best pin config for a farm based on its offerings
 */
export function getPinForFarm(offerings?: string[]): CategoryPinConfig {
  if (!offerings || offerings.length === 0) {
    return DEFAULT_PIN
  }

  // Find the highest priority category that matches
  let bestMatch: CategoryPinConfig | null = null

  for (const pin of CATEGORY_PINS) {
    const hasMatch = offerings.some(
      offering =>
        offering.toLowerCase().includes(pin.name.toLowerCase()) ||
        pin.name.toLowerCase().includes(offering.toLowerCase()) ||
        offering.toLowerCase().replace(/\s+/g, '-') === pin.slug
    )

    if (hasMatch && (!bestMatch || pin.priority > bestMatch.priority)) {
      bestMatch = pin
    }
  }

  return bestMatch || DEFAULT_PIN
}

/**
 * Generate an SVG marker for a given category
 */
export function generateCategoryMarkerSVG(
  config: CategoryPinConfig,
  size: number = 32
): string {
  const innerSize = size * 0.5
  const centerOffset = (size - innerSize) / 2

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pin-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${config.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustColor(config.color, -30)};stop-opacity:1" />
        </linearGradient>
        <filter id="pin-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#pin-shadow)">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="url(#pin-gradient)" stroke="white" stroke-width="2"/>
        <g transform="translate(${centerOffset}, ${centerOffset}) scale(${innerSize / 16})" fill="white">
          <path d="${config.iconPath}"/>
        </g>
      </g>
    </svg>
  `.trim()
}

/**
 * Adjust hex color brightness
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Check if a farm is currently open based on hours
 */
export function isFarmOpen(hours?: Array<{ day: string; open: string; close: string }>): boolean {
  if (!hours || hours.length === 0) return false

  const now = new Date()
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

  const todayHours = hours.find(h => h.day.toLowerCase() === dayName)
  if (!todayHours) return false

  const open = todayHours.open.toLowerCase()
  const close = todayHours.close.toLowerCase()

  if (open === 'closed' || close === 'closed') return false
  if (open === '24 hours' || close === '24 hours') return true

  // Handle overnight hours (close < open means overnight)
  if (close < open) {
    return currentTime >= open || currentTime <= close
  }

  return currentTime >= open && currentTime <= close
}

/**
 * Status colors for open/closed state
 */
export const STATUS_COLORS = {
  open: '#16A34A',    // Leaf Green (Green-600)
  closed: '#A1A1AA',  // Stone Gray (Zinc-400)
  unknown: '#71717A', // Muted Gray (Zinc-500)
}

/**
 * Generate an SVG marker with open/closed status indicator
 */
export function generateStatusMarkerSVG(
  config: CategoryPinConfig,
  isOpen: boolean | null,
  size: number = 32
): string {
  const innerSize = size * 0.5
  const centerOffset = (size - innerSize) / 2

  // Determine ring color based on status
  const ringColor = isOpen === null
    ? STATUS_COLORS.unknown
    : isOpen
      ? STATUS_COLORS.open
      : STATUS_COLORS.closed

  // Desaturate the main color if closed
  const mainColor = isOpen === false
    ? desaturateColor(config.color, 0.5)
    : config.color

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pin-gradient-${isOpen}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${mainColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustColor(mainColor, -30)};stop-opacity:1" />
        </linearGradient>
        <filter id="pin-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#pin-shadow)">
        <!-- Status ring -->
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="none" stroke="${ringColor}" stroke-width="3"/>
        <!-- Main pin -->
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="url(#pin-gradient-${isOpen})" stroke="white" stroke-width="2"/>
        <g transform="translate(${centerOffset}, ${centerOffset}) scale(${innerSize / 16})" fill="white">
          <path d="${config.iconPath}"/>
        </g>
      </g>
    </svg>
  `.trim()
}

/**
 * Desaturate a hex color
 */
function desaturateColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff

  // Calculate grayscale value
  const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114)

  // Blend with grayscale
  const newR = Math.round(r + (gray - r) * amount)
  const newG = Math.round(g + (gray - g) * amount)
  const newB = Math.round(b + (gray - b) * amount)

  return `#${((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0')}`
}
