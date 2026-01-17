/**
 * Type definitions for map-related components and interactions
 */

import type { FarmShop } from '@/types/farm'

/**
 * Marker click event from Google Maps
 */
export interface MarkerClickEvent {
  latLng: google.maps.LatLng
  domEvent: MouseEvent
}

/**
 * Cluster click event from MarkerClusterer
 * Matches MapMouseEvent from @googlemaps/markerclusterer
 */
export interface ClusterClickEvent {
  latLng: google.maps.LatLng | null
  markers?: google.maps.Marker[]
  // Note: cluster object varies by markerclusterer version
  cluster?: any
  domEvent?: Event
  stop?: () => void
}

/**
 * Farm marker with associated data
 */
export interface FarmMarker {
  id: string
  name: string
  position: google.maps.LatLng
  farm: FarmShop
}

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
 * Extended marker with farm data
 */
export interface FarmMarkerExtended extends google.maps.Marker {
  farmData?: FarmShop
}

/**
 * Window with map utility functions
 */
export interface WindowWithMapUtils extends Window {
  zoomToUKOverview?: () => void
}
