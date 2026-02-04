'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { MapPin, ChevronRight, Leaf } from 'lucide-react'
import { Virtuoso } from 'react-virtuoso'
import type { FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { formatOpeningStatus } from '@/lib/opening-hours'

interface FarmListProps {
  farms: FarmShop[]
  selectedFarmId?: string | null
  hoveredFarmId?: string | null
  onFarmSelect: (farmId: string) => void
  onFarmHover?: (farmId: string | null) => void
  className?: string
  userLocation?: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: number
  } | null
  formatDistance?: (distance: number) => string
}

export default function FarmList({
  farms,
  selectedFarmId,
  hoveredFarmId,
  onFarmSelect,
  onFarmHover,
  className = '',
  formatDistance
}: FarmListProps) {
  const handleFarmClick = useCallback((farmId: string) => {
    onFarmSelect(farmId)
  }, [onFarmSelect])

  const FarmCard = useCallback(({ farm }: { farm: FarmShop; index: number }) => {
    const isSelected = selectedFarmId === farm.id
    const isHovered = hoveredFarmId === farm.id
    const hasHours = farm.hours && farm.hours.length > 0
    const hasDistance = farm.distance !== undefined && formatDistance
    const openingStatus = hasHours ? formatOpeningStatus(farm.hours!) : null
    const heroImage = farm.images?.[0] ? getImageUrl(farm.images[0]) : undefined
    const hook = farm.description ? farm.description.slice(0, 100) : undefined

    // Build distance + status line
    const metaParts: string[] = []
    if (hasDistance) metaParts.push(formatDistance(farm.distance!))
    if (openingStatus) {
      if (openingStatus.isOpen) {
        metaParts.push('Open now')
      } else if (openingStatus.nextOpening) {
        metaParts.push(openingStatus.nextOpening)
      } else {
        metaParts.push('Closed')
      }
    }

    return (
      <div
        data-farm-id={farm.id}
        className={`mx-3 my-1.5 p-4 rounded-xl border cursor-pointer transition-all duration-150
          ${isSelected
            ? 'border-[#2D5016] shadow-[0_2px_8px_rgba(0,0,0,0.08)] bg-[#2D5016]/[0.03]'
            : isHovered
              ? 'border-[#2D5016] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
              : 'border-[#EDEDED] hover:border-[#2D5016] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
          }`}
        onClick={() => handleFarmClick(farm.id)}
        onMouseEnter={() => onFarmHover?.(farm.id)}
        onMouseLeave={() => onFarmHover?.(null)}
        role="button"
        tabIndex={0}
        aria-label={`View ${farm.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleFarmClick(farm.id)
          }
        }}
      >
        <div className="flex gap-3">
          {/* Thumbnail */}
          <div className="w-[72px] h-[72px] rounded-lg bg-[#F5F5F5] dark:bg-gray-800 flex-shrink-0 overflow-hidden">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={farm.name}
                width={72}
                height={72}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="72px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-[#CCCCCC]" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-medium text-[#1A1A1A] dark:text-white truncate">
              {farm.name}
            </h3>

            {/* Distance + Status */}
            <p className={`text-sm mt-0.5 ${
              openingStatus && !openingStatus.isOpen ? 'text-[#8C8C8C]' : 'text-[#8C8C8C]'
            }`}>
              {metaParts.length > 0 ? metaParts.join(' \u00B7 ') : farm.location.county}
              {openingStatus && !openingStatus.isOpen && (
                <span className="text-[#CC0000]"> {openingStatus.status === 'Closed' && !openingStatus.nextOpening ? '\u00B7 Closed today' : ''}</span>
              )}
            </p>

            {/* Hook / editorial description */}
            {hook && (
              <p className="text-sm italic text-[#5C5C5C] dark:text-gray-400 mt-1 line-clamp-2">
                &ldquo;{hook}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Tags + arrow row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-1">
            {farm.offerings?.slice(0, 2).map((offering, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 bg-[#2D5016]/10 text-[#2D5016] text-[11px] font-semibold rounded-full uppercase tracking-wide"
              >
                {offering}
              </span>
            ))}
            {farm.offerings && farm.offerings.length > 2 && (
              <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-[#8C8C8C] text-[11px] font-semibold rounded-full">
                +{farm.offerings.length - 2}
              </span>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-[#CCCCCC] flex-shrink-0" />
        </div>
      </div>
    )
  }, [selectedFarmId, hoveredFarmId, handleFarmClick, onFarmHover, formatDistance])

  const EmptyState = useCallback(() => (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <MapPin className="w-10 h-10 text-[#CCCCCC] mb-3" />
      <h3 className="text-[17px] font-medium text-[#1A1A1A] dark:text-white mb-1">No farms found</h3>
      <p className="text-sm text-[#8C8C8C]">
        Try adjusting your search or filters to find farm shops in your area.
      </p>
    </div>
  ), [])

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 overflow-hidden">
        {farms.length === 0 ? (
          <EmptyState />
        ) : (
          <Virtuoso
            data={farms}
            itemContent={(index, farm) => <FarmCard farm={farm} index={index} />}
            overscan={5}
            className="h-full"
            components={{
              Footer: () => <div className="h-4" />
            }}
          />
        )}
      </div>
    </div>
  )
}
