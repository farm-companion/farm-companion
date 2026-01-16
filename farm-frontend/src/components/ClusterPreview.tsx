'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, ZoomIn, List, Navigation } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { calculateDistance, formatDistance } from '@/lib/geo-utils'

interface ClusterPreviewProps {
  cluster: {
    position: google.maps.LatLng
    markers: google.maps.Marker[]
    count: number
  } | null
  isVisible: boolean
  onClose: () => void
  onZoomToCluster: (cluster: any) => void
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
          // Extract farm data attached to marker
          const farmData = (marker as any).farmData as FarmShop
          return farmData
        })
        .filter((farm): farm is FarmShop => farm !== undefined && farm !== null)

      setFarms(farmData)
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
      radius: Math.sqrt(cluster.count) * 50 // Approximate radius based on count
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

  const clusterInfo = getClusterInfo()
  const distanceFromUser = userLocation ? getDistanceFromUser(userLocation.latitude, userLocation.longitude) : null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Cluster Preview Sheet */}
      <div
        ref={containerRef}
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isExpanded ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '70vh',
          minHeight: '250px'
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Cluster Header */}
        <div className="px-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-serum rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {cluster.count}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {cluster.count} Farms
                  </h3>
                  {distanceFromUser && (
                    <p className="text-sm text-gray-600">
                      {distanceFromUser} from you
                    </p>
                  )}
                </div>
              </div>
              
              {/* Cluster Area Info */}
              <div className="text-sm text-gray-600">
                <MapPin className="w-4 h-4 inline mr-1" />
                Cluster area • ~{Math.round(clusterInfo?.radius || 0)}m radius
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Zoom to Cluster */}
            <button
              onClick={() => {
                onZoomToCluster(cluster)
                onClose()
              }}
              className="flex flex-col items-center p-3 bg-serum text-black rounded-xl font-medium hover:bg-serum/90 transition-colors"
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
              className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
              className="flex flex-col items-center p-3 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors"
            >
              <Navigation className="w-5 h-5 mb-1" />
              <span className="text-xs">Navigate</span>
            </button>
          </div>

          {/* Sample Farms Preview */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Sample Farms in Cluster</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {farms.slice(0, 5).map((farm, index) => (
                <div key={farm.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {farm.name}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {farm.location.address}, {farm.location.city}
                    </div>
                  </div>
                  {userLocation && (
                    <div className="text-xs text-gray-500 ml-2">
                      {getDistanceFromUser(farm.location.lat, farm.location.lng)}
                    </div>
                  )}
                </div>
              ))}
              {farms.length > 5 && (
                <div className="text-center text-xs text-gray-500 py-2">
                  +{farms.length - 5} more farms
                </div>
              )}
            </div>
          </div>

          {/* Cluster Statistics */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-2">Cluster Information</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Farms:</span>
                <span className="ml-2 font-medium">{cluster.count}</span>
              </div>
              <div>
                <span className="text-gray-500">Area Radius:</span>
                <span className="ml-2 font-medium">~{Math.round(clusterInfo?.radius || 0)}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}
