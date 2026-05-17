/**
 * Type definitions for map-related components and interactions.
 * Provider-agnostic (no Google Maps types).
 */

import type { FarmShop } from '@/types/farm'

/**
 * Combined marker state for atomic updates
 */
export interface MarkerState {
  selected: FarmShop | null
  showActions: boolean
}

/**
 * User location state
 */
export interface UserLocation {
  lat: number
  lng: number
  accuracy?: number
  timestamp?: number
}

/**
 * Map bounds for viewport queries
 */
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

/**
 * Farm status based on opening hours
 */
export interface FarmStatus {
  status: 'open' | 'closed' | 'unknown'
  closesAt?: string
  opensAt?: string
  nextOpen?: Date
}

/**
 * Window with map utility functions
 */
export interface WindowWithMapUtils extends Window {
  zoomToUKOverview?: () => void
}
