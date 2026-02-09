'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FarmCard } from './FarmCard'
import { MapPin, Navigation, Compass, Clock } from 'lucide-react'
import { EmptyState } from './ui/EmptyState'
import type { FarmShop } from '@/types/farm'
import { calculateDistance } from '@/shared/lib/geo'
import { isCurrentlyOpen } from '@/lib/farm-status'

interface NearbyFarmsProps {
  className?: string
  limit?: number
}

// Custom spring-like easing
const ease = [0.16, 1, 0.3, 1] as const

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
 * Reusable background -- rich organic gradient with warm radial glows.
 * No image dependency; pure CSS for reliability and performance.
 */
function SectionBackground() {
  return (
    <>
      {/* Base gradient: deep forest to warm earth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1A0B] via-[#141410] to-[#1A110A]" />
      {/* Radial glows for depth and warmth */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 35%, rgba(34,120,34,0.08) 0%, transparent 55%), ' +
            'radial-gradient(ellipse at 80% 65%, rgba(180,120,50,0.06) 0%, transparent 55%)',
        }}
      />
      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)',
        }}
      />
    </>
  )
}

/**
 * NearbyFarms - Awwwards-inspired editorial section.
 *
 * Rich CSS gradient background with scroll-driven content reveals.
 * Farm cards are the visual anchor; the header area uses bold
 * typography and organic colour to set the tone.
 */
