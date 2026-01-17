/**
 * Locations feature barrel export
 *
 * Geo utilities and location-related helpers
 */

// Re-export from shared/lib/geo (single source of truth for geo utils)
export { calculateDistance, formatDistance, sortByDistance } from '@/shared/lib/geo'

// Note: LocationTracker moved to @/features/map (it's a map-specific component)
// Future location-specific components will go here:
// export { CountySelector } from './ui/CountySelector'
// export type { Location, UKCounty } from './model/types'
// export { getUserLocation, geocodeAddress } from './lib/geolocation'
