'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Bell, Target } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { calculateDistance } from '@/shared/lib/geo'

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
  eta: number
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
  const [, setPredictiveLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])
  const [trackingStats, setTrackingStats] = useState({
    totalDistance: 0,
    averageSpeed: 0,
    farmsDiscovered: 0,
    trackingDuration: 0
  })
  const [showDetails, setShowDetails] = useState(false)

  const locationWatchId = useRef<number | null>(null)
  const trackingStartTime = useRef<number | 0>(0)
  const lastLocation = useRef<LocationData | null>(null)
  const nearbyFarmsCache = useRef<Set<string>>(new Set())

  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev.slice(-4), message])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message))
    }, 5000)
  }, [])

  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now(),
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    }
    setLocationHistory(prev => [...prev.slice(-50), locationData])
    lastLocation.current = locationData
    onLocationUpdate(locationData)
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
        averageSpeed: prev.totalDistance > 0 ? (prev.totalDistance + distance) / ((Date.now() - trackingStartTime.current) / 1000 / 60) : 0,
        trackingDuration: Date.now() - trackingStartTime.current
      }))
    }
    checkNearbyFarms(locationData)
    updatePredictiveLocation(locationData)
  }, [onLocationUpdate])

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      return
    }
    try {
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
      setLocationHistory([locationData])
      lastLocation.current = locationData
      trackingStartTime.current = Date.now()
      setIsTracking(true)
      onLocationUpdate(locationData)
      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => handleLocationUpdate(position),
        (error) => console.error('Location tracking error:', error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      )
      addNotification('🚀 Live location tracking started!')
    } catch (error) {
      console.error('Failed to start tracking:', error)
      addNotification('❌ Failed to start location tracking')
    }
  }, [onLocationUpdate, addNotification, handleLocationUpdate])

  const stopTracking = useCallback(() => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current)
      locationWatchId.current = null
    }
    setIsTracking(false)
    addNotification('⏹️ Location tracking stopped')
  }, [addNotification])

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
        if (distance <= 2) {
          const eta = calculateETA(distance, location.speed)
          const isNewlyDiscovered = !nearbyFarmsCache.current.has(farm.id)
          nearby.push({
            farm,
            distance,
            eta,
            isNewlyDiscovered
          })
          if (isNewlyDiscovered) {
            nearbyFarmsCache.current.add(farm.id)
            onFarmNearby(farm, distance)
            addNotification(`🌾 Discovered nearby farm: ${farm.name} (${distance.toFixed(1)}km away)`)
          }
        }
      }
    })
    nearby.sort((a, b) => a.distance - b.distance)
    setNearbyFarms(nearby.slice(0, 10))
  }, [farms, onFarmNearby, addNotification])

  const calculateETA = (distance: number, speed?: number): number => {
    if (!speed || speed === 0) return Math.round(distance * 20)
    return Math.round((distance / speed) * 60)
  }

  const updatePredictiveLocation = useCallback((location: LocationData) => {
    if (location.speed && location.heading && locationHistory.length >= 2) {
      const timeAhead = 5 * 60 * 1000
      const distanceAhead = (location.speed * timeAhead) / 1000
      const latOffset = (distanceAhead * Math.cos(location.heading * Math.PI / 180)) / 111.32
      const lonOffset = (distanceAhead * Math.sin(location.heading * Math.PI / 180)) / (111.32 * Math.cos(location.latitude * Math.PI / 180))
      setPredictiveLocation({
        latitude: location.latitude + latOffset,
        longitude: location.longitude + lonOffset
      })
    }
  }, [locationHistory])

  const getMovementDirection = (heading?: number): string => {
    if (!heading) return '📍'
    if (heading >= 315 || heading < 45) return '⬆️'
    if (heading >= 45 && heading < 135) return '➡️'
    if (heading >= 135 && heading < 225) return '⬇️'
    return '⬅️'
  }

  const getSpeedDescription = (speed?: number): string => {
    if (!speed) return 'Stationary'
    if (speed < 0.5) return 'Walking'
    if (speed < 2) return 'Slow movement'
    if (speed < 5) return 'Moving'
    if (speed < 10) return 'Fast movement'
    return 'Very fast'
  }

  useEffect(() => {
    return () => {
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current)
      }
    }
  }, [])

  return (
    <>
      {/* Main Floating Button */}
      <div className="live-location-button-container">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`live-location-button ${isTracking ? 'tracking' : ''} ${showDetails ? 'active' : ''}`}
          aria-label={isTracking ? 'Live location tracking active' : 'Start live location tracking'}
        >
          <Target className="w-5 h-5" />
          {isTracking && <div className="tracking-pulse" />}
        </button>
      </div>

      {/* Details Panel - Only shown when button is clicked */}
      {showDetails && (
        <div className="live-location-details">
          <div className="details-header">
            <h3 className="details-title">Live Location</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="close-button"
              aria-label="Close details"
            >
              ×
            </button>
          </div>

          <div className="details-content">
            {!isTracking ? (
              <div className="start-tracking-section">
                <p className="tracking-description">
                  Track your location to discover nearby farms and get real-time updates.
                </p>
                <button
                  onClick={startTracking}
                  className="start-tracking-btn"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Start Tracking
                </button>
              </div>
            ) : (
              <div className="tracking-info">
                {userLocation && (
                  <div className="location-card">
                    <div className="location-header">
                      <MapPin className="w-4 h-4" />
                      <span>Current Location</span>
                    </div>
                    <div className="coordinates">
                      {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                    </div>
                  </div>
                )}

                {lastLocation.current && (
                  <div className="movement-info">
                    <div className="movement-item">
                      <span className="movement-icon">
                        {getMovementDirection(lastLocation.current.heading)}
                      </span>
                      <span className="movement-text">
                        {getSpeedDescription(lastLocation.current.speed)}
                      </span>
                    </div>
                    <div className="movement-item">
                      <span className="movement-icon">📏</span>
                      <span className="movement-text">
                        {trackingStats.totalDistance.toFixed(1)}km
                      </span>
                    </div>
                  </div>
                )}

                {nearbyFarms.length > 0 && (
                  <div className="nearby-farms">
                    <div className="nearby-header">
                      <Bell className="w-4 h-4" />
                      <span>Nearby Farms ({nearbyFarms.length})</span>
                    </div>
                    <div className="farms-list">
                      {nearbyFarms.slice(0, 3).map(({ farm, distance, isNewlyDiscovered }) => (
                        <div key={farm.id} className={`farm-item ${isNewlyDiscovered ? 'new' : ''}`}>
                          <div className="farm-info">
                            <div className="farm-name">{farm.name}</div>
                            <div className="farm-distance">{distance.toFixed(1)}km away</div>
                          </div>
                          {isNewlyDiscovered && <span className="new-badge">New!</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="tracking-controls">
                  <button
                    onClick={stopTracking}
                    className="stop-tracking-btn"
                  >
                    Stop Tracking
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map((notification, index) => (
            <div key={index} className="notification-toast">
              {notification}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
