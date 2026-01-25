'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FarmCard } from './FarmCard'
import { Button } from './ui/Button'
import { MapPin, Navigation, Compass } from 'lucide-react'
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
 * God-Tier NearbyFarms Section
 *
 * Design principles:
 * 1. Maximum contrast - white background, dark text
 * 2. Clear visual hierarchy - prominent heading, readable description
 * 3. Spacious layout - breathing room between elements
 * 4. WCAG AAA compliant - all text passes 7:1 contrast
 * 5. Clear CTAs - obvious buttons with proper affordance
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

  // Loading skeleton - Obsidian-Kinetic styling
  if (isLoading) {
    return (
      <section className={`py-16 md:py-24 bg-white dark:bg-[#050505] ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-zinc-200 dark:bg-[#1E1E21] rounded-lg animate-pulse mx-auto mb-4" />
            <div className="h-6 w-96 max-w-full bg-zinc-200 dark:bg-[#1E1E21] rounded-lg animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#121214] rounded-2xl border-2 border-zinc-200 dark:border-white/[0.08] overflow-hidden">
                <div className="h-36 bg-zinc-200 dark:bg-[#1E1E21] animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-6 w-3/4 bg-zinc-200 dark:bg-[#1E1E21] rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-zinc-200 dark:bg-[#1E1E21] rounded animate-pulse" />
                  <div className="flex gap-3 pt-2">
                    <div className="flex-1 h-11 bg-zinc-200 dark:bg-[#1E1E21] rounded-xl animate-pulse" />
                    <div className="w-24 h-11 bg-zinc-200 dark:bg-[#1E1E21] rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`py-16 md:py-24 bg-white dark:bg-[#050505] ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <section className={`py-16 md:py-24 bg-white dark:bg-[#050505] ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Obsidian-Kinetic styling */}
        <div className="text-center mb-12">
          {/* Icon badge */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 mb-6">
            <Compass className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
          </div>

          {/* Heading - zinc-900 for maximum contrast, adaptive font weight */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold dark:font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            {locationDenied ? 'Popular Farms Near London' : 'Farms Near You'}
          </h2>

          {/* Description - zinc-700 for high contrast */}
          <p className="text-lg text-zinc-700 dark:text-zinc-300 max-w-2xl mx-auto mb-6">
            {locationDenied
              ? 'Discover these popular farm shops. Enable location to see farms closest to you.'
              : 'Discover local farm shops close to your location with fresh produce and more.'}
          </p>

          {/* Enable Location CTA */}
          {locationDenied && (
            <div className="inline-flex flex-col items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleEnableLocation}
              >
                <MapPin className="w-5 h-5 mr-2" />
                Enable Location
              </Button>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Click &quot;Allow&quot; when your browser asks for permission
              </p>
            </div>
          )}
        </div>

        {/* Farm Grid - 4 columns on large screens */}
        {farms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
              variant="secondary"
              size="lg"
              onClick={handleExploreAll}
            >
              <Navigation className="w-5 h-5 mr-2" />
              Explore All Farms on Map
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
