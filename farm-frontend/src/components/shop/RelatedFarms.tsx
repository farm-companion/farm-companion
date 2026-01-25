'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, ArrowRight, Store } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { isCurrentlyOpen } from '@/lib/farm-status'

interface RelatedFarmsProps {
  /** Current farm to find related farms for */
  currentFarm: FarmShop
  /** List of all farms to search through */
  allFarms: FarmShop[]
  /** Maximum farms to show */
  limit?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Calculate similarity score between two farms
 * Higher score = more similar
 */
function calculateSimilarity(farm1: FarmShop, farm2: FarmShop): number {
  let score = 0

  // Same county is a strong signal
  if (farm1.location.county === farm2.location.county) {
    score += 30
  }

  // Same city is even stronger
  if (farm1.location.city && farm2.location.city && farm1.location.city === farm2.location.city) {
    score += 20
  }

  // Overlapping offerings
  if (farm1.offerings && farm2.offerings) {
    const overlap = farm1.offerings.filter(o =>
      farm2.offerings?.some(o2 => o.toLowerCase() === o2.toLowerCase())
    ).length
    score += overlap * 10
  }

  // Similar rating tier
  if (farm1.rating && farm2.rating) {
    const ratingDiff = Math.abs(farm1.rating - farm2.rating)
    if (ratingDiff < 0.5) score += 15
    else if (ratingDiff < 1) score += 10
  }

  // Both verified
  if (farm1.verified && farm2.verified) {
    score += 5
  }

  // Overlapping amenities
  if (farm1.amenities && farm2.amenities) {
    const amenityOverlap = farm1.amenities.filter(a =>
      farm2.amenities?.includes(a)
    ).length
    score += amenityOverlap * 5
  }

  return score
}

/**
 * Find related farms based on similarity
 */
function findRelatedFarms(
  currentFarm: FarmShop,
  allFarms: FarmShop[],
  limit: number
): FarmShop[] {
  return allFarms
    .filter(f => f.id !== currentFarm.id) // Exclude current farm
    .map(farm => ({
      farm,
      score: calculateSimilarity(currentFarm, farm)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ farm }) => farm)
}

/**
 * RelatedFarms Component
 *
 * Shows farms similar to the current one based on:
 * - Same county/city
 * - Similar offerings
 * - Similar rating tier
 * - Shared amenities
 */
export function RelatedFarms({
  currentFarm,
  allFarms,
  limit = 3,
  className = '',
}: RelatedFarmsProps) {
  const relatedFarms = findRelatedFarms(currentFarm, allFarms, limit)

  if (relatedFarms.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <Store className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-body font-semibold dark:font-medium text-slate-900 dark:text-zinc-50">
            Similar Farms
          </h3>
        </div>
        <Link
          href={`/shop?county=${encodeURIComponent(currentFarm.location.county)}`}
          className="text-small text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium dark:font-normal transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Farm Cards */}
      <div className="space-y-3">
        {relatedFarms.map((farm) => (
          <RelatedFarmCard key={farm.id} farm={farm} />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual farm card for related farms
 */
function RelatedFarmCard({ farm }: { farm: FarmShop }) {
  const imageUrl = getImageUrl(farm.images?.[0])
  const isOpen = isCurrentlyOpen(farm.hours)

  return (
    <Link
      href={`/shop/${farm.slug}`}
      className="
        group flex items-center gap-3 p-3
        bg-white dark:bg-[#121214]
        border border-slate-200 dark:border-white/[0.08]
        rounded-xl
        hover:border-primary-200 dark:hover:border-primary-800
        hover:shadow-sm dark:hover:shadow-none
        transition-all
      "
    >
      {/* Image */}
      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/[0.04]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={farm.name}
            fill
            sizes="64px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-slate-300 dark:text-zinc-700" />
          </div>
        )}

        {/* Status indicator */}
        <div
          className={`
            absolute top-1 right-1 w-2 h-2 rounded-full
            ${isOpen
              ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]'
              : 'bg-slate-400'
            }
          `}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-caption font-semibold dark:font-medium text-slate-900 dark:text-zinc-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {farm.name}
        </h4>

        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1 text-small text-slate-500 dark:text-zinc-500">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{farm.location.city || farm.location.county}</span>
          </div>

          {farm.rating && (
            <>
              <span className="text-slate-300 dark:text-zinc-700">·</span>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-small font-medium text-slate-700 dark:text-zinc-300">
                  {farm.rating.toFixed(1)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Offerings preview */}
        {farm.offerings && farm.offerings.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {farm.offerings.slice(0, 2).map((offering) => (
              <span
                key={offering}
                className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/[0.06] text-[10px] font-medium text-slate-600 dark:text-zinc-400 rounded"
              >
                {offering}
              </span>
            ))}
            {farm.offerings.length > 2 && (
              <span className="text-[10px] text-slate-400 dark:text-zinc-600">
                +{farm.offerings.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-zinc-700 group-hover:text-primary-500 dark:group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  )
}

/**
 * Nearby farms variant (based on distance)
 */
export function NearbyFarmsCompact({
  farms,
  limit = 3,
  className = '',
}: {
  farms: FarmShop[]
  limit?: number
  className?: string
}) {
  const nearbyFarms = farms
    .filter(f => f.distance !== undefined)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, limit)

  if (nearbyFarms.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      <h4 className="text-caption font-medium text-slate-500 dark:text-zinc-500 mb-3">
        Also nearby
      </h4>
      <div className="space-y-2">
        {nearbyFarms.map((farm) => (
          <Link
            key={farm.id}
            href={`/shop/${farm.slug}`}
            className="flex items-center justify-between py-2 group"
          >
            <span className="text-caption text-slate-700 dark:text-zinc-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
              {farm.name}
            </span>
            {farm.distance !== undefined && (
              <span className="text-small text-slate-400 dark:text-zinc-500 flex-shrink-0 ml-2">
                {farm.distance < 1
                  ? `${Math.round(farm.distance * 1000)}m`
                  : `${farm.distance.toFixed(1)}km`
                }
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
