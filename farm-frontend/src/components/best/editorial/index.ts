/**
 * Luxury Editorial Design System
 *
 * Inspired by Louis Vuitton Magazine aesthetics.
 * Principles: Structural Invisibility, The Luxury of Space, Rule of 80/20
 */

export { EditorialHero } from './EditorialHero'
export { AsymmetricalGrid } from './AsymmetricalGrid'
export { EditorialCard } from './EditorialCard'
export { DataCallout } from './DataCallout'
export { PillarCarousel } from './PillarCarousel'
export { ScrollIndicator } from './ScrollIndicator'

// Design Tokens
export const EDITORIAL_COLORS = {
  paperWhite: '#F9F9F9',
  deepCharcoal: '#1A1A1A',
  warmGray: '#6B6B6B',
  accentSage: '#5d6d3f',
  divider: '#E5E5E5',
} as const

export const EDITORIAL_SPACING = {
  gutter: 'clamp(2rem, 8vw, 8rem)',
  sectionY: 'clamp(4rem, 12vh, 10rem)',
  cardGap: 'clamp(1.5rem, 4vw, 4rem)',
} as const
