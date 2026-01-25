'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Clock, Sparkles, ChevronRight, Sun, Cloud } from 'lucide-react'
import { getImageUrl } from '@/types/farm'

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

const ACTIVITY_ICONS: Record<WeekendActivity['type'], string> = {
  pyo: '🍓',
  market: '🛒',
  event: '🎉',
  cafe: '☕',
  tour: '🚜',
}

const ACTIVITY_COLORS: Record<WeekendActivity['type'], string> = {
  pyo: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  market: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  event: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  cafe: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  tour: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

interface WeekendPlannerProps {
  className?: string
  limit?: number
}

/**
 * Weekend Planner Module
 * Shows farms with weekend activities, markets, and events.
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

    // Calculate upcoming weekend dates
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

    // Fetch weekend farms
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

  // SSR loading state
  if (!mounted) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
      </div>
    )
  }

  const isWeekendNow = () => {
    const day = new Date().getDay()
    return day === 0 || day === 6
  }

  return (
    <section className={`${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="text-small font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                {isWeekendNow() ? 'This Weekend' : 'Upcoming Weekend'}
              </span>
              {isWeekendNow() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-small rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Now
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-text-heading">
              Plan Your Farm Visit
            </h2>
            <p className="text-body text-text-body mt-1">
              Markets, pick-your-own, and farm experiences this {weekendDates.saturday} - {weekendDates.sunday}
            </p>
          </div>

          {/* Day filter */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            {(['both', 'saturday', 'sunday'] as DayOfWeek[]).map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 text-caption font-medium rounded-md transition-colors ${
                  selectedDay === day
                    ? 'bg-white dark:bg-zinc-700 text-text-heading shadow-sm'
                    : 'text-text-muted hover:text-text-body'
                }`}
              >
                {day === 'both' ? 'Both Days' : day === 'saturday' ? 'Sat' : 'Sun'}
              </button>
            ))}
          </div>
        </div>

        {/* Weather hint */}
        <div className="flex items-center gap-2 mb-6 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
          <Sun className="w-5 h-5 text-amber-500" />
          <span className="text-caption text-text-body">
            Perfect weather for outdoor farm activities this weekend
          </span>
        </div>

        {/* Farm grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-zinc-200 dark:bg-zinc-700 rounded-xl mb-3" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : farms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {farms.map((farm) => (
              <Link
                key={farm.slug}
                href={`/shop/${farm.slug}`}
                className="group relative bg-background-card rounded-xl overflow-hidden border border-border-default
                  hover:border-primary-500 hover:shadow-lg transition-all duration-200"
              >
                {/* Image */}
                <div className="relative h-36 bg-zinc-100 dark:bg-zinc-800">
                  {farm.image ? (
                    <Image
                      src={farm.image}
                      alt={farm.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Sparkles className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                    </div>
                  )}
                  {/* Activity badges */}
                  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                    {farm.activities.slice(0, 3).map((activity, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 text-small font-medium rounded-full ${ACTIVITY_COLORS[activity.type]}`}
                      >
                        {ACTIVITY_ICONS[activity.type]} {activity.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-text-heading group-hover:text-primary-600 transition-colors line-clamp-1">
                    {farm.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-caption text-text-muted">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{farm.county}</span>
                    {farm.distance && (
                      <>
                        <span className="text-border-default">|</span>
                        <span>{farm.distance.toFixed(1)} mi</span>
                      </>
                    )}
                  </div>

                  {/* Hours */}
                  {(farm.saturdayHours || farm.sundayHours) && (
                    <div className="mt-2 pt-2 border-t border-border-default">
                      <div className="flex items-center gap-1 text-small text-text-muted">
                        <Clock className="w-3 h-3" />
                        {selectedDay === 'saturday' && farm.saturdayHours && (
                          <span>Sat: {farm.saturdayHours}</span>
                        )}
                        {selectedDay === 'sunday' && farm.sundayHours && (
                          <span>Sun: {farm.sundayHours}</span>
                        )}
                        {selectedDay === 'both' && (
                          <span>
                            {farm.saturdayHours && `Sat ${farm.saturdayHours}`}
                            {farm.saturdayHours && farm.sundayHours && ' | '}
                            {farm.sundayHours && `Sun ${farm.sundayHours}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-background-card rounded-xl border border-border-default">
            <Calendar className="w-12 h-12 mx-auto text-text-muted mb-3" />
            <h3 className="font-heading font-semibold text-text-heading mb-1">
              No weekend activities found
            </h3>
            <p className="text-caption text-text-muted mb-4">
              Check back later for upcoming farm events and markets
            </p>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Browse all farms
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* View all link */}
        {farms.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/map?filter=weekend"
              className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              View all weekend activities
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
