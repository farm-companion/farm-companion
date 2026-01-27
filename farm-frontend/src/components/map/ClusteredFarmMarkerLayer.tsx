'use client'

import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import { Map as MapLibreMapInstance } from 'maplibre-gl'
import { FarmShop } from '@/types/farm'
import { FarmMarker } from './FarmMarker'
import { ClusterMarker } from './ClusterMarker'
import {
  useClusteredMarkers,
  MapBounds,
  FarmCluster,
  FarmPoint,
} from '@/features/map/hooks/useClusteredMarkers'
import {
  expandClusterAnimated,
  CLUSTER_ZOOM_THRESHOLDS,
} from '@/features/map/lib/cluster-config'

// =============================================================================
// TYPES
// =============================================================================

export interface ClusteredFarmMarkerLayerProps {
  /** Array of farms to display */
  farms: FarmShop[]
  /** MapLibre map instance */
  map: MapLibreMapInstance | null
  /** Current zoom level */
  zoom: number
  /** Current map bounds */
  bounds: MapBounds | null
  /** Currently selected farm ID */
  selectedFarmId?: string | null
  /** Callback when a farm marker is clicked */
  onFarmClick?: (farm: FarmShop) => void
  /** Callback when a farm marker is hovered */
  onFarmHover?: (farm: FarmShop | null) => void
  /** Callback when a cluster is clicked (optional, defaults to expansion) */
  onClusterClick?: (farms: FarmShop[], coordinates: [number, number]) => void
  /** Maximum farms in cluster before forcing zoom instead of preview */
  previewMaxCount?: number
  /** User prefers reduced motion */
  prefersReducedMotion?: boolean
  /** Cluster radius in pixels */
  clusterRadius?: number
  /** Maximum zoom level for clustering */
  clusterMaxZoom?: number
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Clustered Farm Marker Layer
 *
 * Combines Supercluster-based clustering with individual farm markers.
 * Automatically switches between clusters and individual markers based on zoom.
 *
 * Features:
 * - Efficient spatial clustering with Supercluster
 * - Smooth zoom-to-expand animations
 * - Click to expand or preview small clusters
 * - Hover states for both clusters and markers
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <ClusteredFarmMarkerLayer
 *   farms={farms}
 *   map={mapInstance}
 *   zoom={currentZoom}
 *   bounds={mapBounds}
 *   selectedFarmId={selectedFarm?.id}
 *   onFarmClick={(farm) => setSelectedFarm(farm)}
 *   onClusterClick={(farms, coords) => showClusterPreview(farms)}
 * />
 * ```
 */
export function ClusteredFarmMarkerLayer({
  farms,
  map,
  zoom,
  bounds,
  selectedFarmId,
  onFarmClick,
  onFarmHover,
  onClusterClick,
  previewMaxCount = CLUSTER_ZOOM_THRESHOLDS.PREVIEW_MAX_COUNT,
  prefersReducedMotion = false,
  clusterRadius = 60,
  clusterMaxZoom = 16,
}: ClusteredFarmMarkerLayerProps) {
  const [hoveredFarmId, setHoveredFarmId] = useState<string | null>(null)
  const [hoveredClusterId, setHoveredClusterId] = useState<number | null>(null)
  const isExpandingRef = useRef(false)

  // Get clustered features
  const {
    clusters: allFeatures,
    getClusterLeaves,
    getClusterExpansionZoom,
    isCluster,
    isReady,
  } = useClusteredMarkers(farms, zoom, bounds, {
    radius: clusterRadius,
    maxZoom: clusterMaxZoom,
  })

  // Separate clusters and individual points
  const { clusterFeatures, pointFeatures } = useMemo(() => {
    const clusterFeatures: FarmCluster[] = []
    const pointFeatures: FarmPoint[] = []

    for (const feature of allFeatures) {
      if (isCluster(feature)) {
        clusterFeatures.push(feature)
      } else {
        pointFeatures.push(feature as FarmPoint)
      }
    }

    return { clusterFeatures, pointFeatures }
  }, [allFeatures, isCluster])

  // Check reduced motion preference
  const [localPrefersReducedMotion, setLocalPrefersReducedMotion] = useState(prefersReducedMotion)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setLocalPrefersReducedMotion(prefersReducedMotion || mediaQuery.matches)

      const handler = (e: MediaQueryListEvent) => {
        setLocalPrefersReducedMotion(prefersReducedMotion || e.matches)
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [prefersReducedMotion])

  // Handle cluster click
  const handleClusterClick = useCallback(
    async (clusterId: number, coordinates: [number, number], count: number) => {
      if (!map || isExpandingRef.current) return

      // Get farms in this cluster
      const clusterFarms = getClusterLeaves(clusterId)

      // For small clusters, show preview if callback provided
      if (count <= previewMaxCount && onClusterClick) {
        onClusterClick(clusterFarms, coordinates)
        return
      }

      // For larger clusters, zoom to expand
      isExpandingRef.current = true

      try {
        const expansionZoom = getClusterExpansionZoom(clusterId)
        await expandClusterAnimated(map, expansionZoom, coordinates, {
          prefersReducedMotion: localPrefersReducedMotion,
        })
      } finally {
        isExpandingRef.current = false
      }
    },
    [map, getClusterLeaves, getClusterExpansionZoom, previewMaxCount, onClusterClick, localPrefersReducedMotion]
  )

  // Handle cluster hover
  const handleClusterHover = useCallback((clusterId: number | null) => {
    setHoveredClusterId(clusterId)
  }, [])

  // Handle farm marker click
  const handleFarmClick = useCallback(
    (farm: FarmShop) => {
      onFarmClick?.(farm)
    },
    [onFarmClick]
  )

  // Handle farm marker hover
  const handleFarmHover = useCallback(
    (farm: FarmShop | null) => {
      setHoveredFarmId(farm?.id ?? null)
      onFarmHover?.(farm)
    },
    [onFarmHover]
  )

  if (!map || !isReady) return null

  return (
    <>
      {/* Render cluster markers */}
      {clusterFeatures.map((cluster) => (
        <ClusterMarker
          key={`cluster-${cluster.properties.cluster_id}`}
          cluster={cluster}
          map={map}
          zoom={zoom}
          hovered={hoveredClusterId === cluster.properties.cluster_id}
          onClick={handleClusterClick}
          onHover={handleClusterHover}
        />
      ))}

      {/* Render individual farm markers */}
      {pointFeatures.map((point) => (
        <FarmMarker
          key={point.properties.farmId}
          farm={point.properties.farm}
          map={map}
          selected={selectedFarmId === point.properties.farmId}
          hovered={hoveredFarmId === point.properties.farmId}
          onClick={handleFarmClick}
          onHover={handleFarmHover}
        />
      ))}
    </>
  )
}

export default ClusteredFarmMarkerLayer
