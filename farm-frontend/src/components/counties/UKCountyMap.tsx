'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface CountyData {
  name: string
  slug: string
  farmCount: number
}

interface UKCountyMapProps {
  counties: CountyData[]
  className?: string
}

// Simplified UK regions with approximate SVG paths
// These are stylized representations for visual appeal
const UK_REGIONS: Record<string, { path: string; center: [number, number] }> = {
  // Scotland
  'highland': { path: 'M120 20 L180 30 L190 80 L150 100 L100 90 L90 50 Z', center: [140, 60] },
  'aberdeenshire': { path: 'M180 70 L220 60 L230 100 L200 120 L170 100 Z', center: [200, 90] },
  'perthshire': { path: 'M130 100 L170 95 L180 130 L150 150 L120 130 Z', center: [150, 120] },
  'fife': { path: 'M170 130 L200 125 L210 145 L185 155 L165 145 Z', center: [185, 140] },
  'lothian': { path: 'M150 150 L185 145 L190 170 L160 180 L145 165 Z', center: [165, 162] },
  'borders': { path: 'M145 175 L190 170 L200 210 L160 220 L140 195 Z', center: [170, 195] },
  'dumfries': { path: 'M100 190 L145 185 L155 230 L110 240 L90 215 Z', center: [120, 210] },

  // Northern England
  'northumberland': { path: 'M160 210 L200 200 L215 250 L180 265 L155 240 Z', center: [185, 235] },
  'cumbria': { path: 'M110 240 L155 235 L165 290 L125 305 L100 270 Z', center: [130, 270] },
  'durham': { path: 'M165 255 L210 245 L220 285 L185 295 L160 275 Z', center: [190, 270] },
  'north-yorkshire': { path: 'M165 290 L220 280 L235 340 L185 355 L155 320 Z', center: [195, 315] },
  'lancashire': { path: 'M120 300 L160 295 L170 345 L135 360 L110 330 Z', center: [140, 325] },
  'west-yorkshire': { path: 'M160 340 L200 335 L210 370 L175 380 L155 360 Z', center: [180, 355] },
  'east-yorkshire': { path: 'M200 330 L250 320 L260 365 L220 380 L195 355 Z', center: [225, 350] },

  // Midlands
  'cheshire': { path: 'M115 355 L155 350 L165 395 L130 405 L105 380 Z', center: [135, 375] },
  'derbyshire': { path: 'M155 375 L195 370 L205 415 L170 425 L150 400 Z', center: [175, 395] },
  'nottinghamshire': { path: 'M195 385 L235 380 L245 425 L210 435 L190 410 Z', center: [215, 405] },
  'lincolnshire': { path: 'M235 370 L280 360 L295 430 L255 445 L230 405 Z', center: [260, 400] },
  'staffordshire': { path: 'M130 400 L170 395 L180 440 L145 450 L120 425 Z', center: [150, 420] },
  'leicestershire': { path: 'M185 425 L225 420 L235 465 L200 475 L180 450 Z', center: [205, 445] },
  'warwickshire': { path: 'M155 445 L190 440 L200 485 L165 495 L150 470 Z', center: [175, 465] },
  'west-midlands': { path: 'M130 440 L160 435 L170 475 L140 485 L125 460 Z', center: [145, 460] },
  'northamptonshire': { path: 'M200 465 L245 460 L255 505 L215 515 L195 490 Z', center: [225, 485] },
  'cambridgeshire': { path: 'M245 450 L290 445 L300 500 L260 510 L240 480 Z', center: [270, 475] },
  'norfolk': { path: 'M280 420 L340 410 L350 470 L300 485 L275 450 Z', center: [310, 445] },
  'suffolk': { path: 'M290 480 L345 470 L355 525 L310 535 L285 505 Z', center: [320, 500] },

  // South & South East
  'gloucestershire': { path: 'M115 480 L155 475 L165 525 L130 535 L110 505 Z', center: [135, 505] },
  'oxfordshire': { path: 'M165 490 L210 485 L220 535 L180 545 L160 515 Z', center: [190, 515] },
  'buckinghamshire': { path: 'M210 510 L250 505 L260 550 L225 560 L205 535 Z', center: [230, 530] },
  'hertfordshire': { path: 'M250 495 L290 490 L300 535 L265 545 L245 520 Z', center: [270, 515] },
  'essex': { path: 'M290 515 L345 505 L360 565 L315 575 L285 545 Z', center: [320, 540] },
  'berkshire': { path: 'M180 545 L225 540 L235 580 L195 590 L175 565 Z', center: [205, 565] },
  'surrey': { path: 'M225 565 L270 560 L280 600 L240 610 L220 585 Z', center: [250, 585] },
  'kent': { path: 'M280 570 L350 560 L365 620 L305 635 L275 600 Z', center: [320, 595] },
  'hampshire': { path: 'M150 570 L195 565 L205 620 L165 630 L145 600 Z', center: [175, 595] },
  'west-sussex': { path: 'M200 610 L250 605 L260 645 L220 655 L195 630 Z', center: [225, 625] },
  'east-sussex': { path: 'M255 615 L310 605 L325 655 L275 665 L250 640 Z', center: [285, 635] },

  // South West
  'wiltshire': { path: 'M120 540 L160 535 L170 590 L135 600 L115 565 Z', center: [140, 565] },
  'dorset': { path: 'M100 590 L145 585 L155 640 L115 650 L95 620 Z', center: [125, 615] },
  'somerset': { path: 'M70 545 L115 540 L125 600 L85 610 L65 575 Z', center: [95, 575] },
  'devon': { path: 'M30 580 L80 570 L95 650 L50 665 L25 620 Z', center: [60, 615] },
  'cornwall': { path: 'M0 620 L45 610 L60 680 L20 695 L-5 655 Z', center: [30, 650] },

  // Wales
  'gwynedd': { path: 'M50 320 L95 310 L110 370 L70 385 L45 350 Z', center: [75, 345] },
  'powys': { path: 'M70 380 L115 370 L130 450 L90 465 L65 420 Z', center: [95, 415] },
  'dyfed': { path: 'M25 420 L75 410 L90 490 L45 505 L20 460 Z', center: [55, 455] },
  'glamorgan': { path: 'M55 490 L105 480 L120 540 L75 555 L50 520 Z', center: [85, 515] },
}

