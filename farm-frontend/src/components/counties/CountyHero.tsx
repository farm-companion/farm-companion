'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { MapPin, Store, Star, Leaf, ArrowRight } from 'lucide-react'
import { getProduceInSeason, getCurrentMonth, getMonthName } from '@/lib/seasonal-utils'

interface CountyStats {
  total: number
  verified?: number
  averageRating?: number
  categories?: string[]
}

interface CountyHeroProps {
  countyName: string
  slug: string
  stats: CountyStats
  className?: string
}

/**
 * CountyHero Component
 *
 * Enhanced hero section for county landing pages featuring:
 * - County name with farm count
 * - Key stats (verified, rating)
 * - What's in season now
 * - Quick action buttons
 */
export function CountyHero({ countyName, slug, stats, className = '' }: CountyHeroProps) {
  // Get seasonal produce for current month
  const currentMonth = getCurrentMonth()
  const monthName = getMonthName(currentMonth)
  const seasonalProduce = useMemo(() => {
    return getProduceInSeason(currentMonth).slice(0, 4)
  }, [currentMonth])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-emerald-900" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="county-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#county-pattern)" />
        </svg>
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Main content */}
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-primary-200 text-small mb-4">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/counties" className="hover:text-white transition-colors">Counties</Link>
              <span>/</span>
              <span className="text-white font-medium">{countyName}</span>
            </nav>

            {/* County name */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Farm Shops in
              <span className="block text-primary-300">{countyName}</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-primary-100 mb-6 max-w-xl">
              Discover {stats.total} local farm shops and producers. Support local farmers and enjoy fresh, seasonal produce.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full">
                <Store className="w-5 h-5 text-primary-300" />
                <span className="text-white font-semibold">{stats.total}</span>
                <span className="text-primary-200">Farms</span>
              </div>

              {stats.verified && stats.verified > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur rounded-full">
                  <span className="text-emerald-300 font-semibold">{stats.verified}</span>
                  <span className="text-emerald-200">Verified</span>
                </div>
              )}

              {stats.averageRating && stats.averageRating > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur rounded-full">
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span className="text-amber-200">{stats.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/map?county=${encodeURIComponent(countyName)}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-900 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                View on Map
              </Link>
              <a
                href="#farms"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                Browse Farms
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right: What's in season */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-5 h-5 text-emerald-300" />
              <h2 className="text-lg font-semibold text-white">
                In Season Now - {monthName}
              </h2>
            </div>

            {seasonalProduce.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {seasonalProduce.map(produce => (
                  <Link
                    key={produce.slug}
                    href={`/seasonal/${produce.slug}`}
                    className="group flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    {produce.images?.[0]?.src && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                        <img
                          src={produce.images[0].src}
                          alt={produce.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate group-hover:text-primary-200 transition-colors">
                        {produce.name}
                      </p>
                      <p className="text-small text-primary-300">
                        {produce.seasonStatus === 'peak' && '⭐ Peak season'}
                        {produce.seasonStatus === 'starting' && '🌱 Just started'}
                        {produce.seasonStatus === 'in-season' && 'In season'}
                        {produce.seasonStatus === 'ending' && '⏳ Ending soon'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-primary-200">
                Check back soon for seasonal produce updates.
              </p>
            )}

            <Link
              href="/seasonal"
              className="inline-flex items-center gap-1 mt-4 text-small text-primary-200 hover:text-white transition-colors"
            >
              View all seasonal produce
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
