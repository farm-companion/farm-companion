'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react'

interface CountyData {
  name: string
  slug: string
  farmCount: number
}

interface RegionFilterProps {
  counties: CountyData[]
  selectedRegion: string | null
  onRegionSelect: (region: string | null) => void
  className?: string
}

// UK regions with their counties
const UK_REGIONS: Record<string, { label: string; counties: string[] }> = {
  scotland: {
    label: 'Scotland',
    counties: [
      'Highland', 'Aberdeenshire', 'Perth and Kinross', 'Perthshire', 'Fife',
      'Edinburgh', 'Lothian', 'Scottish Borders', 'Dumfries and Galloway',
      'Argyll and Bute', 'Stirling', 'Angus', 'Moray'
    ]
  },
  'north-england': {
    label: 'North England',
    counties: [
      'Northumberland', 'Cumbria', 'County Durham', 'Durham',
      'North Yorkshire', 'Lancashire', 'West Yorkshire', 'East Yorkshire',
      'East Riding of Yorkshire', 'South Yorkshire', 'Greater Manchester',
      'Merseyside', 'Tyne and Wear'
    ]
  },
  midlands: {
    label: 'Midlands',
    counties: [
      'Cheshire', 'Derbyshire', 'Nottinghamshire', 'Lincolnshire',
      'Staffordshire', 'Leicestershire', 'Warwickshire', 'West Midlands',
      'Shropshire', 'Herefordshire', 'Worcestershire', 'Northamptonshire',
      'Rutland'
    ]
  },
  'east-england': {
    label: 'East England',
    counties: [
      'Cambridgeshire', 'Norfolk', 'Suffolk', 'Essex', 'Hertfordshire',
      'Bedfordshire', 'Buckinghamshire'
    ]
  },
  'south-east': {
    label: 'South East',
    counties: [
      'Oxfordshire', 'Berkshire', 'Surrey', 'Kent', 'East Sussex',
      'West Sussex', 'Hampshire', 'Isle of Wight', 'London'
    ]
  },
  'south-west': {
    label: 'South West',
    counties: [
      'Gloucestershire', 'Wiltshire', 'Dorset', 'Somerset', 'Devon',
      'Cornwall', 'Bristol'
    ]
  },
  wales: {
    label: 'Wales',
    counties: [
      'Gwynedd', 'Powys', 'Dyfed', 'Carmarthenshire', 'Pembrokeshire',
      'Ceredigion', 'Glamorgan', 'South Glamorgan', 'Vale of Glamorgan',
      'Monmouthshire', 'Newport', 'Cardiff', 'Swansea', 'Wrexham', 'Flintshire'
    ]
  },
  'northern-ireland': {
    label: 'Northern Ireland',
    counties: [
      'Antrim', 'Armagh', 'Down', 'Fermanagh', 'Londonderry', 'Tyrone'
    ]
  }
}

/**
 * RegionFilter Component
 *
 * Collapsible sidebar filter for UK regions.
 * Shows farm counts per region and allows filtering.
 */
export function RegionFilter({
  counties,
  selectedRegion,
  onRegionSelect,
  className = '',
}: RegionFilterProps) {
  const [expandedRegions, setExpandedRegions] = useState<string[]>([])

  // Calculate farm counts per region
  const regionCounts = Object.entries(UK_REGIONS).map(([key, region]) => {
    const matchingCounties = counties.filter(c =>
      region.counties.some(rc =>
        rc.toLowerCase() === c.name.toLowerCase()
      )
    )
    const totalFarms = matchingCounties.reduce((sum, c) => sum + c.farmCount, 0)
    return {
      key,
      label: region.label,
      farmCount: totalFarms,
      countyCount: matchingCounties.length,
      counties: matchingCounties,
    }
  }).filter(r => r.farmCount > 0)

  const toggleExpand = (regionKey: string) => {
    setExpandedRegions(prev =>
      prev.includes(regionKey)
        ? prev.filter(r => r !== regionKey)
        : [...prev, regionKey]
    )
  }

  const totalFarms = counties.reduce((sum, c) => sum + c.farmCount, 0)

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-600" />
          Filter by Region
        </h3>
      </div>

      {/* All Regions option */}
      <button
        onClick={() => onRegionSelect(null)}
        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
          selectedRegion === null
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
        }`}
      >
        <span className="font-medium">All Regions</span>
        <span className="text-small text-slate-600 dark:text-slate-300">
          {totalFarms} farms
        </span>
      </button>

      {/* Region list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {regionCounts.map(region => {
          const isSelected = selectedRegion === region.key
          const isExpanded = expandedRegions.includes(region.key)

          return (
            <div key={region.key}>
              {/* Region header */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleExpand(region.key)}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => onRegionSelect(isSelected ? null : region.key)}
                  className={`flex-1 px-2 py-3 text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-medium">{region.label}</span>
                  <span className={`text-small ${isSelected ? 'text-primary-600' : 'text-slate-600 dark:text-slate-300'}`}>
                    {region.farmCount}
                  </span>
                </button>
              </div>

              {/* Expanded counties */}
              {isExpanded && region.counties.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 py-2">
                  {region.counties.map(county => (
                    <a
                      key={county.slug}
                      href={`/counties/${county.slug}`}
                      className="block px-10 py-1.5 text-small text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {county.name}
                      <span className="text-slate-500 dark:text-slate-400 ml-1">
                        ({county.farmCount})
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Compact region pills for mobile
 */
export function RegionPills({
  counties,
  selectedRegion,
  onRegionSelect,
  className = '',
}: RegionFilterProps) {
  // Calculate farm counts per region
  const regionCounts = Object.entries(UK_REGIONS).map(([key, region]) => {
    const matchingCounties = counties.filter(c =>
      region.counties.some(rc =>
        rc.toLowerCase() === c.name.toLowerCase()
      )
    )
    const totalFarms = matchingCounties.reduce((sum, c) => sum + c.farmCount, 0)
    return { key, label: region.label, farmCount: totalFarms }
  }).filter(r => r.farmCount > 0)

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        onClick={() => onRegionSelect(null)}
        className={`px-3 py-1.5 rounded-full text-small font-medium transition-colors ${
          selectedRegion === null
            ? 'bg-primary-500 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        All
      </button>
      {regionCounts.map(region => (
        <button
          key={region.key}
          onClick={() => onRegionSelect(selectedRegion === region.key ? null : region.key)}
          className={`px-3 py-1.5 rounded-full text-small font-medium transition-colors ${
            selectedRegion === region.key
              ? 'bg-primary-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {region.label}
          <span className="ml-1 opacity-70">({region.farmCount})</span>
        </button>
      ))}
    </div>
  )
}