// Map county names to region keys
const COUNTY_TO_REGION: Record<string, string> = {
  'Highland': 'highland',
  'Aberdeenshire': 'aberdeenshire',
  'Perth and Kinross': 'perthshire',
  'Perthshire': 'perthshire',
  'Fife': 'fife',
  'Edinburgh': 'lothian',
  'Lothian': 'lothian',
  'Scottish Borders': 'borders',
  'Dumfries and Galloway': 'dumfries',
  'Northumberland': 'northumberland',
  'Cumbria': 'cumbria',
  'County Durham': 'durham',
  'Durham': 'durham',
  'North Yorkshire': 'north-yorkshire',
  'Lancashire': 'lancashire',
  'West Yorkshire': 'west-yorkshire',
  'East Riding of Yorkshire': 'east-yorkshire',
  'East Yorkshire': 'east-yorkshire',
  'Cheshire': 'cheshire',
  'Derbyshire': 'derbyshire',
  'Nottinghamshire': 'nottinghamshire',
  'Lincolnshire': 'lincolnshire',
  'Staffordshire': 'staffordshire',
  'Leicestershire': 'leicestershire',
  'Warwickshire': 'warwickshire',
  'West Midlands': 'west-midlands',
  'Northamptonshire': 'northamptonshire',
  'Cambridgeshire': 'cambridgeshire',
  'Norfolk': 'norfolk',
  'Suffolk': 'suffolk',
  'Gloucestershire': 'gloucestershire',
  'Oxfordshire': 'oxfordshire',
  'Buckinghamshire': 'buckinghamshire',
  'Hertfordshire': 'hertfordshire',
  'Essex': 'essex',
  'Berkshire': 'berkshire',
  'Surrey': 'surrey',
  'Kent': 'kent',
  'Hampshire': 'hampshire',
  'West Sussex': 'west-sussex',
  'East Sussex': 'east-sussex',
  'Wiltshire': 'wiltshire',
  'Dorset': 'dorset',
  'Somerset': 'somerset',
  'Devon': 'devon',
  'Cornwall': 'cornwall',
  'Gwynedd': 'gwynedd',
  'Powys': 'powys',
  'Dyfed': 'dyfed',
  'Carmarthenshire': 'dyfed',
  'Pembrokeshire': 'dyfed',
  'Glamorgan': 'glamorgan',
  'South Glamorgan': 'glamorgan',
  'Vale of Glamorgan': 'glamorgan',
}

