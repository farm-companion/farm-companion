'use client'

import React from 'react'
import Image from 'next/image'
import { MapPin, Navigation, CheckCircle, Clock, Camera } from 'lucide-react'
import type { FarmShop } from '@/types/farm'

interface FarmCardProps {
  farm: FarmShop
  onSelect: (farm: FarmShop) => void
  onDirections: (farm: FarmShop) => void
  selected?: boolean
}

export function FarmCard({ farm, onSelect, onDirections, selected = false }: FarmCardProps) {
  const hasPhotos = farm.images && farm.images.length > 0
  const isOpenNow = false // TODO: Implement open/closed logic based on hours array
  const isVerified = farm.verified || false

  return (
    <article 
      className={`group rounded-2xl border border-border-default/40 bg-background-surface hover:shadow-premium transition-all duration-200 overflow-hidden ${
        selected ? 'ring-2 ring-primary-500 ring-offset-0' : ''
      }`}
    >
      <div className="flex gap-3 p-4">
        {/* Thumbnail */}
        <div className="h-14 w-14 rounded-xl bg-background-canvas overflow-hidden flex-shrink-0">
          {hasPhotos ? (
            <Image 
              src={farm.images![0]} 
              alt={`${farm.name} photo`} 
              width={56}
              height={56}
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-background-canvas/50">
              <MapPin className="h-6 w-6 text-text-muted" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-text-heading group-hover:text-primary-600 transition-colors">
            {farm.name}
          </h3>
          <p className="truncate text-sm text-text-muted">
            {farm.location?.county || 'UK'}
          </p>
          
          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
            {isOpenNow && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                <Clock className="h-3 w-3" />
                Open now
              </span>
            )}
            {hasPhotos && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                <Camera className="h-3 w-3" />
                Photos
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => onSelect(farm)}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            View
          </button>
          <button 
            onClick={() => onDirections(farm)}
            className="px-3 py-1.5 text-sm rounded-md border border-border-default/50 hover:bg-background-canvas/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
