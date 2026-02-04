'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface WeekendActivity {
  type: 'pyo' | 'market' | 'event' | 'cafe' | 'tour'
  label: string
}

interface WeekendFarm {
  slug: string
  name: string
  county: string
  image?: string
  activities: WeekendActivity[]
  distance?: number
  saturdayHours?: string
  sundayHours?: string
}

type DayOfWeek = 'saturday' | 'sunday' | 'both'

interface WeekendPlannerProps {
  className?: string
  limit?: number
}

/**
 * Weekend Planner Module
 *
 * Luxury editorial design. Fetches farms with weekend activities
 * from /api/farms/weekend (Prisma, cached 1h). Weekend dates are
 * dynamically computed. Weather banner is static.
 */
export function WeekendPlanner({ className = '', limit = 4 }: WeekendPlannerProps) {
  const [farms, setFarms] = useState<WeekendFarm[]>([])
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('both')
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [weekendDates, setWeekendDates] = useState<{ saturday: string; sunday: string }>({
    saturday: '',
    sunday: '',
  })

  useEffect(() => {
    setMounted(true)

    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek
    const saturday = new Date(today)
    saturday.setDate(today.getDate() + daysUntilSaturday)
    const sunday = new Date(saturday)
    sunday.setDate(saturday.getDate() + 1)

    setWeekendDates({
      saturday: saturday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      sunday: sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    })

    const fetchWeekendFarms = async () => {
      try {
        const response = await fetch(`/api/farms/weekend?limit=${limit}`)
        if (response.ok) {
          const data = await response.json()
          setFarms(data.farms || [])
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeekendFarms()
  }, [limit])

  const isWeekendNow = () => {
    const day = new Date().getDay()
    return day === 0 || day === 6
  }

  // SSR placeholder
  if (!mounted) {
    return (
      <div className={`max-w-2xl mx-auto px-6 ${className}`}>
        <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />
        <div className="h-6 w-48 bg-border/30 mx-auto mb-4" />
        <div className="h-8 w-64 bg-border/30 mx-auto mb-4" />
        <div className="h-4 w-80 bg-border/30 mx-auto" />
      </div>
    )
  }

  const dayLabels: { key: DayOfWeek; label: string }[] = [
    { key: 'both', label: 'Both Days' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ]

  const getHoursDisplay = (farm: WeekendFarm): string | null => {
    if (selectedDay === 'saturday' && farm.saturdayHours) return `Sat ${farm.saturdayHours}`
    if (selectedDay === 'sunday' && farm.sundayHours) return `Sun ${farm.sundayHours}`
    if (selectedDay === 'both') {
      const parts: string[] = []
      if (farm.saturdayHours) parts.push(`Sat ${farm.saturdayHours}`)
      if (farm.sundayHours) parts.push(`Sun ${farm.sundayHours}`)
      return parts.length > 0 ? parts.join(' / ') : null
    }
    return null
  }

  return (
    <section className={className}>
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <div className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            {isWeekendNow() ? 'This Weekend' : 'Upcoming Weekend'}
          </div>

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-foreground tracking-tight">
            Plan Your Farm Visit
          </h2>

          <p className="mt-4 text-foreground-muted">
            Markets, pick-your-own, and farm experiences this {weekendDates.saturday} - {weekendDates.sunday}
          </p>
        </div>

        {/* Day filter */}
        <div className="flex items-center justify-center gap-6 mb-12">
          {dayLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedDay(key)}
              className={`text-xs tracking-[0.15em] uppercase pb-1 transition-opacity duration-300 ${
                selectedDay === key
                  ? 'text-foreground border-b border-foreground'
                  : 'text-foreground-muted hover:opacity-70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Farm listings */}
        {isLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="py-6 border-t border-border">
                <div className="h-4 w-48 bg-border/30 mb-3" />
                <div className="h-3 w-32 bg-border/30" />
              </div>
            ))}
          </div>
        ) : farms.length > 0 ? (
          <div className="space-y-0">
            {farms.map((farm, index) => (
              <Link
                key={farm.slug}
                href={`/shop/${farm.slug}`}
                className="group block py-8 border-t border-border hover:opacity-70 transition-opacity duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Image */}
                  {farm.image && (
                    <div className="relative w-full md:w-40 h-48 md:h-28 flex-shrink-0 overflow-hidden bg-background-secondary">
                      <Image
                        src={farm.image}
                        alt={farm.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 160px"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-xl md:text-2xl font-normal text-foreground leading-tight mb-2">
                      {farm.name}
                    </h3>

                    <div className="text-xs tracking-[0.15em] uppercase text-foreground-muted mb-3">
                      {farm.county}
                      {farm.distance != null && ` / ${farm.distance.toFixed(1)} mi`}
                    </div>

                    {/* Activities */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                      {farm.activities.slice(0, 3).map((activity, i) => (
                        <span
                          key={i}
                          className="text-xs tracking-[0.1em] uppercase text-foreground-muted"
                        >
                          {activity.label}
                        </span>
                      ))}
                    </div>

                    {/* Hours */}
                    {getHoursDisplay(farm) && (
                      <p className="text-sm text-foreground-muted">
                        {getHoursDisplay(farm)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {/* Bottom border */}
            <div className="border-t border-border" aria-hidden="true" />
          </div>
        ) : (
          <div className="py-12 text-center border-t border-border">
            <p className="text-lg leading-[1.9] text-foreground mb-4">
              No weekend activities found
            </p>
            <p className="text-foreground-muted text-sm mb-8">
              Check back later for upcoming farm events and markets.
            </p>
            <Link
              href="/map"
              className="text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
            >
              Browse All Farms
            </Link>
          </div>
        )}

        {/* View all link */}
        {farms.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              href="/map?filter=weekend"
              className="text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
            >
              View All Weekend Activities
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
