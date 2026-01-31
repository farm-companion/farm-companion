'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Region {
  id: string
  name: string
  counties: string[]
  farmCount?: number
  position: { top: string; left: string }
}

const UK_REGIONS: Region[] = [
  {
    id: 'scotland',
    name: 'Scotland',
    counties: ['highlands', 'lowlands', 'borders'],
    farmCount: 45,
    position: { top: '8%', left: '45%' },
  },
  {
    id: 'north-east',
    name: 'North East',
    counties: ['northumberland', 'durham', 'tyne-and-wear'],
    farmCount: 32,
    position: { top: '28%', left: '55%' },
  },
  {
    id: 'north-west',
    name: 'North West',
    counties: ['cumbria', 'lancashire', 'greater-manchester', 'merseyside'],
    farmCount: 78,
    position: { top: '35%', left: '38%' },
  },
  {
    id: 'yorkshire',
    name: 'Yorkshire',
    counties: ['north-yorkshire', 'west-yorkshire', 'south-yorkshire', 'east-yorkshire'],
    farmCount: 92,
    position: { top: '38%', left: '52%' },
  },
  {
    id: 'midlands',
    name: 'Midlands',
    counties: ['west-midlands', 'east-midlands', 'warwickshire', 'staffordshire'],
    farmCount: 156,
    position: { top: '50%', left: '48%' },
  },
  {
    id: 'east-anglia',
    name: 'East Anglia',
    counties: ['norfolk', 'suffolk', 'cambridgeshire', 'essex'],
    farmCount: 124,
    position: { top: '52%', left: '68%' },
  },
  {
    id: 'wales',
    name: 'Wales',
    counties: ['north-wales', 'mid-wales', 'south-wales'],
    farmCount: 67,
    position: { top: '52%', left: '28%' },
  },
  {
    id: 'south-west',
    name: 'South West',
    counties: ['devon', 'cornwall', 'somerset', 'dorset', 'gloucestershire'],
    farmCount: 189,
    position: { top: '72%', left: '30%' },
  },
  {
    id: 'south-east',
    name: 'South East',
    counties: ['kent', 'surrey', 'sussex', 'hampshire', 'berkshire'],
    farmCount: 203,
    position: { top: '70%', left: '60%' },
  },
  {
    id: 'london',
    name: 'London',
    counties: ['greater-london'],
    farmCount: 28,
    position: { top: '62%', left: '58%' },
  },
]

interface RegionalRadarProps {
  onRegionSelect?: (regionId: string) => void
  selectedRegion?: string
  className?: string
  showFarmCounts?: boolean
  linkToCounties?: boolean
}

export function RegionalRadar({
  onRegionSelect,
  selectedRegion,
  className,
  showFarmCounts = true,
  linkToCounties = true,
}: RegionalRadarProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  const handleRegionClick = (region: Region) => {
    if (onRegionSelect) {
      onRegionSelect(region.id)
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Explore by Region
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Click a region to discover farm shops, markets, and local producers near you.
        </p>
      </div>

      {/* Map Container */}
      <div className="relative aspect-[3/4] max-w-md mx-auto">
        {/* UK Outline SVG */}
        <svg
          viewBox="0 0 200 280"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simplified UK outline */}
          <path
            d="M90 10 L110 15 L115 25 L105 40 L115 50 L110 70 L120 85 L115 100 L125 115 L120 130 L130 145 L125 160 L135 175 L130 190 L140 205 L130 220 L125 235 L115 245 L100 250 L90 245 L80 255 L65 250 L55 235 L60 220 L50 205 L55 190 L45 175 L50 160 L40 145 L50 130 L45 115 L55 100 L50 85 L60 70 L55 55 L65 40 L60 25 L70 15 L90 10"
            className="fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600"
            strokeWidth="1.5"
          />
          {/* Scotland */}
          <path
            d="M75 10 L95 8 L105 15 L100 30 L90 35 L85 25 L75 20 L75 10"
            className={cn(
              'transition-colors duration-200 cursor-pointer',
              hoveredRegion === 'scotland' || selectedRegion === 'scotland'
                ? 'fill-serum/30 stroke-serum'
                : 'fill-slate-200/50 dark:fill-slate-700/50 stroke-slate-400 dark:stroke-slate-500'
            )}
            strokeWidth="1"
            onMouseEnter={() => setHoveredRegion('scotland')}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleRegionClick(UK_REGIONS[0])}
          />
        </svg>

        {/* Region Hotspots */}
        {UK_REGIONS.map((region) => {
          const isHovered = hoveredRegion === region.id
          const isSelected = selectedRegion === region.id

          const content = (
            <div
              className={cn(
                'absolute transform -translate-x-1/2 -translate-y-1/2',
                'transition-all duration-200 cursor-pointer z-10'
              )}
              style={{ top: region.position.top, left: region.position.left }}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick(region)}
            >
              {/* Pulse ring */}
              <div
                className={cn(
                  'absolute inset-0 rounded-full',
                  'bg-serum/20 animate-ping',
                  isHovered || isSelected ? 'opacity-100' : 'opacity-0'
                )}
                style={{ width: '32px', height: '32px', margin: '-4px' }}
              />

              {/* Marker */}
              <div
                className={cn(
                  'relative w-6 h-6 rounded-full flex items-center justify-center',
                  'border-2 shadow-lg transition-all duration-200',
                  isHovered || isSelected
                    ? 'bg-serum border-serum scale-125 shadow-serum/30'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                )}
              >
                <MapPin
                  className={cn(
                    'w-3 h-3 transition-colors',
                    isHovered || isSelected
                      ? 'text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                />
              </div>

              {/* Tooltip */}
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 bottom-full mb-2',
                  'px-3 py-2 rounded-lg whitespace-nowrap',
                  'bg-white dark:bg-slate-800 shadow-xl',
                  'border border-slate-200 dark:border-slate-700',
                  'transition-all duration-200 origin-bottom',
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                )}
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {region.name}
                </p>
                {showFarmCounts && region.farmCount && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {region.farmCount} farms
                  </p>
                )}
                {/* Arrow */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-slate-800" />
              </div>
            </div>
          )

          if (linkToCounties) {
            return (
              <Link
                key={region.id}
                href={`/counties?region=${region.id}`}
                className="contents"
              >
                {content}
              </Link>
            )
          }

          return <div key={region.id}>{content}</div>
        })}
      </div>

      {/* Region List (Mobile Friendly) */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {UK_REGIONS.map((region) => {
          const isSelected = selectedRegion === region.id
          const Component = linkToCounties ? Link : 'button'
          const props = linkToCounties
            ? { href: `/counties?region=${region.id}` }
            : { onClick: () => handleRegionClick(region) }

          return (
            <Component
              key={region.id}
              {...(props as any)}
              className={cn(
                'group flex items-center justify-between p-3 rounded-xl',
                'border transition-all duration-200',
                isSelected
                  ? 'bg-serum/10 border-serum text-serum'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-serum/50 hover:bg-serum/5'
              )}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected
                    ? 'text-serum'
                    : 'text-slate-700 dark:text-slate-300 group-hover:text-serum'
                )}
              >
                {region.name}
              </span>
              <ChevronRight
                className={cn(
                  'w-4 h-4 transition-transform',
                  'text-slate-400 group-hover:text-serum group-hover:translate-x-0.5'
                )}
              />
            </Component>
          )
        })}
      </div>
    </div>
  )
}
