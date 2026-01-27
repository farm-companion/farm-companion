/**
 * MapLibre GL Components
 *
 * Free, open-source map components using MapLibre GL + Stadia Maps tiles.
 */

export { MapLibreProvider, useMapLibre, useMapLibreSafe } from './MapLibreProvider'

// Re-export map config utilities
export {
  DEFAULT_MAP_CONFIG,
  DARK_MAP_CONFIG,
  STADIA_STYLES,
  getMapStyle,
  getMapConfig,
  isWithinUKBounds,
  clampToUKBounds,
} from '@/lib/map-config'
export type { MapConfig } from '@/lib/map-config'
