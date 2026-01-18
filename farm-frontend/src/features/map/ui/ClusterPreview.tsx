'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, ZoomIn, List, Navigation } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import type { FarmMarkerExtended, ClusterData } from '@/types/map'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'

interface ClusterPreviewProps {
  cluster: {
    position: google.maps.LatLng
    markers: google.maps.Marker[]
    count: number
  } | null
  isVisible: boolean
  onClose: () => void
  onZoomToCluster: (cluster: ClusterData) => void
  onShowAllFarms: (farms: FarmShop[]) => void
  userLocation: { latitude: number; longitude: number } | null
}

export default function ClusterPreview({
  cluster,
  isVisible,
  onClose,
  onZoomToCluster,
  onShowAllFarms,
  userLocation
}: ClusterPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [farms, setFarms] = useState<FarmShop[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Extract farm data from markers
  useEffect(() => {
    if (cluster?.markers) {
      const farmData = cluster.markers
        .map(marker => {
          const farmMarker = marker as FarmMarkerExtended
          return farmMarker.farmData
        })
        .filter((farm): farm is FarmShop => farm !== undefined && farm !== null)

      setFarms(farmData)

      if (farmData.length === 0 && cluster.markers.length > 0) {
        console.error('ClusterPreview: No farm data found on markers. Ensure markers have farmData attached.')
      }
    } else {
      setFarms([])
    }
  }, [cluster])

  // Auto-expand after a short delay
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsExpanded(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsExpanded(false)
    }
  }, [isVisible])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose()
      }
    }
    
    if (isVisible) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  // Calculate cluster center and bounds
  const getClusterInfo = () => {
    if (!cluster) return null

    const bounds = new google.maps.LatLngBounds()
    cluster.markers.forEach(marker => {
      const pos = marker.getPosition()
      if (pos) bounds.extend(pos)
    })

    return {
      center: cluster.position,
      bounds,
      radius: Math.sqrt(farms.length) * 50 // Approximate radius based on farm count
    }
  }

  // Calculate distance from user
  const getDistanceFromUser = (lat: number, lng: number) => {
    if (!userLocation) return null

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      lat,
      lng
    )

    return formatDistance(distance)
  }

  if (!cluster || !isVisible) return null

  // Don't render if no farm data available
  if (farms.length === 0) {
    return null
  }

  const clusterInfo = getClusterInfo()
  const distanceFromUser = userLocation ? getDistanceFromUser(userLocation.latitude, userLocation.longitude) : null

  return (
    <>
      {/* Backdrop - Premium blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Cluster Preview Sheet - Premium glassmorphism */}
      <div
        ref={containerRef}
        className={`fixed bottom-0 left-0 right-0 fc-sheet-content z-50 transform ${
          isExpanded ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '70vh',
          minHeight: '250px'
        }}
      >
        {/* Drag Handle - Premium pill */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="fc-sheet-grip" />
        </div>

        {/* Cluster Header - Premium styling */}
        <div className="px-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-primary/80 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-primary/20">
                  {farms.length}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {farms.length} {farms.length === 1 ? 'Farm' : 'Farms'}
                  </h3>
                  {distanceFromUser && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {distanceFromUser} from you
                    </p>
                  )}
                </div>
              </div>

              {/* Cluster Area Info */}
              <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>Cluster area</span>
                <span className="text-neutral-300 dark:text-neutral-600">|</span>
                <span>~{Math.round(clusterInfo?.radius || 0)}m radius</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Premium buttons */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Zoom to Cluster */}
            <button
              onClick={() => {
                onZoomToCluster(cluster)
                onClose()
              }}
              className="flex flex-col items-center p-3 bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white rounded-xl font-medium shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-150"
            >
              <ZoomIn className="w-5 h-5 mb-1" />
              <span className="text-xs">Zoom In</span>
            </button>

            {/* Show All Farms */}
            <button
              onClick={() => {
                onShowAllFarms(farms)
                onClose()
              }}
              className="flex flex-col items-center p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-xl font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <List className="w-5 h-5 mb-1" />
              <span className="text-xs">List View</span>
            </button>

            {/* Navigate to Area */}
            <button
              onClick={() => {
                if (clusterInfo?.center) {
                  const url = `https://maps.google.com/maps?q=${clusterInfo.center.lat()},${clusterInfo.center.lng()}&z=14`
                  window.open(url, '_blank')
                }
                onClose()
              }}
              className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-medium border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <Navigation className="w-5 h-5 mb-1" />
              <span className="text-xs">Navigate</span>
            </button>
          </div>

          {/* Sample Farms Preview */}
          <div className="mb-4">
            <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Sample Farms in Cluster</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {farms.slice(0, 5).map((farm, index) => (
                <div key={farm.id || index} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50 hover:border-brand-primary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-neutral-900 dark:text-white truncate">
                      {farm.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {farm.location.address}, {farm.location.city}
                    </div>
                  </div>
                  {userLocation && (
                    <div className="text-xs text-brand-primary font-medium ml-2 bg-brand-primary/10 px-2 py-0.5 rounded-full">
                      {getDistanceFromUser(farm.location.lat, farm.location.lng)}
                    </div>
                  )}
                </div>
              ))}
              {farms.length > 5 && (
                <div className="text-center text-xs text-neutral-500 dark:text-neutral-400 py-2">
                  +{farms.length - 5} more farms
                </div>
              )}
            </div>
          </div>

          {/* Cluster Statistics */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700/50">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide font-medium">Cluster Information</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">Total Farms:</span>
                <span className="ml-2 font-semibold text-neutral-900 dark:text-white">{farms.length}</span>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">Area Radius:</span>
                <span className="ml-2 font-semibold text-neutral-900 dark:text-white">~{Math.round(clusterInfo?.radius || 0)}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}
