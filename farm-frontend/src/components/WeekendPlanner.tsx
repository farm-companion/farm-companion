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

/** Generate an editorial hook from activity types. */
function getHook(activities: WeekendActivity[]): string {
  const types = activities.map((a) => a.type)
  if (types.includes('pyo')) return 'Pick your own seasonal produce this weekend'
  if (types.includes('tour')) return 'Farm tours running this weekend'
  if (types.includes('cafe')) return 'Stop by the farm cafe for something fresh'
  if (types.includes('market')) return 'Browse the weekend market for local finds'
  if (types.includes('event')) return 'Special events happening this weekend'
  return 'A favourite for fresh, seasonal produce'
}

/** Availability badge text from hours + selected day. */
function getAvailability(
  farm: WeekendFarm,
  selectedDay: DayOfWeek
): { text: string; hours: string | null } | null {
  const hasSat = !!farm.saturdayHours
  const hasSun = !!farm.sundayHours

  if (selectedDay === 'saturday') {
    if (!hasSat) return null
    return { text: 'Open Sat', hours: farm.saturdayHours! }
  }
  if (selectedDay === 'sunday') {
    if (!hasSun) return null
    return { text: 'Open Sun', hours: farm.sundayHours! }
  }
  // both
  if (hasSat && hasSun) return { text: 'Open Both Days', hours: null }
  if (hasSat) return { text: 'Open Sat', hours: farm.saturdayHours! }
  if (hasSun) return { text: 'Open Sun', hours: farm.sundayHours! }
  return null
}

/**
 * Weekend Planner
 *
 * Warm editorial section. Data from /api/farms/weekend (Prisma, 1h cache).
 * Weekend dates computed dynamically. Hooks generated from activity types.
 */
export function WeekendPlanner({ className = '', limit = 4 }: WeekendPlannerProps) {
  const [farms, setFarms] = useState<WeekendFarm[]>([])
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('both')
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [weekendLabel, setWeekendLabel] = useState('')
  const [weekendRange, setWeekendRange] = useState('')

  useEffect(() => {
    setMounted(true)

    const today = new Date()
    const dayOfWeek = today.getDay()
    const isNow = dayOfWeek === 0 || dayOfWeek === 6
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek
    const saturday = new Date(today)
    saturday.setDate(today.getDate() + daysUntilSaturday)
    const sunday = new Date(saturday)
    sunday.setDate(saturday.getDate() + 1)

    const satDay = saturday.getDate()
    const sunDay = sunday.getDate()
    const monthName = saturday.toLocaleDateString('en-GB', { month: 'long' })

    setWeekendLabel(isNow ? 'This Weekend' : 'This Weekend')
    setWeekendRange(`${satDay}-${sunDay} ${monthName}`)

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

  // SSR placeholder
  if (!mounted) {
    return (
      <div className={`bg-[#FDF8F3] dark:bg-background-secondary py-16 md:py-20 ${className}`}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-4 w-48 bg-border/20 mb-4" />
          <div className="h-8 w-56 bg-border/20 mb-4" />
          <div className="h-4 w-80 bg-border/20" />
        </div>
      </div>
    )
  }

  const dayTabs: { key: DayOfWeek; label: string }[] = [
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
    { key: 'both', label: 'Both' },
  ]

  return (
    <section className={`bg-[#FDF8F3] dark:bg-background-secondary py-16 md:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-6">

        {/* Header row */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-brand-primary font-medium mb-2">
              {weekendLabel}: {weekendRange}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-foreground tracking-tight">
              Where to Go
            </h2>
            <p className="mt-3 text-foreground-muted max-w-md">
              Farm shops with weekend events, seasonal picks, and things worth the drive.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Day tabs */}
            {dayTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                className={`px-5 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                  selectedDay === key
                    ? 'bg-white dark:bg-foreground/10 text-foreground shadow-sm border border-brand-primary/40'
                    : 'text-foreground-muted border border-border hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Farm cards */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-foreground/5 rounded-xl p-5 h-36" />
            ))}
          </div>
        ) : farms.length > 0 ? (
          <div className="space-y-6">
            {farms.map((farm) => {
              const avail = getAvailability(farm, selectedDay)

              return (
                <Link
                  key={farm.slug}
                  href={`/shop/${farm.slug}`}
                  className="group block bg-white dark:bg-foreground/5 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative w-full sm:w-[180px] h-[180px] sm:h-[160px] flex-shrink-0 bg-border/10">
                      {farm.image ? (
                        <Image
                          src={farm.image}
                          alt={farm.name}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, 180px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-foreground-muted/30 text-xs tracking-[0.2em] uppercase">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-serif text-xl font-normal text-foreground leading-snug mb-1">
                          {farm.name}
                        </h3>

                        <p className="text-sm text-foreground-muted mb-3">
                          {farm.county}
                          {farm.distance != null && ` \u00b7 ${farm.distance.toFixed(0)} miles`}
                        </p>

                        <p className="text-sm italic text-foreground-muted leading-relaxed">
                          &ldquo;{getHook(farm.activities)}&rdquo;
                        </p>
                      </div>

                      {/* Availability badge */}
                      {avail && (
                        <div className="mt-4 flex items-center justify-end">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs tracking-[0.1em] uppercase font-medium rounded-md">
                            {avail.text}
                            {avail.hours && (
                              <span className="font-normal opacity-80">{avail.hours}</span>
                            )}
                            <span aria-hidden="true">&rarr;</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-foreground/5 rounded-xl p-12 text-center">
            <p className="text-lg text-foreground mb-2">No weekend activities found</p>
            <p className="text-sm text-foreground-muted mb-6">
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

        {/* See all link */}
        {farms.length > 0 && (
          <div className="mt-10 flex justify-center md:justify-end">
            <Link
              href="/map?filter=weekend"
              className="text-sm font-medium text-brand-primary hover:opacity-70 transition-opacity"
            >
              See all this weekend &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
