'use client'

import { useMemo, useCallback, useRef, useEffect, useState } from 'react'
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

  const indexRef = useRef<Supercluster<FarmPointProperties, ClusterProperties> | null>(null)
  const [isReady, setIsReady] = useState(false)

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

  // Create and load Supercluster index
  useEffect(() => {
    // Using any for Supercluster generic since ClusterProperties are auto-generated
    const index = new Supercluster<FarmPointProperties>({
      radius,
      maxZoom,
      minPoints,
      nodeSize,
    })

    index.load(points)
    indexRef.current = index as Supercluster<FarmPointProperties, ClusterProperties>
    setIsReady(true)

    return () => {
      indexRef.current = null
      setIsReady(false)
    }
  }, [points, radius, maxZoom, minPoints, nodeSize])

  // Get clusters for current viewport
  const clusters = useMemo((): ClusterOrPoint[] => {
    if (!indexRef.current || !bounds) return []

    const bbox: [number, number, number, number] = [
      bounds.west,
      bounds.south,
      bounds.east,
      bounds.north,
    ]

    // Clamp zoom to valid range
    const clampedZoom = Math.max(0, Math.min(Math.floor(zoom), maxZoom))

    try {
      return indexRef.current.getClusters(bbox, clampedZoom)
    } catch (error) {
      console.warn('[useClusteredMarkers] Error getting clusters:', error)
      return []
    }
  }, [bounds, zoom, maxZoom, isReady])

  // Get farms in a cluster
  const getClusterLeaves = useCallback(
    (clusterId: number, limit = 100, offset = 0): FarmShop[] => {
      if (!indexRef.current) return []

      try {
        const leaves = indexRef.current.getLeaves(clusterId, limit, offset)
        return leaves.map((leaf) => leaf.properties.farm)
      } catch (error) {
        console.warn('[useClusteredMarkers] Error getting cluster leaves:', error)
        return []
      }
    },
    [isReady]
  )

  // Get optimal zoom level to expand cluster
  const getClusterExpansionZoom = useCallback(
    (clusterId: number): number => {
      if (!indexRef.current) return maxZoom

      try {
        const zoom = indexRef.current.getClusterExpansionZoom(clusterId)
        return Math.min(zoom, maxZoom)
      } catch (error) {
        console.warn('[useClusteredMarkers] Error getting expansion zoom:', error)
        return maxZoom
      }
    },
    [maxZoom, isReady]
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
    isReady,
  }
}

export default useClusteredMarkers
