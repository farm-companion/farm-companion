/**
 * Map Provider Configuration
 *
 * Supports multiple map providers for flexibility and reliability.
 * Use NEXT_PUBLIC_MAP_PROVIDER env var to switch providers.
 *
 * Provider Options:
 * - 'leaflet': Lightweight, reliable Leaflet with OSM tiles (recommended)
 * - 'maplibre': Free, open-source MapLibre GL with Stadia Maps tiles
 * - 'google': Google Maps (requires API key, has usage costs)
 * - 'auto': Uses Leaflet by default for reliability
 *
 * Environment Variables:
 * - NEXT_PUBLIC_MAP_PROVIDER: 'leaflet' | 'maplibre' | 'google' | 'auto' (default: 'leaflet')
 * - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Required for Google Maps
 * - NEXT_PUBLIC_STADIA_API_KEY: Optional, for higher Stadia Maps limits
 * - NEXT_PUBLIC_MAPTILER_API_KEY: Optional, for MapTiler tiles
 * - NEXT_PUBLIC_GEOAPIFY_API_KEY: Optional, for Geoapify static maps
 */

export type MapProvider = 'leaflet' | 'maplibre' | 'google' | 'auto'

/**
 * Get the configured map provider
 */
export function getMapProvider(): MapProvider {
  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER as MapProvider | undefined
  return provider || 'auto'
}

/**
 * Check if MapLibre should be used
 */
export function useMapLibre(): boolean {
  const provider = getMapProvider()

  if (provider === 'maplibre') return true
  if (provider === 'google') return false

  // Auto mode: prefer MapLibre, check for WebGL support
  if (typeof window === 'undefined') return true // SSR default to MapLibre

  // Check WebGL support (required for MapLibre)
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false // Fall back to Google Maps if WebGL unavailable
  }
}

/**
 * Check if Google Maps API key is configured
 */
export function hasGoogleMapsKey(): boolean {
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
}

/**
 * Get the effective map provider based on configuration and capabilities
 */
export function getEffectiveProvider(): 'leaflet' | 'maplibre' | 'google' {
  const provider = getMapProvider()

  // Explicit provider selection
  if (provider === 'leaflet') {
    return 'leaflet'
  }

  if (provider === 'google' && hasGoogleMapsKey()) {
    return 'google'
  }

  if (provider === 'maplibre') {
    return 'maplibre'
  }

  // Auto mode: prefer Leaflet for reliability
  // Leaflet works without WebGL and has better browser compatibility
  return 'leaflet'
}

/**
 * Map provider feature comparison
 */
export const PROVIDER_FEATURES = {
  leaflet: {
    name: 'Leaflet',
    cost: 'Free (OSM tiles)',
    clustering: 'Leaflet.markercluster (client-side)',
    geocoding: 'Nominatim + Postcodes.io (free)',
    staticMaps: 'Geoapify/MapTiler (free tiers)',
    offline: 'Possible with tile caching',
    customStyles: 'Limited (tile provider dependent)',
    attribution: 'Required: OpenStreetMap',
    browserSupport: 'All browsers (no WebGL required)',
    bundleSize: '~40KB',
  },
  maplibre: {
    name: 'MapLibre GL',
    cost: 'Free (Stadia Maps free tier: 200K tiles/day)',
    clustering: 'Supercluster (client-side)',
    geocoding: 'Nominatim + Postcodes.io (free)',
    staticMaps: 'Geoapify/Stadia/MapTiler (free tiers)',
    offline: 'Possible with tile caching',
    customStyles: 'Full control via style JSON',
    attribution: 'Required: Stadia Maps, OpenMapTiles, OpenStreetMap',
    browserSupport: 'Modern browsers with WebGL',
    bundleSize: '~200KB',
  },
  google: {
    name: 'Google Maps',
    cost: 'Paid ($7/1000 loads after $200 free credit)',
    clustering: 'MarkerClusterer (client-side)',
    geocoding: 'Google Places (paid)',
    staticMaps: 'Google Static Maps (paid)',
    offline: 'Limited',
    customStyles: 'Google Cloud Console',
    attribution: 'Automatic',
    browserSupport: 'All browsers',
    bundleSize: '~150KB (external)',
  },
} as const

/**
 * Migration checklist for removing Google Maps
 *
 * Before setting NEXT_PUBLIC_MAP_PROVIDER='maplibre':
 *
 * 1. Verify WebGL support in target browsers
 * 2. Test clustering performance with your data volume
 * 3. Ensure Stadia Maps tiles load correctly
 * 4. Verify geocoding works (Nominatim rate limits)
 * 5. Test static maps in LocationCard
 * 6. Verify mobile touch gestures
 * 7. Test keyboard accessibility
 * 8. Check performance (target: 60fps pan/zoom)
 *
 * After successful migration:
 *
 * 1. Remove @googlemaps/js-api-loader from package.json
 * 2. Remove @googlemaps/markerclusterer from package.json
 * 3. Remove @vis.gl/react-google-maps from package.json
 * 4. Remove @types/google.maps from package.json
 * 5. Delete lib/googleMaps.ts
 * 6. Delete ui/MapShell.tsx (keep MapLibreShell.tsx)
 * 7. Remove NEXT_PUBLIC_GOOGLE_MAPS_API_KEY from env
 */
