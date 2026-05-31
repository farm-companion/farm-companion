'use client'

import { useCallback, useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { Virtuoso, type VirtuosoHandle, type ListRange } from 'react-virtuoso'
import type { FarmShop } from '@/types/farm'
import FarmListCard from '@/components/FarmListCard'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <MapPin className="mb-4 h-10 w-10 text-ink-subtle" aria-hidden />
      <h3 className="mb-1.5 font-clash text-xl font-semibold tracking-tight text-ink">
        No farms found
      </h3>
      <p className="max-w-[36ch] font-body text-sm leading-relaxed text-ink-muted">
        Try adjusting your search or filters to find farm shops in your area.
      </p>
    </div>
  )
}

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
  formatDistance,
}: FarmListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const rangeRef = useRef<ListRange>({ startIndex: 0, endIndex: 0 })

  // Map -> list sync: when a farm is hovered or selected on the map, bring its
  // card into view. Only scroll when the card is OUTSIDE the rendered range, so
  // hovering a card already on screen never yanks the scroll position (no
  // feedback loop). Shared by desktop panel and mobile bottom sheet alike;
  // because the list is virtualised, a DOM scrollIntoView would miss off-screen
  // cards, so we drive Virtuoso's scrollToIndex instead.
  useEffect(() => {
    const targetId = hoveredFarmId ?? selectedFarmId
    if (!targetId) return
    const index = farms.findIndex((f) => f.id === targetId)
    if (index < 0) return
    const { startIndex, endIndex } = rangeRef.current
    if (index < startIndex || index > endIndex) {
      virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'smooth' })
    }
  }, [hoveredFarmId, selectedFarmId, farms])

  const handleFarmClick = useCallback(
    (farmId: string) => {
      onFarmSelect(farmId)
    },
    [onFarmSelect]
  )

  const renderCard = useCallback(
    (_index: number, farm: FarmShop) => (
      <FarmListCard
        farm={farm}
        isSelected={selectedFarmId === farm.id}
        isHovered={hoveredFarmId === farm.id}
        onSelect={handleFarmClick}
        onHover={onFarmHover}
        formatDistance={formatDistance}
      />
    ),
    [selectedFarmId, hoveredFarmId, handleFarmClick, onFarmHover, formatDistance]
  )

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="flex-1 overflow-hidden">
        {farms.length === 0 ? (
          <EmptyState />
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={farms}
            itemContent={renderCard}
            overscan={5}
            rangeChanged={(range) => {
              rangeRef.current = range
            }}
            className="h-full"
            components={{
              Footer: () => <div className="h-4" />,
            }}
          />
        )}
      </div>
    </div>
  )
}
