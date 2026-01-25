/**
 * Amenity Definitions
 *
 * Shop amenities and facilities with their icon identifiers.
 * Used for quick visual scanning on shop cards.
 *
 * Design System Compliance:
 * - Icons: 16px (w-4 h-4) for compact display
 * - Spacing: 8px gap between icons
 * - Colors: Semantic based on category
 */

import type { LucideIcon } from 'lucide-react'
import {
  Accessibility,
  Coffee,
  Apple,
  Leaf,
  Car,
  Dog,
  CreditCard,
  Toilet,
  Utensils,
  Baby,
  Wifi,
  Gift,
} from 'lucide-react'

export interface Amenity {
  id: string
  label: string
  shortLabel: string
  icon: LucideIcon
  /** Color class for the icon */
  colorClass: string
  /** Background color class for the badge */
  bgClass: string
  /** Category for grouping */
  category: 'accessibility' | 'food' | 'services' | 'products'
}

/**
 * All supported amenities with their visual configuration.
 * Order matters for display priority.
 */
export const AMENITIES: Record<string, Amenity> = {
  wheelchair: {
    id: 'wheelchair',
    label: 'Wheelchair Accessible',
    shortLabel: 'Accessible',
    icon: Accessibility,
    colorClass: 'text-info dark:text-info',
    bgClass: 'bg-info-light dark:bg-info/20',
    category: 'accessibility',
  },
  cafe: {
    id: 'cafe',
    label: 'Cafe On-site',
    shortLabel: 'Cafe',
    icon: Coffee,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    category: 'food',
  },
  pyo: {
    id: 'pyo',
    label: 'Pick Your Own',
    shortLabel: 'PYO',
    icon: Apple,
    colorClass: 'text-success dark:text-success',
    bgClass: 'bg-success-light dark:bg-success/20',
    category: 'products',
  },
  organic: {
    id: 'organic',
    label: 'Organic Produce',
    shortLabel: 'Organic',
    icon: Leaf,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    category: 'products',
  },
  parking: {
    id: 'parking',
    label: 'Free Parking',
    shortLabel: 'Parking',
    icon: Car,
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    category: 'services',
  },
  petFriendly: {
    id: 'petFriendly',
    label: 'Pet Friendly',
    shortLabel: 'Pets OK',
    icon: Dog,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    category: 'services',
  },
  cardPayment: {
    id: 'cardPayment',
    label: 'Card Payment Accepted',
    shortLabel: 'Card',
    icon: CreditCard,
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-100 dark:bg-violet-900/30',
    category: 'services',
  },
  toilets: {
    id: 'toilets',
    label: 'Public Toilets',
    shortLabel: 'Toilets',
    icon: Toilet,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-100 dark:bg-sky-900/30',
    category: 'services',
  },
  restaurant: {
    id: 'restaurant',
    label: 'Restaurant',
    shortLabel: 'Restaurant',
    icon: Utensils,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-100 dark:bg-rose-900/30',
    category: 'food',
  },
  babyChanging: {
    id: 'babyChanging',
    label: 'Baby Changing Facilities',
    shortLabel: 'Baby',
    icon: Baby,
    colorClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-100 dark:bg-pink-900/30',
    category: 'services',
  },
  wifi: {
    id: 'wifi',
    label: 'Free WiFi',
    shortLabel: 'WiFi',
    icon: Wifi,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    category: 'services',
  },
  giftShop: {
    id: 'giftShop',
    label: 'Gift Shop',
    shortLabel: 'Gifts',
    icon: Gift,
    colorClass: 'text-fuchsia-600 dark:text-fuchsia-400',
    bgClass: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    category: 'products',
  },
}

/**
 * Get amenity by ID
 */
export function getAmenity(id: string): Amenity | undefined {
  return AMENITIES[id]
}

/**
 * Get multiple amenities by IDs
 */
export function getAmenities(ids: string[]): Amenity[] {
  return ids
    .map((id) => AMENITIES[id])
    .filter((amenity): amenity is Amenity => amenity !== undefined)
}

/**
 * Priority order for display (most important first)
 */
export const AMENITY_DISPLAY_ORDER = [
  'wheelchair',
  'organic',
  'pyo',
  'cafe',
  'restaurant',
  'parking',
  'cardPayment',
  'petFriendly',
  'toilets',
  'babyChanging',
  'wifi',
  'giftShop',
]

/**
 * Sort amenities by display priority
 */
export function sortAmenitiesByPriority(amenities: Amenity[]): Amenity[] {
  return [...amenities].sort((a, b) => {
    const aIndex = AMENITY_DISPLAY_ORDER.indexOf(a.id)
    const bIndex = AMENITY_DISPLAY_ORDER.indexOf(b.id)
    return aIndex - bIndex
  })
}
