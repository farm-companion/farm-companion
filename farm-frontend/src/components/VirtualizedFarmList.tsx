'use client'

import React, { useRef, useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Virtuoso } from 'react-virtuoso'
import type { FarmShop } from '@/types/farm'
import { DirectoryHeader } from './DirectoryHeader'
import { FarmCard } from './FarmCard'
import { FarmListRow } from './FarmListRow'

interface VirtualizedFarmListProps {
  farms: FarmShop[]
  className?: string
  onSelectFarmId?: (farmId: string) => void
  selectedFarmId?: string | null
  isCameraMoving?: boolean
  onDirections?: (farm: FarmShop) => void
}

export default function VirtualizedFarmList({ 
  farms, 
  className = '', 
  onSelectFarmId,
  selectedFarmId,
  isCameraMoving = false,
  onDirections
}: VirtualizedFarmListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<'list' | 'cards'>('list')
  const [activeFilters, setActiveFilters] = useState<Array<{key: string, label: string}>>([])

  // Virtualization setup with fixed row height
  const rowVirtualizer = useVirtualizer({
    count: farms.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88, // Fixed height: 72px min-height + 16px padding (8px top + 8px bottom)
    overscan: 5, // Number of items to render outside viewport
  })

  // Handler functions
  const handleFilterOpen = () => {
    // TODO: Implement filter modal/sheet
    console.log('Open filters')
  }

  const handleClearFilter = (key: string) => {
    setActiveFilters(prev => prev.filter(f => f.key !== key))
  }

  const handleClearAll = () => {
    setActiveFilters([])
  }

  const handleSelectFarm = (farm: FarmShop) => {
    if (!isCameraMoving && onSelectFarmId) {
      onSelectFarmId(farm.id)
    }
  }

  const handleDirections = (farm: FarmShop) => {
    if (onDirections) {
      onDirections(farm)
    }
  }

  return (
    <div className={className}>
      {/* Directory Header */}
      <DirectoryHeader
        total={farms.length}
        view={view}
        setView={setView}
        onFilterOpen={handleFilterOpen}
        activeFilters={activeFilters}
        onClearFilter={handleClearFilter}
        onClearAll={handleClearAll}
      />
      
      {/* Content based on view mode */}
      {view === 'list' ? (
        /* List View - Virtualized */
        <div className="h-96 overflow-hidden">
          <Virtuoso
            data={farms}
            computeItemKey={(_, farm) => farm.id}
            increaseViewportBy={{ top: 200, bottom: 400 }}
            itemContent={(index, farm) => (
              <div className="p-2">
                <FarmListRow
                  farm={farm}
                  selected={selectedFarmId === farm.id}
                  onSelect={handleSelectFarm}
                  onDirections={handleDirections}
                />
              </div>
            )}
          />
        </div>
      ) : (
        /* Card View - Paginated Grid */
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.slice(0, 36).map((farm) => (
              <FarmCard
                key={farm.id}
                farm={farm}
                selected={selectedFarmId === farm.id}
                onSelect={handleSelectFarm}
                onDirections={handleDirections}
              />
            ))}
          </div>
          
          {/* Load more button for cards */}
          {farms.length > 36 && (
            <div className="mt-8 text-center">
              <button className="px-6 py-3 text-sm font-medium rounded-lg border border-border-default/50 hover:bg-background-canvas/60 transition-colors">
                Load more farms
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Show more farms link */}
      {farms.length > 50 && (
        <div className="mt-6 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            View all farm shops
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
