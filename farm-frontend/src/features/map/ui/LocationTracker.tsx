'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, Navigation, Wifi, WifiOff } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { calculateDistance, formatDistance } from '@/shared/lib/geo'

interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  isTracking?: boolean
  nearestFarm?: {
    id: string
    name: string
    distance: number
  }
}

interface LocationTrackerProps {
  farms: FarmShop[]
  onLocationUpdate: (location: UserLocation) => void
  onFarmsUpdate: (farms: FarmShop[]) => void
  onZoomToLocation?: () => void
  compact?: boolean
  className?: string
}

export default function LocationTracker({ 
  farms, 
  onLocationUpdate, 
  onFarmsUpdate, 
  onZoomToLocation,
  compact = false,
  className = '' 
}: LocationTrackerProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  // Check location permission
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      setPermission('prompt')
      return
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      setPermission(result.state)
      
      result.onchange = () => {
        setPermission(result.state)
      }
    } catch (err) {
      setPermission('prompt')
    }
  }, [])

  // Calculate nearest farm
  const calculateNearestFarm = useCallback((location: UserLocation, farmList: FarmShop[]) => {
    if (!farmList.length) return undefined

    let nearest = farmList[0]
    let minDistance = calculateDistance(
      location.latitude,
      location.longitude,
      farmList[0].location.lat,
      farmList[0].location.lng
    )

    farmList.forEach(farm => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        farm.location.lat,
        farm.location.lng
      )
      if (distance < minDistance) {
        minDistance = distance
        nearest = farm
      }
    })

    return {
      id: nearest.id,
      name: nearest.name,
      distance: minDistance
    }
  }, [])

  // Get current location once
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLoading(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const location: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      }

      // Calculate nearest farm
      const nearestFarm = calculateNearestFarm(location, farms)
      location.nearestFarm = nearestFarm

      setUserLocation(location)
      onLocationUpdate(location)
      
      // Update farm distances
      const farmsWithDistance = farms.map(farm => ({
        ...farm,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          farm.location.lat,
          farm.location.lng
        )
      }))

      // Sort by distance
      farmsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      onFarmsUpdate(farmsWithDistance)
      
    } catch (err) {
      console.error('Error getting location:', err)
      alert('Unable to get your location. Please check your browser settings.')
    } finally {
      setIsLoading(false)
    }
  }, [farms, calculateNearestFarm, onLocationUpdate, onFarmsUpdate])

  // Start real-time tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation || permission === 'denied') {
      return
    }

    setIsTracking(true)
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          isTracking: true
        }

        // Calculate nearest farm
        const nearestFarm = calculateNearestFarm(location, farms)
        location.nearestFarm = nearestFarm

        setUserLocation(location)
        onLocationUpdate(location)
        
        // Update farm distances
        const farmsWithDistance = farms.map(farm => ({
          ...farm,
          distance: calculateDistance(
            location.latitude,
            location.longitude,
            farm.location.lat,
            farm.location.lng
          )
        }))

        // Sort by distance
        farmsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
        onFarmsUpdate(farmsWithDistance)
      },
      (error) => {
        console.error('Location tracking error:', error)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // Update every 30 seconds
      }
    )
  }, [permission, farms, calculateNearestFarm, onLocationUpdate, onFarmsUpdate])

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
    
    // Update user location to remove tracking flag
    if (userLocation) {
      const updatedLocation = { ...userLocation, isTracking: false }
      setUserLocation(updatedLocation)
      onLocationUpdate(updatedLocation)
    }
  }, [userLocation, onLocationUpdate])

  // Initialize permission check
  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Compact mobile version
  if (compact) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={onZoomToLocation || getCurrentLocation}
          disabled={isLoading || permission === 'denied'}
          className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          title={isLoading ? 'Getting Location...' : userLocation ? 'Zoom to Location' : 'Get Location'}
        >
          <MapPin className="w-3 h-3" />
          {isLoading ? '...' : userLocation ? 'Zoom' : 'Locate'}
        </button>

        {!isTracking ? (
          <button
            onClick={startTracking}
            disabled={permission === 'denied'}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            title="Start tracking location"
          >
            <Wifi className="w-3 h-3" />
            Track
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-xs"
            title="Stop tracking location"
          >
            <WifiOff className="w-3 h-3" />
            Stop
          </button>
        )}
      </div>
    )
  }

  // Full desktop version
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Location Status */}
      {userLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Your Location</span>
            {userLocation.isTracking && (
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">Live</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-blue-700 space-y-1">
            <div>Accuracy: ±{Math.round(userLocation.accuracy)}m</div>
            {userLocation.nearestFarm && (
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                <span>Nearest: {userLocation.nearestFarm.name} ({formatDistance(userLocation.nearestFarm.distance)})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Controls */}
      <div className="flex gap-2">
        <button
          onClick={onZoomToLocation || getCurrentLocation}
          disabled={isLoading || permission === 'denied'}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <MapPin className="w-4 h-4" />
          {isLoading ? 'Getting Location...' : userLocation ? 'Zoom to Location' : 'Get Location'}
        </button>

        {!isTracking ? (
          <button
            onClick={startTracking}
            disabled={permission === 'denied'}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Wifi className="w-4 h-4" />
            Track
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
          >
            <WifiOff className="w-4 h-4" />
            Stop
          </button>
        )}
      </div>

      {/* Permission Status */}
      {permission === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-800">
            Location access denied. Please enable location services in your browser settings.
          </div>
        </div>
      )}
    </div>
  )
}