export function NearbyFarms({ className = '', limit = 4 }: NearbyFarmsProps) {
  const router = useRouter()
  const sectionRef = useRef<HTMLElement>(null)
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

  // Scroll-driven animations
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const contentY = useTransform(scrollYProgress, [0.08, 0.3], [50, 0])
  const contentOpacity = useTransform(scrollYProgress, [0.08, 0.25], [0, 1])

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
      <section className={`relative py-28 md:py-36 lg:py-44 overflow-hidden ${className}`}>
        <SectionBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-px h-14 bg-white/20 mx-auto mb-10" />
            <div className="h-12 w-64 bg-white/10 rounded-lg animate-pulse mx-auto mb-4" />
            <div className="h-6 w-96 max-w-full bg-white/[0.06] rounded-lg animate-pulse mx-auto" />
            <div className="w-px h-14 bg-white/20 mx-auto mt-10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/[0.05] rounded-2xl border border-white/[0.08] overflow-hidden">
                <div className="h-44 bg-white/[0.03] animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-3/4 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-white/[0.04] rounded animate-pulse" />
                  <div className="flex gap-3 pt-2">
                    <div className="flex-1 h-11 bg-white/[0.05] rounded-xl animate-pulse" />
                    <div className="w-11 h-11 bg-white/[0.05] rounded-xl animate-pulse" />
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
      <section className={`relative py-28 md:py-36 overflow-hidden ${className}`}>
        <SectionBackground />
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
    <section
      ref={sectionRef}
      className={`relative py-28 md:py-36 lg:py-48 overflow-hidden ${className}`}
    >
      <SectionBackground />

      {/* Scroll-driven content */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* Section Header */}
        <div className="text-center mb-20 md:mb-24">
          {/* Animated vertical accent */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 0.8, ease }}
            viewport={{ once: true }}
            className="w-px h-14 bg-white/25 mx-auto mb-10 origin-top"
            aria-hidden="true"
          />

          {/* Seasonal Tag */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.1] mb-8"
          >
            <span className="text-amber-400 font-semibold text-sm tracking-wide">
              {seasonal.headline}
            </span>
            <span className="w-px h-3.5 bg-white/20" />
            <span className="text-white/55 text-sm">
              {seasonal.subtext}
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-white mb-6 tracking-tight leading-[1.08]"
          >
            {locationDenied ? (
              <>
                Popular Farms
                <br />
                <span className="text-white/70">Near London</span>
              </>
            ) : (
              <>
                Farms
                <br />
                <span className="text-white/70">Near You</span>
              </>
            )}
          </motion.h2>

          {/* Animated horizontal rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.35, ease }}
            viewport={{ once: true }}
            className="w-16 h-px bg-white/30 mx-auto mb-6 origin-left"
            aria-hidden="true"
          />

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            viewport={{ once: true }}
            className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-8 leading-relaxed"
          >
            {locationDenied
              ? 'Discover these popular farm shops. Enable location to see farms closest to you.'
              : 'Discover local farm shops close to your location with fresh produce and more.'}
          </motion.p>

          {/* Live Status Indicator */}
          {farms.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2.5 text-sm mb-6"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="text-white/60">
                <span className="font-semibold text-emerald-400">{openFarmsCount}</span>
                {' '}of {farms.length} farms open now
              </span>
              <Clock className="w-3.5 h-3.5 text-white/35" />
            </motion.div>
          )}

          {/* Bottom accent */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease }}
            viewport={{ once: true }}
            className="w-px h-10 bg-white/20 mx-auto mt-4 origin-top"
            aria-hidden="true"
          />

          {/* Enable Location CTA */}
          {locationDenied && !showLocationHelp && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease }}
              viewport={{ once: true }}
              className="inline-flex flex-col items-center gap-3 mt-10"
            >
              <button
                onClick={handleEnableLocation}
                className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-white text-slate-900 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 hover:bg-white/90 hover:shadow-lg hover:shadow-white/10 active:scale-[0.97]"
              >
                <MapPin className="w-4 h-4" />
                Enable Location
              </button>
              <p className="text-sm text-white/40">
                {permissionState === 'denied'
                  ? 'Location was previously blocked. Click to see how to enable it.'
                  : 'Click "Allow" when your browser asks for permission'}
              </p>
            </motion.div>
          )}

          {/* Location Help Panel */}
          {showLocationHelp && (
            <div className="max-w-md mx-auto mt-10 bg-white/[0.06] backdrop-blur-md border border-white/[0.1] rounded-2xl p-6 text-left">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-500/15 rounded-lg">
                  <Compass className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Enable Location Access
                  </h3>
                  <p className="text-sm text-white/50">
                    Location access was previously blocked. To enable it:
                  </p>
                </div>
              </div>

              <ol className="space-y-2.5 text-sm text-white/70 mb-5 pl-4">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white text-xs font-semibold flex items-center justify-center">1</span>
                  <span>Click the <strong className="text-white/90">lock icon</strong> in your browser&apos;s address bar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white text-xs font-semibold flex items-center justify-center">2</span>
                  <span>Find <strong className="text-white/90">Location</strong> in the permissions list</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white text-xs font-semibold flex items-center justify-center">3</span>
                  <span>Change from &quot;Block&quot; to <strong className="text-white/90">Allow</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white text-xs font-semibold flex items-center justify-center">4</span>
                  <span>Refresh the page</span>
                </li>
              </ol>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLocationHelp(false)}
                  className="flex-1 h-10 px-4 bg-white/[0.06] border border-white/[0.12] text-white rounded-lg text-sm font-medium hover:bg-white/[0.1] transition-colors"
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

        {/* Farm Grid -- staggered card entrance */}
        {farms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14 md:mb-18">
            {farms.map((farm, index) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease,
                }}
                viewport={{ once: true, margin: '-40px' }}
              >
                <FarmCard farm={farm} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No farms found nearby</h3>
            <p className="text-white/50 mb-6">Try exploring all farms or adjusting your location</p>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease }}
            viewport={{ once: true }}
            className="text-center"
          >
            <button
              onClick={handleExploreAll}
              className="inline-flex items-center justify-center gap-3 h-14 px-9 bg-white text-slate-900 rounded-full text-sm tracking-[0.04em] font-semibold transition-all duration-300 hover:bg-white/90 hover:shadow-lg hover:shadow-white/10 active:scale-[0.97]"
            >
              <Navigation className="w-4 h-4" />
              Explore All Farms on Map
            </button>
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
