'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Award, MapPin, ArrowRight } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'

interface CuratorsChoiceProps {
  farms: FarmShop[]
  countyName: string
  className?: string
}

/**
 * CuratorsChoice Component
 *
 * Highlights top-rated or featured farm shops in a county.
 * Shows a curated selection with premium visual treatment.
 */
export function CuratorsChoice({ farms, countyName, className = '' }: CuratorsChoiceProps) {
  // Select top farms based on rating and verified status
  const featuredFarms = farms
    .filter(f => f.rating && f.rating >= 4.0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3)

  if (featuredFarms.length === 0) {
    return null
  }

  return (
    <section className={`bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-6 md:p-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Curator&apos;s Choice
          </h2>
          <p className="text-small text-slate-600 dark:text-slate-400">
            Top-rated farm shops in {countyName}
          </p>
        </div>
      </div>

      {/* Featured farms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {featuredFarms.map((farm, index) => (
          <FeaturedFarmCard key={farm.id} farm={farm} rank={index + 1} />
        ))}
      </div>

      {/* View all link */}
      <div className="mt-6 text-center">
        <Link
          href="#farms"
          className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium transition-colors"
        >
          View all {farms.length} farms in {countyName}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

interface FeaturedFarmCardProps {
  farm: FarmShop
  rank: number
}

function FeaturedFarmCard({ farm, rank }: FeaturedFarmCardProps) {
  const imageUrl = getImageUrl(farm.images?.[0])

  return (
    <Link
      href={`/shop/${farm.slug}`}
      className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
    >
      {/* Rank badge - uses dark text on amber for WCAG AA compliance */}
      <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-amber-500 text-amber-950 font-bold flex items-center justify-center shadow-lg">
        {rank}
      </div>

      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={farm.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Rating badge */}
        {farm.rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-small font-semibold text-slate-900 dark:text-slate-100">
              {farm.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
          {farm.name}
        </h3>

        <div className="flex items-center gap-1 text-small text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">
            {farm.location?.city || farm.location?.county}
          </span>
        </div>

        {/* Offerings preview */}
        {farm.offerings && farm.offerings.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {farm.offerings.slice(0, 2).map((offering: string) => (
              <span
                key={offering}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 rounded-full"
              >
                {offering}
              </span>
            ))}
            {farm.offerings.length > 2 && (
              <span className="text-[10px] text-slate-400">
                +{farm.offerings.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

/**
 * Compact curator's choice for sidebar
 */
export function CuratorsChoiceCompact({ farms, className = '' }: Omit<CuratorsChoiceProps, 'countyName'>) {
  const topFarm = farms
    .filter(f => f.rating && f.rating >= 4.0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]

  if (!topFarm) return null

  const imageUrl = getImageUrl(topFarm.images?.[0])

  return (
    <div className={`bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-amber-600" />
        <span className="text-small font-semibold text-amber-800 dark:text-amber-300">
          Top Rated
        </span>
      </div>

      <Link href={`/shop/${topFarm.slug}`} className="group flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={topFarm.name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary-600 transition-colors truncate">
            {topFarm.name}
          </p>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-small text-slate-600 dark:text-slate-400">
              {topFarm.rating?.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}
