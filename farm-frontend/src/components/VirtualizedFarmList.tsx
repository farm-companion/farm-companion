'use client'

import React, { useRef, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { FarmShop } from '@/types/farm'

interface VirtualizedFarmListProps {
  farms: FarmShop[]
  className?: string
}

export default function VirtualizedFarmList({ farms, className = '' }: VirtualizedFarmListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: farms.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated height of each farm card
    overscan: 5, // Number of items to render outside viewport
  })

  // Memoized farm cards to prevent unnecessary re-renders
  const farmCards = useMemo(() => {
    return farms.map((farm) => (
      <Link
        key={farm.id}
        href={`/shop/${farm.slug}`}
        className="group bg-background-canvas rounded-xl p-4 border border-border-default/30 hover:border-serum/50 transition-all duration-200 hover:shadow-lg block"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-serum/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-serum" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-heading group-hover:text-serum transition-colors truncate">
              {farm.name}
            </h3>
            <p className="text-sm text-text-muted truncate">
              {farm.location?.county || 'UK'}
            </p>
            {farm.location?.postcode && (
              <p className="text-xs text-text-muted">
                {farm.location.postcode}
              </p>
            )}
          </div>
        </div>
      </Link>
    ))
  }, [farms])

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-bold text-text-heading">
          Farm Shops Directory
        </h2>
        <div className="text-sm text-text-muted">
          {farms.length} farm{farms.length !== 1 ? 's' : ''} found
        </div>
      </div>
      
      {/* Virtualized list container */}
      <div
        ref={parentRef}
        className="h-96 overflow-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="p-2"
            >
              {farmCards[virtualRow.index]}
            </div>
          ))}
        </div>
      </div>
      
      {/* Show more farms link */}
      {farms.length > 50 && (
        <div className="mt-6 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-serum hover:text-serum/80 font-medium transition-colors"
          >
            View all farm shops
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
