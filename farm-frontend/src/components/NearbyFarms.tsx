'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
 * NearbyFarms - Luxury Editorial Section
 *
 * LV-inspired design with full-bleed background image,
 * sophisticated gradient overlay, and elegant typography.
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
  const [mounted, setMounted] = useState(false)

  // Get current month for seasonal headline - client-side only
  const [currentMonth, setCurrentMonth] = useState(0)

  useEffect(() => {
    setMounted(true)
    setCurrentMonth(new Date().getMonth())
  }, [])

  const seasonal = SEASONAL_HEADLINES[currentMonth]

  // Count how many farms are currently open
  const openFarmsCount = useMemo(() => {
    if (!mounted) return 0
    return farms.filter(farm => isCurrentlyOpen(farm.hours)).length
  }, [farms, mounted])

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

  // Check permission on mount: only auto-request if already granted (no prompt).
  // Otherwise start with London fallback and let user click "Enable Location".
  useEffect(() => {
    async function checkPermission() {
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' })
          setPermissionState(result.state as 'prompt' | 'granted' | 'denied')

          if (result.state === 'granted') {
            // Permission already granted - request silently (no prompt)
            requestLocation()
          } else {
            // 'prompt' or 'denied' - use fallback, don't trigger prompt on load
            setLocationDenied(true)
            setUserLocation({ lat: 51.5074, lng: -0.1278 })
          }

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
          setLocationDenied(true)
          setUserLocation({ lat: 51.5074, lng: -0.1278 })
        }
      } else {
        // No Permissions API - use fallback
        setLocationDenied(true)
        setUserLocation({ lat: 51.5074, lng: -0.1278 })
      }
    }
    checkPermission()
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

  // Loading skeleton with background
  if (isLoading) {
    return (
      <section className={`relative py-24 md:py-32 lg:py-40 overflow-hidden ${className}`}>
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=70&auto=format"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            quality={25}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-px h-12 bg-white/40 mx-auto mb-8" />
            <div className="h-12 w-64 bg-white/20 rounded-lg animate-pulse mx-auto mb-4" />
            <div className="h-6 w-96 max-w-full bg-white/10 rounded-lg animate-pulse mx-auto" />
            <div className="w-px h-12 bg-white/40 mx-auto mt-8" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                <div className="h-44 bg-white/5 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse" />
                  <div className="flex gap-3 pt-2">
                    <div className="flex-1 h-11 bg-white/10 rounded-xl animate-pulse" />
                    <div className="w-11 h-11 bg-white/10 rounded-xl animate-pulse" />
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
      <section className={`relative py-24 md:py-32 overflow-hidden ${className}`}>
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=70&auto=format"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            quality={25}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon={<MapPin className="w-16 h-16 text-white/60" />}
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
    <section className={`relative py-24 md:py-32 lg:py-40 overflow-hidden ${className}`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=70&auto=format"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          quality={25}
        />
        {/* Sophisticated multi-layer overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          {/* Vertical line accent */}
          <div className="w-px h-12 bg-white/40 mx-auto mb-8" aria-hidden="true" />

          {/* Seasonal Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <span className="text-amber-300 font-medium text-sm">
              {seasonal.headline}
            </span>
            <span className="text-white/70 text-sm">
              {seasonal.subtext}
            </span>
          </div>

          {/* Heading */}
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 tracking-tight">
            {locationDenied ? 'Popular Farms Near London' : 'Farms Near You'}
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-6 leading-relaxed">
            {locationDenied
              ? 'Discover these popular farm shops. Enable location to see farms closest to you.'
              : 'Discover local farm shops close to your location with fresh produce and more.'}
          </p>

          {/* Live Status Indicator */}
          {farms.length > 0 && (
            <div className="inline-flex items-center gap-2 text-sm mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span className="text-white/70">
                <span className="font-semibold text-emerald-400">{openFarmsCount}</span>
                {' '}of {farms.length} farms open now
              </span>
              <Clock className="w-4 h-4 text-white/50 ml-1" />
            </div>
          )}

          {/* Vertical line accent */}
          <div className="w-px h-12 bg-white/40 mx-auto mt-2" aria-hidden="true" />

          {/* Enable Location CTA */}
          {locationDenied && !showLocationHelp && (
            <div className="inline-flex flex-col items-center gap-3 mt-8">
              <button
                onClick={handleEnableLocation}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white text-slate-900 rounded-full text-sm font-medium transition-all hover:bg-white/90 hover:shadow-lg active:scale-[0.98]"
              >
                <MapPin className="w-4 h-4" />
                Enable Location
              </button>
              <p className="text-sm text-white/60">
                {permissionState === 'denied'
                  ? 'Location was previously blocked. Click to see how to enable it.'
                  : 'Click "Allow" when your browser asks for permission'}
              </p>
            </div>
          )}

          {/* Location Help Panel */}
          {showLocationHelp && (
            <div className="max-w-md mx-auto mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-left">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Compass className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Enable Location Access
                  </h3>
                  <p className="text-sm text-white/60">
                    Location access was previously blocked. To enable it:
                  </p>
                </div>
              </div>

              <ol className="space-y-2 text-sm text-white/80 mb-4 pl-4">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 text-white text-xs font-semibold flex items-center justify-center">1</span>
                  <span>Click the <strong>lock icon</strong> in your browser&apos;s address bar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 text-white text-xs font-semibold flex items-center justify-center">2</span>
                  <span>Find <strong>Location</strong> in the permissions list</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 text-white text-xs font-semibold flex items-center justify-center">3</span>
                  <span>Change from &quot;Block&quot; to <strong>Allow</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 text-white text-xs font-semibold flex items-center justify-center">4</span>
                  <span>Refresh the page</span>
                </li>
              </ol>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLocationHelp(false)}
                  className="flex-1 h-10 px-4 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 h-10 px-4 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Farm Grid */}
        {farms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 md:mb-16">
            {farms.map((farm) => (
              <FarmCard
                key={farm.id}
                farm={farm}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No farms found nearby</h3>
            <p className="text-white/60 mb-6">Try exploring all farms or adjusting your location</p>
            <button
              onClick={() => router.push('/shop')}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white text-slate-900 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
            >
              View all farms
            </button>
          </div>
        )}

        {/* Explore All CTA */}
        {farms.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleExploreAll}
              className="inline-flex items-center justify-center gap-3 h-14 px-8 bg-white text-slate-900 rounded-full text-sm tracking-[0.05em] font-medium transition-all duration-300 hover:bg-white/90 hover:shadow-lg hover:shadow-white/20 active:scale-[0.98]"
            >
              <Navigation className="w-4 h-4" />
              Explore All Farms on Map
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
