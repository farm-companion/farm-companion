/**
 * Map feature barrel export
 *
 * All map-related components, hooks, and utilities
 */

// UI Components
export { default as MapShell } from './ui/MapShell'
export { default as MapLibreShell } from './ui/MapLibreShell'
export { default as MapSearch } from './ui/MapSearch'
export { default as LocationTracker } from './ui/LocationTracker'
export { default as LiveLocationTracker } from './ui/LiveLocationTracker'
export { default as ClusterPreview } from './ui/ClusterPreview'
export { default as MarkerActions } from './ui/MarkerActions'
export { default as SearchAreaControl } from './ui/SearchAreaControl'
export { default as FilterOverlayPanel } from './ui/FilterOverlayPanel'
export { default as LocationControl } from './ui/LocationControl'
export { default as MapControls } from './ui/MapControls'
export { default as ScaleBar } from './ui/ScaleBar'

// Hooks
export { useClusteredMarkers } from './hooks/useClusteredMarkers'
export type {
  MapBounds,
  FarmPoint,
  FarmCluster,
  ClusterOrPoint,
  UseClusteredMarkersOptions,
  UseClusteredMarkersResult,
} from './hooks/useClusteredMarkers'

export { useMarkerKeyboardNav } from './hooks/useMarkerKeyboardNav'
export type {
  UseMarkerKeyboardNavOptions,
  UseMarkerKeyboardNavResult,
} from './hooks/useMarkerKeyboardNav'

export { useMapLocation } from './hooks/useMapLocation'
export type {
  MapLocationState,
  UseMapLocationOptions,
  UseMapLocationResult,
} from './hooks/useMapLocation'
