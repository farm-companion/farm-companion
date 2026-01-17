/**
 * Locations feature barrel export
 *
 * TODO: Populate as components are migrated
 */

// Re-export from shared/lib/geo (single source of truth for geo utils)
export { calculateDistance, formatDistance, sortByDistance } from '@/shared/lib/geo'

// Re-export existing components (compatibility layer)
export { default as LocationTracker } from '@/components/LocationTracker'

// Placeholder for future migrations
// export { LocationTracker } from './ui/LocationTracker'
// export { CountySelector } from './ui/CountySelector'
// export type { Location, UKCounty } from './model/types'
// export { getUserLocation, geocodeAddress } from './lib/geolocation'
