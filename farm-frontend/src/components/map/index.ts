/**
 * MapLibre GL Components
 *
 * Free, open-source map components using MapLibre GL + Stadia Maps tiles.
 */

export { MapLibreProvider, useMapLibre, useMapLibreSafe } from './MapLibreProvider'
export { MapLibreMap } from './MapLibreMap'
export type { MapLibreMapRef, MapLibreMapProps } from './MapLibreMap'

// Marker components
export { FarmMarker, FarmMarkerLayer } from './FarmMarker'
export type { FarmMarkerProps, FarmMarkerLayerProps } from './FarmMarker'

export { ClusterMarker, ClusterMarkerLayer } from './ClusterMarker'
export type { ClusterMarkerProps, ClusterMarkerLayerProps } from './ClusterMarker'

export { ClusteredFarmMarkerLayer } from './ClusteredFarmMarkerLayer'
export type { ClusteredFarmMarkerLayerProps } from './ClusteredFarmMarkerLayer'

// Popup and interaction components
export { FarmPopup } from './FarmPopup'
export type { FarmPopupProps } from './FarmPopup'

export { MobileMarkerSheet } from './MobileMarkerSheet'
export type { MobileMarkerSheetProps } from './MobileMarkerSheet'

// Keyboard navigation
export { useMarkerKeyboardNav, MarkerAnnouncer } from './useMarkerKeyboardNav'
export type {
  UseMarkerKeyboardNavOptions,
  UseMarkerKeyboardNavResult,
  MarkerAnnouncerProps,
} from './useMarkerKeyboardNav'

// Re-export clustering hook
export { useClusteredMarkers } from '@/features/map/hooks/useClusteredMarkers'
export type {
  MapBounds,
  FarmPoint,
  FarmCluster,
  ClusterOrPoint,
  UseClusteredMarkersOptions,
  UseClusteredMarkersResult,
} from '@/features/map/hooks/useClusteredMarkers'

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

// Re-export cluster config utilities
export {
  CLUSTER_TIERS,
  CLUSTER_EASING,
  CLUSTER_ZOOM_THRESHOLDS,
  getClusterTier,
  getZoomAwareSize,
  getClusterTargetZoom,
  animateMapLibreZoomTo,
  expandClusterAnimated,
} from '@/features/map/lib/cluster-config'
export type { ClusterTier } from '@/features/map/lib/cluster-config'
