'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { 
  MapPin, 
  Phone, 
  Globe, 
  Navigation, 
  X, 
  Settings, 
  Search, 
  Mail, 
  Heart, 
  Clock, 
  Star, 
  Users, 
  TrendingUp, 
  Filter, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  Info 
} from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import TransitionIndicator from './TransitionIndicator'
import ResponsiveInfoWindow from './ResponsiveInfoWindow'

// Custom hook for mobile detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

interface GoogleMapComponentProps {
  farms: FarmShop[] | null
  filteredFarms: FarmShop[] | null
  userLoc: { lat: number; lng: number } | null
  setUserLoc: (loc: { lat: number; lng: number } | null) => void
  bounds: { west: number; south: number; east: number; north: number } | null
  setBounds: (bounds: { west: number; south: number; east: number; north: number } | null) => void
  selectedFarm: FarmShop | null
  setSelectedFarm: (farm: FarmShop | null) => void
  loadFarmData: () => void
  isLoading: boolean
  error: string | null
  retryCount: number
  isRetrying: boolean
  dataQuality: { total: number; valid: number; invalid: number } | null
}

// UK center coordinates
const UK_CENTER = { lat: 54.5, lng: -2.5 }
const DEFAULT_ZOOM = 6

// Premium smooth transition utility functions
const smoothTransition = {
  // Premium easing functions for fluid animations
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutBack: (t: number) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  
  // Premium smooth pan and zoom with anti-flicker measures
  panAndZoomTo: (map: google.maps.Map, target: google.maps.LatLngLiteral, targetZoom: number, duration: number = 1200) => {
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom() || 6
    
    if (!currentCenter) return
    
    const startCenter = { lat: currentCenter.lat(), lng: currentCenter.lng() }
    const startTime = performance.now()
    let animationId: number | null = null
    
    // Disable map interactions during transition to prevent conflicts
    map.setOptions({
      gestureHandling: 'none',
      zoomControl: false,
      scrollwheel: false,
      disableDoubleClickZoom: true
    })
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use premium easing for ultra-smooth motion
      const easedProgress = smoothTransition.easeOutBack(progress)
      
      // Interpolate position with high precision
      const lat = startCenter.lat + (target.lat - startCenter.lat) * easedProgress
      const lng = startCenter.lng + (target.lng - startCenter.lng) * easedProgress
      
      // Interpolate zoom with smooth curve
      const zoom = currentZoom + (targetZoom - currentZoom) * easedProgress
      
      // Batch updates to prevent flickering
      map.setCenter({ lat, lng })
      map.setZoom(zoom)
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      } else {
        // Restore map interactions after transition
        map.setOptions({
          gestureHandling: 'cooperative',
          zoomControl: true,
          scrollwheel: true,
          disableDoubleClickZoom: false
        })
      }
    }
    
    animationId = requestAnimationFrame(animate)
    
    // Return cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
        map.setOptions({
          gestureHandling: 'cooperative',
          zoomControl: true,
          scrollwheel: true,
          disableDoubleClickZoom: false
        })
      }
    }
  },
  
  // Premium smooth zoom with enhanced easing
  smoothZoom: (map: google.maps.Map, targetZoom: number, duration: number = 800) => {
    const currentZoom = map.getZoom() || 6
    const startTime = performance.now()
    let animationId: number | null = null
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easedProgress = smoothTransition.easeInOutCubic(progress)
      const zoom = currentZoom + (targetZoom - currentZoom) * easedProgress
      
      map.setZoom(zoom)
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      }
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  },
  
  // Premium fit bounds with smooth animation
  smoothFitBounds: (map: google.maps.Map, bounds: google.maps.LatLngBounds, duration: number = 1000) => {
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom() || 6
    
    if (!currentCenter) return
    
    const startTime = performance.now()
    let animationId: number | null = null
    
    // Calculate target center and zoom for bounds
    const targetCenter = bounds.getCenter()
    const targetZoom = Math.min(
      map.getZoom() || 6,
      14 // Use a reasonable zoom level for bounds
    )
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easedProgress = smoothTransition.easeOutExpo(progress)
      
      // Smoothly interpolate to target
      const lat = currentCenter.lat() + (targetCenter.lat() - currentCenter.lat()) * easedProgress
      const lng = currentCenter.lng() + (targetCenter.lng() - currentCenter.lng()) * easedProgress
      const zoom = currentZoom + (targetZoom - currentZoom) * easedProgress
      
      map.setCenter({ lat, lng })
      map.setZoom(zoom)
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      }
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }
}

