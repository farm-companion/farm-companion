'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FarmCard } from './FarmCard'
import { Button } from './ui/Button'
import { MapPin, Navigation } from 'lucide-react'
import { EmptyState } from './ui/EmptyState'

interface Farm {
  id: string
  name: string
  slug: string
  location: {
    address: string
    city?: string
    county: string
    postcode: string
    lat: number
    lng: number
  }
  googleRating?: number
  verified?: boolean
  images?: Array<{
    url: string
    altText?: string
  }>
  categories?: string[]
}

interface NearbyFarmsProps {
  className?: string
  limit?: number
}

/**
 * NearbyFarms component displays farms near the user's location
 * Features: geolocation detection, distance calculation, fallback to popular location
 */
export function NearbyFarms({ className = '', limit = 4 }: NearbyFarmsProps) {
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180)
  }

  // Request user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocationDenied(true)
          // Fallback to London coordinates
          setUserLocation({ lat: 51.5074, lng: -0.1278 })
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      )
    } else {
      setLocationDenied(true)
      // Fallback to London coordinates
      setUserLocation({ lat: 51.5074, lng: -0.1278 })
    }
  }, [])

  // Fetch and sort farms by distance
  useEffect(() => {
    if (!userLocation) return

    async function loadNearbyFarms() {
      try {
        const response = await fetch('/api/farms?limit=100')
        if (!response.ok) throw new Error('Failed to fetch farms')

        const data = await response.json()
        const allFarms = data.farms || []

        // Calculate distances and sort
        const farmsWithDistance = allFarms
          .map((farm: Farm) => ({
            ...farm,
            distance: userLocation
              ? calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  farm.location.lat,
                  farm.location.lng
                )
              : 0
          }))
          .sort((a: any, b: any) => a.distance - b.distance)
          .slice(0, limit)

        setFarms(farmsWithDistance)
      } catch (err) {
        console.error('Error loading nearby farms:', err)
        setError('Unable to load nearby farms')
      } finally {
        setIsLoading(false)
      }
    }

    loadNearbyFarms()
  }, [userLocation, limit])

  const handleExploreAll = () => {
    if (userLocation) {
      router.push(`/map?lat=${userLocation.lat}&lng=${userLocation.lng}&zoom=10`)
    } else {
      router.push('/map')
    }
  }

  const handleEnableLocation = () => {
    // Re-request location permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setLocationDenied(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
        }
      )
    }
  }

  if (isLoading) {
    return (
      <section className={`py-12 md:py-16 bg-gray-50 dark:bg-gray-900/50 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mx-auto mb-4" />
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`py-12 md:py-16 bg-gray-50 dark:bg-gray-900/50 ${className}`}>
        <div className="container mx-auto px-4">
          <EmptyState
            icon={<MapPin className="w-16 h-16" />}
            title="Unable to load nearby farms"
            description={error}
            action={{
              label: 'View all farms',
              onClick: () => router.push('/shop'),
              variant: 'primary'
            }}
          />
        </div>
      </section>
    )
  }

  return (
    <section className={`py-12 md:py-16 bg-gray-50 dark:bg-gray-900/50 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Navigation className="w-6 h-6 text-brand-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {locationDenied ? 'Popular Farms Near London' : 'Farms Near You'}
            </h2>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {locationDenied
              ? 'Discover these popular farms. Enable location to see farms near you.'
              : 'Discover local farms close to your location'}
          </p>
          {locationDenied && (
            <Button
              variant="secondary"
              onClick={handleEnableLocation}
              className="mt-4"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Enable Location
            </Button>
          )}
        </div>

        {/* Farm Grid */}
        {farms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {farms.map((farm: any) => (
              <FarmCard
                key={farm.id}
                farm={farm}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MapPin className="w-16 h-16" />}
            title="No farms found nearby"
            description="Try exploring all farms or adjusting your location"
            action={{
              label: 'View all farms',
              onClick: () => router.push('/shop'),
              variant: 'primary'
            }}
          />
        )}

        {/* Explore All CTA */}
        {farms.length > 0 && (
          <div className="text-center">
            <Button
              variant="primary"
              onClick={handleExploreAll}
              size="lg"
              className="shadow-premium hover:shadow-premium-lg"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Explore All Farms Near You
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
