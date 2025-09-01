'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Navigation, Bell, Clock, TrendingUp, Zap, Target, Compass } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

interface LiveLocationTrackerProps {
  userLocation: { latitude: number; longitude: number } | null
  farms: FarmShop[]
  onLocationUpdate: (location: { latitude: number; longitude: number }) => void
  onFarmNearby: (farm: FarmShop, distance: number) => void
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  speed?: number
  heading?: number
}

interface NearbyFarm {
  farm: FarmShop
  distance: number
  eta: number // Estimated time to arrival in minutes
  isNewlyDiscovered: boolean
}

export default function LiveLocationTracker({
  userLocation,
  farms,
  onLocationUpdate,
  onFarmNearby
}: LiveLocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([])
  const [nearbyFarms, setNearbyFarms] = useState<NearbyFarm[]>([])
  const [predictiveLocation, setPredictiveLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])
  const [trackingStats, setTrackingStats] = useState({
    totalDistance: 0,
    averageSpeed: 0,
    farmsDiscovered: 0,
    trackingDuration: 0
  })

  const locationWatchId = useRef<number | null>(null)
  const trackingStartTime = useRef<number | 0>(0)
  const lastLocation = useRef<LocationData | null>(null)
  const nearbyFarmsCache = useRef<Set<string>>(new Set())

  // Start live location tracking
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      return
    }

    try {
      // Request high-accuracy location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined
      }

      // Initialize tracking
      setLocationHistory([locationData])
      lastLocation.current = locationData
      trackingStartTime.current = Date.now()
      setIsTracking(true)
      onLocationUpdate(locationData)

      // Start continuous tracking
      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => handleLocationUpdate(position),
        (error) => console.error('Location tracking error:', error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000 // Update every second
        }
      )

      // Add notification
      addNotification('🚀 Live location tracking started!')
    } catch (error) {
      console.error('Failed to start tracking:', error)
      addNotification('❌ Failed to start location tracking')
    }
  }, [onLocationUpdate])

  // Stop live location tracking
  const stopTracking = useCallback(() => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current)
      locationWatchId.current = null
    }
    setIsTracking(false)
    addNotification('⏹️ Location tracking stopped')
  }, [])

  // Handle location updates
  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now(),
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    }

    // Update location
    setLocationHistory(prev => [...prev.slice(-50), locationData]) // Keep last 50 locations
    lastLocation.current = locationData
    onLocationUpdate(locationData)

    // Calculate movement and update stats
    if (lastLocation.current) {
      const distance = calculateDistance(
        lastLocation.current.latitude,
        lastLocation.current.longitude,
        locationData.latitude,
        locationData.longitude
      )
      
      setTrackingStats(prev => ({
        ...prev,
        totalDistance: prev.totalDistance + distance,
        trackingDuration: Date.now() - trackingStartTime.current
      }))
    }

    // Check for nearby farms
    checkNearbyFarms(locationData)

    // Update predictive location
    updatePredictiveLocation(locationData)
  }, [onLocationUpdate])

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Check for farms near current location
  const checkNearbyFarms = useCallback((location: LocationData) => {
    const nearby: NearbyFarm[] = []
    
    farms.forEach(farm => {
      if (farm.location) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          farm.location.lat,
          farm.location.lng
        )

        // Farm is within 2km
        if (distance <= 2) {
          const eta = calculateETA(distance, location.speed)
          const isNewlyDiscovered = !nearbyFarmsCache.current.has(farm.id)
          
          nearby.push({
            farm,
            distance,
            eta,
            isNewlyDiscovered
          })

          // Notify about newly discovered farms
          if (isNewlyDiscovered) {
            nearbyFarmsCache.current.add(farm.id)
            onFarmNearby(farm, distance)
            addNotification(`🌾 Discovered nearby farm: ${farm.name} (${distance.toFixed(1)}km away)`)
          }
        }
      }
    })

    // Sort by distance and update state
    nearby.sort((a, b) => a.distance - b.distance)
    setNearbyFarms(nearby.slice(0, 10)) // Show top 10 nearest
  }, [farms, onFarmNearby])

  // Calculate estimated time to arrival
  const calculateETA = (distance: number, speed?: number): number => {
    if (!speed || speed === 0) return Math.round(distance * 20) // Assume 3km/h walking speed
    return Math.round((distance / speed) * 60) // Convert to minutes
  }

  // Update predictive location based on movement
  const updatePredictiveLocation = useCallback((location: LocationData) => {
    if (location.speed && location.heading && locationHistory.length >= 2) {
      // Predict location 5 minutes ahead based on current speed and heading
      const timeAhead = 5 * 60 * 1000 // 5 minutes in milliseconds
      const distanceAhead = (location.speed * timeAhead) / 1000 // Convert to km
      
      const latOffset = (distanceAhead * Math.cos(location.heading * Math.PI / 180)) / 111.32
      const lonOffset = (distanceAhead * Math.sin(location.heading * Math.PI / 180)) / (111.32 * Math.cos(location.latitude * Math.PI / 180))
      
      setPredictiveLocation({
        latitude: location.latitude + latOffset,
        longitude: location.longitude + lonOffset
      })
    }
  }, [locationHistory])

  // Add notification
  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev.slice(-4), message]) // Keep last 4 notifications
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message))
    }, 5000) // Auto-remove after 5 seconds
  }, [])

  // Get movement direction emoji
  const getMovementDirection = (heading?: number): string => {
    if (!heading) return '📍'
    if (heading >= 315 || heading < 45) return '⬆️' // North
    if (heading >= 45 && heading < 135) return '➡️' // East
    if (heading >= 135 && heading < 225) return '⬇️' // South
    return '⬅️' // West
  }

  // Get speed description
  const getSpeedDescription = (speed?: number): string => {
    if (!speed) return 'Stationary'
    if (speed < 0.5) return 'Walking'
    if (speed < 2) return 'Slow movement'
    if (speed < 5) return 'Moving'
    if (speed < 10) return 'Fast movement'
    return 'Very fast'
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current)
      }
    }
  }, [])

  return (
    <div className="live-location-tracker">
      {/* Main Tracking Controls */}
      <div className="live-location-panel">
        {/* Header */}
        <div className="live-location-header">
          <div className="live-location-header-content">
            <div className="live-location-title">
              <Target className="w-5 h-5" />
              <h3>Live Location</h3>
            </div>
            <div className="tracking-status">
              {isTracking && (
                <div className="tracking-dot" />
              )}
              <button
                onClick={isTracking ? stopTracking : startTracking}
                className={`tracking-control-btn ${isTracking ? 'stop' : 'start'}`}
              >
                {isTracking ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>
        </div>

        {/* Location Info */}
        {userLocation && (
          <div className="live-location-content">
            {/* Current Location */}
            <div className="location-info-card">
              <div className="location-info-header">
                <MapPin className="w-5 h-5" />
                <div className="location-info-title">Current Location</div>
              </div>
              <div className="location-coordinates">
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </div>
            </div>

            {/* Movement Info */}
            {lastLocation.current && (
              <div className="movement-info-grid">
                <div className="movement-direction-card">
                  <div className="movement-direction-emoji">
                    {getMovementDirection(lastLocation.current.heading)}
                  </div>
                  <div className="movement-description">
                    {getSpeedDescription(lastLocation.current.speed)}
                  </div>
                </div>
                <div className="distance-tracking-card">
                  <div className="distance-value">
                    {trackingStats.totalDistance.toFixed(1)}km
                  </div>
                  <div className="distance-label">Total Distance</div>
                </div>
              </div>
            )}

            {/* Predictive Location */}
            {predictiveLocation && (
              <div className="predictive-location-card">
                <div className="predictive-location-header">
                  <Compass className="w-4 h-4" />
                  <span className="predictive-location-title">Predictive Location</span>
                </div>
                <div className="predictive-location-coords">
                  In 5 minutes: {predictiveLocation.latitude.toFixed(6)}, {predictiveLocation.longitude.toFixed(6)}
                </div>
              </div>
            )}

            {/* Nearby Farms */}
            {nearbyFarms.length > 0 && (
              <div className="nearby-farms-section">
                <div className="nearby-farms-header">
                  <Bell className="w-4 h-4" />
                  <span className="nearby-farms-title">Nearby Farms</span>
                  <span className="nearby-farms-count">{nearbyFarms.length}</span>
                </div>
                <div className="farms-list-container">
                  {nearbyFarms.map(({ farm, distance, eta, isNewlyDiscovered }) => (
                    <div 
                      key={farm.id}
                      className={`farm-item ${isNewlyDiscovered ? 'newly-discovered' : ''}`}
                    >
                      <div className="farm-item-content">
                        <div className="farm-info">
                          <div className="farm-name">
                            {farm.name}
                          </div>
                          <div className="farm-distance">
                            {distance.toFixed(1)}km away
                          </div>
                        </div>
                        <div className="farm-meta">
                          {isNewlyDiscovered && (
                            <span className="new-discovery-badge">
                              New!
                            </span>
                          )}
                          <div className="farm-eta">
                            <div className="eta-value">
                              {eta} min
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="notifications-section">
            <div className="notifications-header">Live Updates</div>
            {notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                {notification}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
