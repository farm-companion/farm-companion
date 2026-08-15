'use client'

import { useMemo, useCallback } from 'react'
import Supercluster, { ClusterFeature, PointFeature, ClusterProperties as SuperclusterClusterProps } from 'supercluster'
import { FarmShop } from '@/types/farm'

// =============================================================================
// TYPES
// =============================================================================

export interface FarmPointProperties {
  farmId: string
  farm: FarmShop
}

// Supercluster adds these properties to clusters automatically
export interface ClusterProperties extends SuperclusterClusterProps {
  cluster: true
  cluster_id: number
  point_count: number
  point_count_abbreviated: string | number
}

export type FarmPoint = PointFeature<FarmPointProperties>
export type FarmCluster = ClusterFeature<ClusterProperties>
export type ClusterOrPoint = FarmCluster | FarmPoint

export interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

export interface UseClusteredMarkersOptions {
  /** Cluster radius in pixels (default: 60) */
  radius?: number
  /** Maximum zoom level for clustering (default: 16) */
  maxZoom?: number
  /** Minimum points to form a cluster (default: 2) */
  minPoints?: number
  /** Node size for the KD-tree (default: 64) */
  nodeSize?: number
}

export interface UseClusteredMarkersResult {
  /** Clustered features (clusters and individual points) */
  clusters: ClusterOrPoint[]
  /** Get farms in a specific cluster */
  getClusterLeaves: (clusterId: number, limit?: number, offset?: number) => FarmShop[]
  /** Get expansion zoom level for a cluster */
  getClusterExpansionZoom: (clusterId: number) => number
  /** Check if a feature is a cluster */
  isCluster: (feature: ClusterOrPoint) => feature is FarmCluster
  /** Total number of farms (before clustering) */
  totalFarms: number
  /** Whether the index is ready */
  isReady: boolean
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * useClusteredMarkers - Supercluster integration for MapLibre GL
 *
 * Efficiently clusters farm markers based on zoom level and viewport bounds.
 * Uses Supercluster for high-performance spatial clustering.
 *
 * @example
 * ```tsx
 * const { clusters, getClusterLeaves, getClusterExpansionZoom, isCluster } = useClusteredMarkers(
 *   farms,
 *   zoom,
 *   bounds
 * )
 *
 * return clusters.map((feature) => {
 *   if (isCluster(feature)) {
 *     return <ClusterMarker key={feature.id} cluster={feature} ... />
 *   }
 *   return <FarmMarker key={feature.properties.farmId} farm={feature.properties.farm} ... />
 * })
 * ```
 */
export function useClusteredMarkers(
  farms: FarmShop[],
  zoom: number,
  bounds: MapBounds | null,
  options: UseClusteredMarkersOptions = {}
): UseClusteredMarkersResult {
  const {
    radius = 60,
    maxZoom = 16,
    minPoints = 2,
    nodeSize = 64,
  } = options

  // Convert farms to GeoJSON points
  const points = useMemo((): FarmPoint[] => {
    return farms
      .filter((farm) => farm.location?.lat && farm.location?.lng)
      .map((farm) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [farm.location.lng, farm.location.lat],
        },
        properties: {
          farmId: farm.id,
          farm,
        },
      }))
  }, [farms])

  // Build the Supercluster index as derived state.
  //
  // This was previously built inside an effect and stashed in a ref, which
  // made it invisible to the memos below: `clusters` could not list the index
  // as a dependency, so it keyed off `isReady` instead. That flag is already
  // true by the time `points` changes, and the cleanup/setup pair
  // (setIsReady(false) then setIsReady(true)) batches back to true without a
  // re-render. Net effect: changing the farms array rebuilt the index but
  // never recomputed `clusters`, so applying a filter without panning the map
  // left the previous markers on screen. Depending on the index value fixes
  // that at the root, and also removes the extra empty-then-populated render
  // the effect version needed on mount.
  //
  // Construction is pure (no subscription, nothing to tear down), so useMemo
  // is the correct home for it rather than an effect.
  const index = useMemo(() => {
    const built = new Supercluster<FarmPointProperties>({
      radius,
      maxZoom,
      minPoints,
      nodeSize,
    })
    built.load(points)
    return built as Supercluster<FarmPointProperties, ClusterProperties>
  }, [points, radius, maxZoom, minPoints, nodeSize])

  // Get clusters for current viewport
  const clusters = useMemo((): ClusterOrPoint[] => {
    if (!bounds) return []

    const bbox: [number, number, number, number] = [
      bounds.west,
      bounds.south,
      bounds.east,
      bounds.north,
    ]

    // Clamp zoom to valid range
    const clampedZoom = Math.max(0, Math.min(Math.floor(zoom), maxZoom))

    try {
      return index.getClusters(bbox, clampedZoom)
    } catch (error) {
      console.warn('[useClusteredMarkers] Error getting clusters:', error)
      return []
    }
  }, [index, bounds, zoom, maxZoom])

  // Get farms in a cluster
  const getClusterLeaves = useCallback(
    (clusterId: number, limit = 100, offset = 0): FarmShop[] => {
      try {
        const leaves = index.getLeaves(clusterId, limit, offset)
        return leaves.map((leaf) => leaf.properties.farm)
      } catch (error) {
        console.warn('[useClusteredMarkers] Error getting cluster leaves:', error)
        return []
      }
    },
    [index]
  )

  // Get optimal zoom level to expand cluster
  const getClusterExpansionZoom = useCallback(
    (clusterId: number): number => {
      try {
        const zoom = index.getClusterExpansionZoom(clusterId)
        return Math.min(zoom, maxZoom)
      } catch (error) {
        console.warn('[useClusteredMarkers] Error getting expansion zoom:', error)
        return maxZoom
      }
    },
    [index, maxZoom]
  )

  // Type guard for clusters
  const isCluster = useCallback(
    (feature: ClusterOrPoint): feature is FarmCluster => {
      return 'cluster' in feature.properties && feature.properties.cluster === true
    },
    []
  )

  return {
    clusters,
    getClusterLeaves,
    getClusterExpansionZoom,
    isCluster,
    totalFarms: farms.length,
    // The index is now built synchronously during render, so there is no
    // not-ready window to report. Kept in the return shape so existing
    // consumers that gate on it keep compiling and behave the same.
    isReady: true,
  }
}

export default useClusteredMarkers