/**
 * Get fill color based on farm count density
 */
function getDensityColor(count: number): string {
  if (count === 0) return '#f1f5f9' // slate-100
  if (count <= 5) return '#bbf7d0' // green-200
  if (count <= 15) return '#86efac' // green-300
  if (count <= 30) return '#4ade80' // green-400
  if (count <= 50) return '#22c55e' // green-500
  return '#16a34a' // green-600
}

/**
 * UKCountyMap Component
 *
 * Interactive SVG map of UK showing farm shop density by region.
 * Clickable regions navigate to county pages.
 */
export function UKCountyMap({ counties, className = '' }: UKCountyMapProps) {
  const router = useRouter()
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [tooltipData, setTooltipData] = useState<{ name: string; count: number; x: number; y: number } | null>(null)

  // Build region data from counties
  const regionData = useMemo(() => {
    const data: Record<string, { name: string; slug: string; count: number }> = {}

    counties.forEach(county => {
      const regionKey = COUNTY_TO_REGION[county.name]
      if (regionKey) {
        if (!data[regionKey]) {
          data[regionKey] = { name: county.name, slug: county.slug, count: 0 }
        }
        data[regionKey].count += county.farmCount
      }
    })

    return data
  }, [counties])

  const handleRegionClick = (regionKey: string) => {
    const region = regionData[regionKey]
    if (region) {
      router.push(`/counties/${region.slug}`)
    }
  }

  const handleRegionHover = (regionKey: string | null, event?: React.MouseEvent) => {
    setHoveredRegion(regionKey)
    if (regionKey && event) {
      const region = regionData[regionKey]
      if (region) {
        const rect = (event.target as SVGElement).getBoundingClientRect()
        setTooltipData({
          name: region.name,
          count: region.count,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        })
      }
    } else {
      setTooltipData(null)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 380 720"
        className="w-full max-w-md mx-auto"
        style={{ maxHeight: '600px' }}
      >
        {/* Background */}
        <rect x="0" y="0" width="380" height="720" fill="#f8fafc" rx="8" />

        {/* Sea indication */}
        <rect x="0" y="0" width="380" height="720" fill="#e0f2fe" rx="8" opacity="0.5" />

        {/* Render all regions */}
        {Object.entries(UK_REGIONS).map(([key, region]) => {
          const data = regionData[key]
          const isHovered = hoveredRegion === key
          const fillColor = data ? getDensityColor(data.count) : '#e2e8f0'

          return (
            <g key={key}>
              <path
                d={region.path}
                fill={fillColor}
                stroke={isHovered ? '#0f766e' : '#94a3b8'}
                strokeWidth={isHovered ? 2 : 1}
                className="cursor-pointer transition-all duration-200"
                style={{
                  filter: isHovered ? 'brightness(1.1)' : 'none',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: `${region.center[0]}px ${region.center[1]}px`,
                }}
                onClick={() => handleRegionClick(key)}
                onMouseEnter={(e) => handleRegionHover(key, e)}
                onMouseLeave={() => handleRegionHover(null)}
              />
              {/* Region label for larger regions */}
              {data && data.count > 0 && (
                <text
                  x={region.center[0]}
                  y={region.center[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[8px] font-bold fill-slate-700 pointer-events-none select-none"
                >
                  {data.count}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="fixed z-50 px-3 py-2 bg-slate-900 text-white text-small rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipData.x, top: tooltipData.y }}
        >
          <p className="font-semibold">{tooltipData.name}</p>
          <p className="text-slate-300">
            {tooltipData.count} farm {tooltipData.count === 1 ? 'shop' : 'shops'}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-small">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: '#bbf7d0' }} />
          <span className="text-slate-600">1-5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: '#4ade80' }} />
          <span className="text-slate-600">6-30</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: '#16a34a' }} />
          <span className="text-slate-600">30+</span>
        </div>
      </div>
    </div>
  )
}