// Minimal map controls component
function MapControls({ 
  farms, 
  filteredFarms, 
  onRetry, 
  isLoading, 
  error, 
  dataQuality,
  onToggleFullscreen,
  isFullscreen,
  showControls,
  setShowControls,
  onZoomToUser,
  onResetToUK
}: {
  farms: FarmShop[] | null
  filteredFarms: FarmShop[] | null
  onRetry: () => void
  isLoading: boolean
  error: string | null
  dataQuality: { total: number; valid: number; invalid: number } | null
  onToggleFullscreen: () => void
  isFullscreen: boolean
  showControls: boolean
  setShowControls: (show: boolean) => void
  onZoomToUser: () => void
  onResetToUK: () => void
}) {
  return (
    <div className="absolute top-20 left-6 z-20 space-y-3">
      {/* Toggle button */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="p-3 bg-background-surface/95 backdrop-blur-md rounded-xl shadow-premium border border-border-default/30 hover:bg-background-canvas transition-all duration-200"
      >
        <Settings className="w-5 h-5 text-text-heading" />
      </button>

      {/* Collapsible controls */}
      {showControls && (
        <div className="bg-background-surface/95 backdrop-blur-md rounded-2xl shadow-premium border border-border-default/30 p-4 max-w-xs">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-serum" />
              <span className="font-semibold text-text-heading">Map Controls</span>
            </div>
            <button
              onClick={onToggleFullscreen}
              className="p-1 rounded-lg bg-background-canvas hover:bg-background-surface transition-colors duration-200"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-2 bg-background-canvas rounded-lg">
              <div className="text-lg font-bold text-text-heading">
                {filteredFarms?.length || 0}
              </div>
              <div className="text-xs text-text-muted">Showing</div>
            </div>
            <div className="text-center p-2 bg-background-canvas rounded-lg">
              <div className="text-lg font-bold text-serum">
                {farms?.length || 0}
              </div>
              <div className="text-xs text-text-muted">Total</div>
            </div>
          </div>

          {/* Loading/Error States */}
          {isLoading && (
            <div className="flex items-center gap-2 p-2 bg-serum/10 rounded-lg mb-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-serum border-t-transparent"></div>
              <span className="text-sm text-text-heading">Loading...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-3">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">{error}</p>
              <button
                onClick={onRetry}
                className="w-full bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Smooth Transition Controls */}
          <div className="space-y-2 mb-4">
            <div className="text-xs font-medium text-text-muted mb-2">Smooth Navigation</div>
            
            {/* Zoom to User Location */}
            <button
              onClick={onZoomToUser}
              className="w-full flex items-center gap-2 p-2 bg-background-canvas hover:bg-background-surface rounded-lg transition-all duration-200 group"
            >
              <div className="w-6 h-6 rounded-full bg-solar/20 flex items-center justify-center group-hover:bg-solar/30 transition-colors duration-200">
                <MapPin className="w-3 h-3 text-solar" />
              </div>
              <span className="text-sm text-text-heading">My Location</span>
            </button>
            
            {/* Reset to UK Overview */}
            <button
              onClick={onResetToUK}
              className="w-full flex items-center gap-2 p-2 bg-background-canvas hover:bg-background-surface rounded-lg transition-all duration-200 group"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-200">
                <Globe className="w-3 h-3 text-blue-500" />
              </div>
              <span className="text-sm text-text-heading">UK Overview</span>
            </button>
          </div>

          {/* Data quality indicator */}
          {dataQuality && dataQuality.invalid > 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-xs text-amber-700 dark:text-amber-300">
                {dataQuality.invalid} farms need location data
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Main map component with smart marker limiting
function FarmMap({ 
  farms, 
  filteredFarms, 
  selectedFarm, 
  setSelectedFarm, 
  zoomToUserLocation,
  userLoc,
  isMobile,
  setMarkerPosition,
  markerPosition
}: {
  farms: FarmShop[] | null
  filteredFarms: FarmShop[] | null
  selectedFarm: FarmShop | null
  setSelectedFarm: (farm: FarmShop | null) => void
  zoomToUserLocation: () => void
  userLoc: { lat: number; lng: number } | null
  isMobile: boolean
  setMarkerPosition: (position: { x: number; y: number } | null) => void
  markerPosition: { x: number; y: number } | null
}) {
  const map = useMap()
  const [currentZoom, setCurrentZoom] = useState(6)
  const [nearbyFarms, setNearbyFarms] = useState<FarmShop[]>([])
  
  // Calculate bounds for filtered farms
  const bounds = useMemo(() => {
    if (!filteredFarms || filteredFarms.length === 0) return null
    
    const validFarms = filteredFarms.filter((farm: FarmShop) => 
      farm.location?.lat && farm.location?.lng &&
      typeof farm.location.lat === 'number' && typeof farm.location.lng === 'number'
    )
    
    if (validFarms.length === 0) return null
    
    const lats = validFarms.map((f: FarmShop) => f.location!.lat)
    const lngs = validFarms.map((f: FarmShop) => f.location!.lng)
    
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }
  }, [filteredFarms])

  // Find nearby farms when user location changes
  useEffect(() => {
    if (userLoc && farms) {
      const nearby = farms.filter((farm: FarmShop) => {
        if (!farm.location?.lat || !farm.location?.lng) return false
        
        const distance = calculateDistance(
          userLoc.lat, userLoc.lng,
          farm.location.lat, farm.location.lng
        )
        return distance <= 50 // 50km radius
      })
      setNearbyFarms(nearby)
    }
  }, [userLoc, farms])

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Smart marker limiting based on zoom level
  const visibleFarms = useMemo(() => {
    if (!filteredFarms) return []
    
    const validFarms = filteredFarms.filter((farm: FarmShop) => 
      farm.location?.lat && farm.location?.lng &&
      typeof farm.location.lat === 'number' && typeof farm.location.lng === 'number'
    )
    
    // Limit markers based on zoom level to prevent clutter
    if (currentZoom <= 7) {
      // Show only a sample of farms when zoomed out
      return validFarms.slice(0, Math.min(50, validFarms.length))
    } else if (currentZoom <= 9) {
      // Show more farms at medium zoom
      return validFarms.slice(0, Math.min(200, validFarms.length))
    } else {
      // Show all farms when zoomed in
      return validFarms
    }
  }, [filteredFarms, currentZoom])

  // Fit map to bounds when they change with smooth animation
  React.useEffect(() => {
    if (bounds && map) {
      const googleBounds = new google.maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      )
      
      // Premium smooth fit bounds animation with anti-flicker measures
      const cleanup = smoothTransition.smoothFitBounds(map, googleBounds, 1200)
      
      // Cleanup after animation completes
      if (cleanup) {
        setTimeout(() => {
          cleanup()
        }, 1200)
      }
    }
  }, [bounds, map])

  // Update zoom level when map changes
  React.useEffect(() => {
    if (map) {
      const listener = map.addListener('zoom_changed', () => {
        setCurrentZoom(map.getZoom() || 6)
      })
      return () => google.maps.event.removeListener(listener)
    }
  }, [map])

  // Handle marker click with premium smooth zoom animation
  const handleMarkerClick = useCallback((farm: FarmShop, event?: any) => {
    setSelectedFarm(farm)
    
    // Calculate marker screen position for precise pointer positioning
    if (map && farm.location?.lat && farm.location?.lng) {
      const targetPosition = { lat: farm.location.lat, lng: farm.location.lng }
      
      // Convert lat/lng to pixel coordinates
      const projection = map.getProjection()
      if (projection) {
        const point = projection.fromLatLngToPoint(new google.maps.LatLng(targetPosition.lat, targetPosition.lng))
        if (point) {
          const scale = Math.pow(2, map.getZoom() || 6)
          const worldPoint = new google.maps.Point(point.x * scale, point.y * scale)
          
          // Get map bounds and calculate screen position
          const bounds = map.getBounds()
          if (bounds) {
            const ne = bounds.getNorthEast()
            const sw = bounds.getSouthWest()
            const nePoint = projection.fromLatLngToPoint(ne)
            const swPoint = projection.fromLatLngToPoint(sw)
            if (nePoint && swPoint) {
              const neWorldPoint = new google.maps.Point(nePoint.x * scale, nePoint.y * scale)
              const swWorldPoint = new google.maps.Point(swPoint.x * scale, swPoint.y * scale)
              
              // Calculate screen coordinates
              const mapDiv = map.getDiv()
              const mapRect = mapDiv.getBoundingClientRect()
              const x = ((worldPoint.x - swWorldPoint.x) / (neWorldPoint.x - swWorldPoint.x)) * mapRect.width
              const y = ((worldPoint.y - swWorldPoint.y) / (neWorldPoint.y - swWorldPoint.y)) * mapRect.height
              
              setMarkerPosition({ x, y })
            }
          }
        }
      }
      
      // Premium smooth zoom to marker location with anti-flicker measures
      const cleanup = smoothTransition.panAndZoomTo(map, targetPosition, 14, 1200)
      
      // Store cleanup function for potential cancellation
      if (cleanup) {
        // Store cleanup in a ref or state if needed for cancellation
        setTimeout(() => {
          cleanup()
        }, 1200)
      }
    }
  }, [setSelectedFarm, map])

  // Handle info window close
  const handleInfoWindowClose = useCallback(() => {
    setSelectedFarm(null)
  }, [setSelectedFarm])

  if (!farms) return null

  return (
    <>
      {/* Render distance-aware markers for visible farms */}
      {visibleFarms.map((farm: FarmShop, index: number) => {
        if (!farm.location?.lat || !farm.location?.lng) return null
        
        // Calculate distance from user
        const distance = userLoc ? calculateDistance(
          userLoc.lat, userLoc.lng,
          farm.location.lat, farm.location.lng
        ) : null
        
        // Get marker color based on distance
        const getMarkerColor = (dist: number | null) => {
          if (!dist) return '#15803D' // Default green
          if (dist <= 5) return '#22C55E' // Very close - bright green
          if (dist <= 15) return '#EAB308' // Close - yellow
          if (dist <= 50) return '#F97316' // Medium - orange
          return '#EF4444' // Far - red
        }
        
        const markerColor = getMarkerColor(distance)
        const markerSize = distance && distance <= 5 ? 'w-8 h-8' : 'w-7 h-7'
        
        return (
          <AdvancedMarker
            key={`${farm.id}-${farm.location.lat}-${farm.location.lng}-${index}`}
            position={{ 
              lat: farm.location.lat, 
              lng: farm.location.lng 
            }}
            onClick={() => handleMarkerClick(farm)}
            title={`${farm.name}${distance ? ` (${distance.toFixed(1)}km away)` : ''}`}
          >
            <div className={`${markerSize} relative transform transition-all duration-200 hover:scale-110 hover:rotate-3 cursor-pointer`}>
              <svg width={distance && distance <= 5 ? "32" : "28"} height={distance && distance <= 5 ? "32" : "28"} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="13" fill="rgba(0,0,0,0.2)" transform="translate(1,1)"/>
                <circle cx="14" cy="14" r="13" fill={markerColor} stroke="white" strokeWidth="2"/>
                <path d="M10 12h8v6h-8z" fill="white"/>
                <path d="M9 12l5-4 5 4" fill="white"/>
                <rect x="12" y="14" width="4" height="2" fill={markerColor}/>
                <path d="M18 10c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5c0 1.5 2.5 3.5 2.5 3.5s2.5-2 2.5-3.5z" fill="#22C55E"/>
                <circle cx="14" cy="14" r="2" fill="white"/>
              </svg>
              
              {/* Distance badge for very close farms */}
              {distance && distance <= 5 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {distance < 1 ? Math.round(distance * 1000) : distance.toFixed(1)}
                </div>
              )}
            </div>
          </AdvancedMarker>
        )
      })}

      {/* User location marker */}
      {userLoc && (
        <AdvancedMarker
          position={userLoc}
          title="Your Location"
        >
          <div className="w-8 h-8 relative transform transition-all duration-300 hover:scale-110 animate-pulse">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" fill="rgba(0,0,0,0.2)" transform="translate(1,1)"/>
              <circle cx="16" cy="16" r="15" fill="#D4FF4F" stroke="white" strokeWidth="2"/>
              <circle cx="16" cy="16" r="8" fill="#1E1F23"/>
              <circle cx="16" cy="16" r="3" fill="#D4FF4F"/>
              <circle cx="16" cy="16" r="12" fill="none" stroke="#D4FF4F" strokeWidth="1" opacity="0.6"/>
              <circle cx="16" cy="16" r="10" fill="none" stroke="#D4FF4F" strokeWidth="1" opacity="0.4"/>
            </svg>
          </div>
        </AdvancedMarker>
      )}

      {/* Farm Markers Legend */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-background-surface/95 backdrop-blur-md rounded-xl shadow-premium border border-border-default/30 p-3 overflow-hidden">
          <div className="flex items-center gap-3">
            {/* Farm marker icon */}
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="13" fill="#15803D" stroke="white" strokeWidth="2"/>
                <path d="M10 12h8v6h-8z" fill="white"/>
                <path d="M9 12l5-4 5 4" fill="white"/>
                <rect x="12" y="14" width="4" height="2" fill="#15803D"/>
                <path d="M18 10c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5c0 1.5 2.5 3.5 2.5 3.5s2.5-2 2.5-3.5z" fill="#22C55E"/>
                <circle cx="14" cy="14" r="2" fill="white"/>
              </svg>
            </div>
            
            {/* Legend text */}
            <div>
              <div className="text-sm font-medium text-text-heading">
                Farm Shops
              </div>
              <div className="text-xs text-text-muted">
                {visibleFarms.length} visible
                {currentZoom <= 9 && filteredFarms && filteredFarms.length > visibleFarms.length && (
                  <span className="block text-serum">• Zoom in for more</span>
                )}
              </div>
            </div>
          </div>
          
          {/* User location indicator */}
          {userLoc && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-default/30">
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="15" fill="#D4FF4F" stroke="white" strokeWidth="2"/>
                  <circle cx="16" cy="16" r="8" fill="#1E1F23"/>
                  <circle cx="16" cy="16" r="3" fill="#D4FF4F"/>
                </svg>
              </div>
              <div className="text-xs text-text-muted">
                Your location
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Nearby farms indicator */}
      {userLoc && nearbyFarms.length > 0 && (
        <div className="absolute bottom-6 right-6 z-10">
          <div className="bg-background-surface/95 backdrop-blur-md rounded-xl shadow-premium border border-border-default/30 px-4 py-2 overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-solar rounded-full"></div>
              <span className="text-sm text-text-heading">
                {nearbyFarms.length} farm{nearbyFarms.length !== 1 ? 's' : ''} nearby
              </span>
            </div>
            <button
              onClick={zoomToUserLocation}
              className="text-xs text-serum hover:text-serum/80 transition-colors duration-200 mt-1"
            >
              Zoom to my location
            </button>
          </div>
        </div>
      )}

      {/* Desktop: Traditional InfoWindow - only show on desktop */}
      {selectedFarm && selectedFarm.location?.lat && selectedFarm.location?.lng && !isMobile && (
        <InfoWindow
          position={{ 
            lat: selectedFarm.location.lat, 
            lng: selectedFarm.location.lng 
          }}
          onCloseClick={handleInfoWindowClose}
          pixelOffset={[0, -40]}
          maxWidth={320}
        >
          <div className="p-0 max-w-sm overflow-hidden rounded-xl animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-serum to-serum/80 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-black text-lg mb-1">
                    {selectedFarm.name}
                  </h3>
                  <div className="flex items-center gap-2 text-black/80">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {selectedFarm.location.county || 'UK'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleInfoWindowClose}
                  className="p-1 rounded-full bg-black/10 hover:bg-black/20 transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 bg-background-surface">
              {/* Distance from user */}
              {userLoc && (
                <div className="mb-3 p-2 bg-solar/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-solar rounded-full"></div>
                    <span className="text-sm text-text-heading">
                      {calculateDistance(
                        userLoc.lat, userLoc.lng,
                        selectedFarm.location.lat, selectedFarm.location.lng
                      ).toFixed(1)} km away
                    </span>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-serum/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-serum" />
                  </div>
                  <div>
                    <p className="text-sm text-text-heading font-medium">
                      {selectedFarm.location.address}
                    </p>
                    {selectedFarm.location.county && (
                      <p className="text-sm text-text-muted">
                        {selectedFarm.location.county}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              {(selectedFarm.contact?.phone || selectedFarm.contact?.website) && (
                <div className="mb-4 space-y-2">
                  {selectedFarm.contact?.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-serum/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-serum" />
                      </div>
                      <a 
                        href={`tel:${selectedFarm.contact.phone}`}
                        className="text-sm text-text-heading hover:text-serum transition-colors duration-200"
                      >
                        {selectedFarm.contact.phone}
                      </a>
                    </div>
                  )}
                  
                  {selectedFarm.contact?.website && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-serum/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-serum" />
                      </div>
                      <a 
                        href={selectedFarm.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-text-heading hover:text-serum transition-colors duration-200"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <a
                  href={`/shop/${selectedFarm.slug}`}
                  className="flex-1 bg-serum text-black px-4 py-3 rounded-xl font-semibold hover:bg-serum/90 hover:text-white transition-all duration-200 text-center text-sm"
                >
                  View Details
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFarm.location.lat},${selectedFarm.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-background-canvas text-text-heading px-4 py-3 rounded-xl font-medium hover:bg-background-surface transition-all duration-200 text-sm border border-border-default/30"
                >
                  <Navigation className="w-4 h-4" />
                  Directions
                </a>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}

      {/* Mobile: Responsive bottom sheet */}
      {selectedFarm && selectedFarm.location?.lat && selectedFarm.location?.lng && (
        <ResponsiveInfoWindow
          selectedFarm={selectedFarm}
          userLoc={userLoc}
          onClose={handleInfoWindowClose}
          calculateDistance={calculateDistance}
          markerPosition={markerPosition}
        />
      )}
    </>
  )
}

export default function GoogleMapComponent({
  farms,
  filteredFarms,
  userLoc,
  setUserLoc,
  bounds: _bounds,
  setBounds: _setBounds,
  selectedFarm,
  setSelectedFarm,
  loadFarmData,
  isLoading,
  error,
  retryCount,
  isRetrying,
  dataQuality
}: GoogleMapComponentProps) {
  const isMobile = useIsMobile()
  const [mapCenter, setMapCenter] = useState(UK_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null)


  // Get user location on mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLoc(newLoc)
          setMapCenter(newLoc)
          setMapZoom(10)
        },
        (error) => {
          console.log('Geolocation error:', error)
          // Keep default UK center
        }
      )
    }
  }, [setUserLoc])

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Zoom to user location with smooth animation
  const zoomToUserLocation = useCallback(() => {
    if (userLoc) {
      setIsTransitioning(true)
      
      // Actually navigate to user location
      setMapCenter(userLoc)
      setMapZoom(17) // Zoom to street view
      
      // Reset transition state after animation completes
      setTimeout(() => setIsTransitioning(false), 1200)
    } else {
      // If no user location, try to get it first
      if (navigator.geolocation) {
        setIsTransitioning(true)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setUserLoc(newLoc)
            setMapCenter(newLoc)
            setMapZoom(17)
            setTimeout(() => setIsTransitioning(false), 1200)
          },
          (error) => {
            console.log('Geolocation error:', error)
            setIsTransitioning(false)
          }
        )
      }
    }
  }, [userLoc, setUserLoc])

  // Reset to UK overview with smooth animation
  const resetToUKOverview = useCallback(() => {
    setIsTransitioning(true)
    
    // Actually navigate to UK overview
    setMapCenter(UK_CENTER)
    setMapZoom(DEFAULT_ZOOM)
    
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 1500)
  }, [])

  return (
    <div className={`w-full h-full relative transition-all duration-500 ease-out ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          center={mapCenter}
          zoom={mapZoom}
          mapId="f907b7cb594ed2caa752543d"
          className="w-full h-full"
          onCenterChanged={(e) => {
            const center = e.detail.center
            setMapCenter({ lat: center.lat, lng: center.lng })
          }}
          onZoomChanged={(e) => {
            setMapZoom(e.detail.zoom)
          }}

        >
          <FarmMap
            farms={farms}
            filteredFarms={filteredFarms}
            selectedFarm={selectedFarm}
            setSelectedFarm={setSelectedFarm}
            zoomToUserLocation={zoomToUserLocation}
            userLoc={userLoc}
            isMobile={isMobile}
            setMarkerPosition={setMarkerPosition}
            markerPosition={markerPosition}
          />
        </Map>
      </APIProvider>

      {/* Map Controls */}
      <MapControls
        farms={farms}
        filteredFarms={filteredFarms}
        onRetry={loadFarmData}
        isLoading={isLoading}
        error={error}
        dataQuality={dataQuality}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        showControls={showControls}
        setShowControls={setShowControls}
        onZoomToUser={zoomToUserLocation}
        onResetToUK={resetToUKOverview}
      />



      {/* Reusable transition indicator */}
      <TransitionIndicator 
        isVisible={isTransitioning} 
        duration={1200}
        onComplete={() => setIsTransitioning(false)}
      />

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="absolute top-6 right-6 z-30">
          <button
            onClick={handleToggleFullscreen}
            className="p-3 bg-background-surface/95 backdrop-blur-md rounded-xl shadow-premium border border-border-default/30 hover:bg-background-canvas transition-all duration-200"
          >
            <X className="w-5 h-5 text-text-heading" />
          </button>
        </div>
      )}
    </div>
  )
}
