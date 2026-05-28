'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FarmCard } from './FarmCard'
import { MapPin, Compass, Clock } from 'lucide-react'
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
 * NearbyFarms - all-light editorial section (brief §5.3 slot).
 * Calm "what's worth the trip" header on warm paper, farm cards as the
 * visual anchor. De-animated: no framer-motion, no dark cinematic backdrop.
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

  // Seasonal headline keyed by month; seeded once on render (deterministic).
  const [currentMonth] = useState(() => new Date().getMonth())
  const seasonal = SEASONAL_HEADLINES[currentMonth]

  // mounted gates the open-now count so SSR and client agree on isCurrentlyOpen.
  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Loading skeleton
  if (isLoading) {
    return (
      <section className={`bg-surface-2 py-24 md:py-32 ${className}`}>
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12 md:mb-16">
            <div className="h-4 w-40 bg-ink/10 rounded animate-pulse mb-4" />
            <div className="h-11 w-72 max-w-full bg-ink/10 rounded animate-pulse mb-4" />
            <div className="h-5 w-96 max-w-full bg-ink/[0.06] rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-border bg-surface rounded-[2px] overflow-hidden">
                <div className="h-44 bg-ink/[0.04] animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-3/4 bg-ink/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-ink/[0.04] rounded animate-pulse" />
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
      <section className={`bg-surface-2 py-24 md:py-32 ${className}`}>
        <div className="container mx-auto px-6">
          <EmptyState
            icon={<MapPin className="w-16 h-16 text-ink-muted" />}
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
    <section className={`bg-surface-2 py-24 md:py-32 ${className}`}>
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-caption uppercase tracking-[0.18em] text-ink-muted mb-4">
            {seasonal.headline} &middot; what&apos;s worth the trip
          </p>
          <h2 className="font-clash text-3xl md:text-4xl lg:text-5xl font-semibold text-ink tracking-tight leading-tight mb-5">
            {locationDenied ? 'Farm shops near London.' : 'Farm shops near you.'}
          </h2>
          <p className="text-body md:text-lg text-ink-muted leading-relaxed">
            {locationDenied
              ? 'The best local farm shops selling fresh seasonal produce. Enable location to find the ones nearest to you.'
              : 'Fresh seasonal produce from the farm shops closest to your location.'}
          </p>

          {/* Open-now status */}
          {farms.length > 0 && openFarmsCount > 0 && (
            <div className="inline-flex items-center gap-2.5 text-caption text-ink-muted mt-5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand" />
              </span>
              <span>
                <span className="font-semibold text-ink">{openFarmsCount}</span> of {farms.length} open now
              </span>
              <Clock className="w-3.5 h-3.5 text-ink-subtle" />
            </div>
          )}

          {/* Enable Location CTA */}
          {locationDenied && !showLocationHelp && (
            <div className="mt-6">
              <button
                onClick={handleEnableLocation}
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-brand text-brand-text text-sm font-semibold transition-colors hover:bg-brand-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2"
              >
                <MapPin className="w-4 h-4" />
                Enable location
              </button>
              <p className="text-caption text-ink-muted mt-2">
                {permissionState === 'denied'
                  ? 'Location was previously blocked. Click to see how to enable it.'
                  : 'Click "Allow" when your browser asks for permission.'}
              </p>
            </div>
          )}

          {/* Location Help Panel */}
          {showLocationHelp && (
            <div className="max-w-md mt-6 bg-surface border border-border rounded-[2px] p-6 text-left">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-brand/10 rounded-[2px]">
                  <Compass className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink mb-1">
                    Enable location access
                  </h3>
                  <p className="text-caption text-ink-muted">
                    Location access was previously blocked. To enable it:
                  </p>
                </div>
              </div>

              <ol className="space-y-2.5 text-caption text-ink-muted mb-5">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-2 text-ink text-xs font-semibold flex items-center justify-center">1</span>
                  <span>Click the <strong className="text-ink">lock icon</strong> in your browser&apos;s address bar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-2 text-ink text-xs font-semibold flex items-center justify-center">2</span>
                  <span>Find <strong className="text-ink">Location</strong> in the permissions list</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-2 text-ink text-xs font-semibold flex items-center justify-center">3</span>
                  <span>Change from &quot;Block&quot; to <strong className="text-ink">Allow</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-2 text-ink text-xs font-semibold flex items-center justify-center">4</span>
                  <span>Refresh the page</span>
                </li>
              </ol>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLocationHelp(false)}
                  className="flex-1 h-10 px-4 bg-surface-2 border border-border text-ink rounded-[2px] text-sm font-medium hover:bg-surface transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 h-10 px-4 bg-brand text-brand-text rounded-[2px] text-sm font-medium hover:bg-brand-hover transition-colors"
                >
                  Refresh page
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Farm grid */}
        {farms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {farms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} />
            ))}
          </div>
        ) : (
          <div className="py-12">
            <MapPin className="w-12 h-12 text-ink-subtle mb-4" />
            <h3 className="font-clash text-xl font-semibold text-ink mb-2">No farms found nearby</h3>
            <p className="text-ink-muted mb-6">Try exploring all farms or adjusting your location.</p>
            <button
              onClick={() => router.push('/shop')}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-brand text-brand-text text-sm font-semibold transition-colors hover:bg-brand-hover active:scale-[0.98]"
            >
              View all farms
            </button>
          </div>
        )}

        {/* Explore all on the map */}
        {farms.length > 0 && (
          <button
            onClick={handleExploreAll}
            className="group inline-flex items-center gap-1.5 text-body font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:underline"
          >
            All farms on the map
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </button>
        )}
      </div>
    </section>
  )
}
