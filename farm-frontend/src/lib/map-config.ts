import type { StyleSpecification } from 'maplibre-gl'

/**
 * MapLibre GL Configuration
 *
 * Tile providers and map settings for the farm directory map.
 * Uses free tier providers with proper attribution.
 */

// =============================================================================
// TILE PROVIDERS
// =============================================================================

/**
 * Stadia Maps - Primary provider
 * Free tier: 200K tiles/day, no credit card required
 * Styles: Alidade Smooth, Outdoors, OSM Bright
 * https://stadiamaps.com/
 */
export const STADIA_STYLES = {
  // Clean, minimal style - good for data visualization
  alidadeSmooth: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
  alidadeSmoothDark: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
  // Outdoor/terrain focused
  outdoors: 'https://tiles.stadiamaps.com/styles/outdoors.json',
  // Classic OSM look
  osmBright: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
} as const

/**
 * MapTiler - Fallback provider
 * Free tier: 100K tiles/month
 * Requires API key for higher limits
 * https://www.maptiler.com/
 */
export const MAPTILER_STYLES = {
  streets: (apiKey: string) =>
    `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
  outdoor: (apiKey: string) =>
    `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${apiKey}`,
  satellite: (apiKey: string) =>
    `https://api.maptiler.com/maps/hybrid/style.json?key=${apiKey}`,
} as const

/**
 * OpenFreeMap - Primary vector provider (default, keyless)
 * No API key, no request caps. OpenMapTiles schema, recolored at runtime to
 * the Pitti Press brand by `recolorMap` in lib/map-theme.ts. Attribution is
 * added explicitly on the AttributionControl (OSM + OpenMapTiles + OpenFreeMap).
 * https://openfreemap.org/
 */
export const OPENFREEMAP_STYLES = {
  positron: 'https://tiles.openfreemap.org/styles/positron',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
} as const

/**
 * OpenStreetMap Raster - Emergency fallback
 * Unlimited, but raster (not vector) so less performant
 */
export const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

// =============================================================================
// MAP CONFIGURATION
// =============================================================================

export interface MapConfig {
  /** Map style URL or style object */
  style: string | StyleSpecification
  /** Initial center coordinates [lng, lat] */
  center: [number, number]
  /** Initial zoom level */
  zoom: number
  /** Minimum zoom level */
  minZoom: number
  /** Maximum zoom level */
  maxZoom: number
  /** Attribution HTML */
  attribution: string
  /** Whether to show attribution control */
  showAttribution: boolean
  /** Bounds to restrict panning [[sw_lng, sw_lat], [ne_lng, ne_lat]] */
  maxBounds?: [[number, number], [number, number]]
}

/**
 * Default map configuration for UK farm directory
 * Uses OSM raster tiles which work everywhere without API keys
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  style: OSM_RASTER_STYLE,
  // Center of UK (roughly Birmingham)
  center: [-1.8, 52.5],
  zoom: 6,
  minZoom: 5,
  maxZoom: 18,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  showAttribution: true,
  // Restrict to UK and Ireland with some padding
  maxBounds: [
    [-12, 49], // Southwest: west of Ireland, south of England
    [4, 61],   // Northeast: east of England, north of Scotland
  ],
}

/**
 * Dark mode map configuration
 * Note: OSM doesn't have free dark tiles, so we use the same light tiles
 */
export const DARK_MAP_CONFIG: MapConfig = {
  ...DEFAULT_MAP_CONFIG,
  // OSM doesn't have dark mode, would need CartoDB dark or similar
  style: OSM_RASTER_STYLE,
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Stadia Maps API key from environment
const STADIA_API_KEY = process.env.NEXT_PUBLIC_STADIA_API_KEY

/**
 * Get map style based on theme
 *
 * Prefers OpenFreeMap (keyless vector, recolored to brand at runtime). Uses
 * Stadia Maps if its API key is configured. OSM raster is the last-resort
 * object kept for callers that need an inline style.
 */
export function getMapStyle(isDarkMode: boolean): StyleSpecification | string {
  // If Stadia API key is available, use Stadia vector tiles
  if (STADIA_API_KEY) {
    const style = isDarkMode
      ? STADIA_STYLES.alidadeSmoothDark
      : STADIA_STYLES.alidadeSmooth
    return `${style}?api_key=${STADIA_API_KEY}`
  }

  // Default: OpenFreeMap Positron vector (no key, no caps). Recolored to the
  // Pitti Press palette by recolorMap once the style loads.
  return OPENFREEMAP_STYLES.positron
}

/**
 * Courtesy attribution to append on the map control.
 *
 * Returns undefined when a keyed provider (Stadia) is active, because that
 * style embeds its own full credit and appending here would duplicate it and
 * mis-credit OpenFreeMap. When keyless, we serve OpenFreeMap, whose vector
 * source already supplies OpenMapTiles + OSM credit, so we add only the
 * provider courtesy line.
 */
export function getMapAttribution(): string | undefined {
  if (STADIA_API_KEY) return undefined
  return '<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a>'
}

/**
 * OSM raster style object: emergency inline fallback for callers that cannot
 * use a remote vector style URL.
 */
export function getOsmRasterStyle(): StyleSpecification {
  return {
    version: 8,
    name: 'OSM Raster',
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm-tiles',
      },
    ],
  }
}

/**
 * Get map config with environment overrides
 */
export function getMapConfig(options?: {
  isDarkMode?: boolean
  maptilerKey?: string
}): MapConfig {
  const { isDarkMode = false, maptilerKey } = options || {}

  // If MapTiler key is provided, use MapTiler (higher quality)
  if (maptilerKey) {
    return {
      ...DEFAULT_MAP_CONFIG,
      style: isDarkMode
        ? MAPTILER_STYLES.streets(maptilerKey)
        : MAPTILER_STYLES.streets(maptilerKey),
      attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }
  }

  // Default to Stadia Maps (free, no key required)
  return isDarkMode ? DARK_MAP_CONFIG : DEFAULT_MAP_CONFIG
}

/**
 * Validate coordinates are within UK bounds
 */
export function isWithinUKBounds(lng: number, lat: number): boolean {
  const bounds = DEFAULT_MAP_CONFIG.maxBounds
  if (!bounds) return true

  const [[minLng, minLat], [maxLng, maxLat]] = bounds
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
}

/**
 * Clamp coordinates to UK bounds
 */
export function clampToUKBounds(lng: number, lat: number): [number, number] {
  const bounds = DEFAULT_MAP_CONFIG.maxBounds
  if (!bounds) return [lng, lat]

  const [[minLng, minLat], [maxLng, maxLat]] = bounds
  return [
    Math.max(minLng, Math.min(maxLng, lng)),
    Math.max(minLat, Math.min(maxLat, lat)),
  ]
}
