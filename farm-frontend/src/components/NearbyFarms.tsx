'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FarmCard } from './FarmCard'
import { Button } from './ui/Button'
import { MapPin, Navigation, Compass, Clock } from 'lucide-react'
import { EmptyState } from './ui/EmptyState'
import type { FarmShop } from '@/types/farm'
import { calculateDistance } from '@/shared/lib/geo'
import { isCurrentlyOpen } from '@/lib/farm-status'

interface NearbyFarmsProps {
  className?: string
  limit?: number
}

// Seasonal headlines for each month
const SEASONAL_HEADLINES: Record<number, { headline: string; subtext: string }> = {
  0: { headline: "January", subtext: "Time for hearty stews and crisp winter vegetables" },
  1: { headline: "February", subtext: "Embrace forced rhubarb and stored root veg" },
  2: { headline: "March", subtext: "Spring greens are emerging, leeks at their best" },
  3: { headline: "April", subtext: "Asparagus season begins, wild garlic in woods" },
  4: { headline: "May", subtext: "Jersey Royals and the first strawberries" },
  5: { headline: "June", subtext: "Peak strawberry season, broad beans aplenty" },
  6: { headline: "July", subtext: "Summer berries, courgettes and fresh salads" },
  7: { headline: "August", subtext: "Sweetcorn, tomatoes and stone fruit galore" },
  8: { headline: "September", subtext: "Apple season, blackberries and squash" },
  9: { headline: "October", subtext: "Pumpkins, game birds and orchard fruits" },
  10: { headline: "November", subtext: "Brussels sprouts, parsnips and comfort food" },
  11: { headline: "December", subtext: "Christmas fare, chestnuts and winter roots" }
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
  const [farms, setFarms] = useState<FarmShop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown')
  const [showLocationHelp, setShowLocationHelp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get current month for seasonal headline
  const currentMonth = new Date().getMonth()
  const seasonal = SEASONAL_HEADLINES[currentMonth]

  // Count how many farms are currently open
  const openFarmsCount = useMemo(() => {
    return farms.filter(farm => isCurrentlyOpen(farm.hours)).length
  }, [farms])

  // Check geolocation permission state
  useEffect(() => {
    async function checkPermission() {
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' })
          setPermissionState(result.state as 'prompt' | 'granted' | 'denied')

          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionState(result.state as 'prompt' | 'granted' | 'denied')
            if (result.state === 'granted') {
              setLocationDenied(false)
              setShowLocationHelp(false)
              requestLocation()
            }
          })
        } catch {
          setPermissionState('unknown')
        }
      }
    }
    checkPermission()
  }, [])

  // Request user location
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setLocationDenied(false)
          setShowLocationHelp(false)
        },
        () => {
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
  }

  // Initial location request on mount
  useEffect(() => {
    requestLocation()
  }, [])

  // Fetch and sort farms by distance
  useEffect(() => {
    if (!userLocation) return

    // Capture userLocation as const for TypeScript narrowing
    const location = userLocation

    async function loadNearbyFarms() {
      try {
        const response = await fetch('/api/farms?limit=100')
        if (!response.ok) throw new Error('Failed to fetch farms')

        const data = await response.json()
        const allFarms: FarmShop[] = data.farms || []

        // Calculate distances and sort by nearest
        const farmsWithDistance = allFarms
          .map((farm) => ({
            ...farm,
            distance: calculateDistance(
              location.lat,
              location.lng,
              farm.location.lat,
              farm.location.lng
            )
          }))
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
          .slice(0, limit)

        setFarms(farmsWithDistance)
      } catch {
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
    // If permission is denied, show help modal since browser won't re-prompt
    if (permissionState === 'denied') {
      setShowLocationHelp(true)
      return
    }

    // Otherwise try to request location (will prompt if state is 'prompt')
    requestLocation()
  }

  // Loading skeleton - matches new card design
  if (isLoading) {
    return (
      <section className={`py-16 md:py-24 bg-white dark:bg-slate-950 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mx-auto mb-4" />
            <div className="h-6 w-96 max-w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="h-36 bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="flex gap-3 pt-2">
                    <div className="flex-1 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                    <div className="w-24 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
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
      <section className={`py-16 md:py-24 bg-white dark:bg-slate-950 ${className}`}>
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
    <section className={`py-16 md:py-24 bg-white dark:bg-slate-950 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Seasonal and Dynamic */}
        <div className="text-center mb-12">
          {/* Seasonal Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
            <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm">
              {seasonal.headline}
            </span>
            <span className="text-amber-700 dark:text-amber-300 text-sm">
              {seasonal.subtext}
            </span>
          </div>

          {/* Heading - slate-900 for maximum contrast (16.8:1) */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            {locationDenied ? 'Popular Farms Near London' : 'Farms Near You'}
          </h2>

          {/* Description with live status - slate-700 for high contrast (8.6:1) */}
          <p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto mb-4">
            {locationDenied
              ? 'Discover these popular farm shops. Enable location to see farms closest to you.'
              : 'Discover local farm shops close to your location with fresh produce and more.'}
          </p>

          {/* Live Status Indicator */}
          {farms.length > 0 && (
            <div className="inline-flex items-center gap-2 text-sm mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{openFarmsCount}</span>
                {' '}of {farms.length} farms open now
              </span>
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 ml-1" />
            </div>
          )}

          {/* Enable Location CTA */}
          {locationDenied && !showLocationHelp && (
            <div className="inline-flex flex-col items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleEnableLocation}
              >
                <MapPin className="w-5 h-5 mr-2" />
                Enable Location
              </Button>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {permissionState === 'denied'
                  ? 'Location was previously blocked. Click to see how to enable it.'
                  : 'Click "Allow" when your browser asks for permission'}
              </p>
            </div>
          )}

          {/* Location Help Panel - shown when permission is denied */}
          {showLocationHelp && (
            <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-left">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Compass className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Enable Location Access
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Location access was previously blocked. To enable it:
                  </p>
                </div>
              </div>

              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 mb-4 pl-4">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold flex items-center justify-center">1</span>
                  <span>Click the <strong>lock icon</strong> in your browser&apos;s address bar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold flex items-center justify-center">2</span>
                  <span>Find <strong>Location</strong> in the permissions list</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold flex items-center justify-center">3</span>
                  <span>Change from &quot;Block&quot; to <strong>Allow</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold flex items-center justify-center">4</span>
                  <span>Refresh the page</span>
                </li>
              </ol>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowLocationHelp(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Farm Grid - 4 columns on large screens */}
        {farms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {farms.map((farm) => (
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
