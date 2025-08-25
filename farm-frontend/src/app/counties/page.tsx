import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'
import { FarmShop } from '@/types/farm'

import type { Metadata } from 'next'

// Metadata for SEO and clarity
export const metadata: Metadata = {
  title: 'Farm Shops by County - Browse UK Farm Shops by Location',
  description: 'Browse 1,300+ farm shops organized by county across the UK. Find local farm shops, fresh produce, and authentic farm experiences in your area.',
  keywords: ['farm shops by county', 'UK farm shops', 'local farm shops', 'farm directory by county', 'farm shops near me', 'local food', 'UK farms', 'farm shop finder'],
  openGraph: {
    title: 'Farm Shops by County - Browse UK Farm Shops by Location',
    description: 'Browse 1,300+ farm shops organized by county across the UK. Find local farm shops, fresh produce, and authentic farm experiences in your area.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farm Shops by County - Browse UK Farm Shops by Location',
    description: 'Browse 1,300+ farm shops organized by county across the UK. Find local farm shops, fresh produce, and authentic farm experiences in your area.',
  },
}

// Load farm data with error handling
async function getFarms(): Promise<FarmShop[]> {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'farms.uk.json')
    const data = await fs.readFile(dataPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading farm data:', error)
    return []
  }
}

// Group farms by county
function groupFarmsByCounty(farms: FarmShop[]) {
  const grouped = farms.reduce((acc, farm) => {
    const county = farm.location?.county || 'Unknown County'
    if (!acc[county]) {
      acc[county] = []
    }
    acc[county].push(farm)
    return acc
  }, {} as Record<string, FarmShop[]>)

  // Sort counties alphabetically
  return Object.keys(grouped)
    .sort()
    .reduce((acc, county) => {
      acc[county] = grouped[county]
      return acc
    }, {} as Record<string, FarmShop[]>)
}

export default async function CountiesPage() {
  const farms = await getFarms()
  const farmsByCounty = groupFarmsByCounty(farms)

  return (
    <div className="min-h-screen bg-background-canvas">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-heading mb-4">
            Farm Shops by County
          </h1>
          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            Discover authentic farm shops organized by county across the UK. 
            Find local producers and fresh food in your area.
          </p>
        </div>

        {/* Counties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(farmsByCounty).map(([county, countyFarms]) => (
            <div
              key={county}
              className="bg-background-surface border border-border-default rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text-heading">
                  {county}
                </h2>
                <span className="text-sm text-text-muted bg-background-canvas px-2 py-1 rounded-full">
                  {countyFarms.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {countyFarms.slice(0, 3).map((farm) => (
                  <Link
                    key={farm.id}
                    href={`/shop/${farm.slug}`}
                    className="block text-sm text-text-body hover:text-text-heading transition-colors"
                  >
                    {farm.name}
                  </Link>
                ))}
                
                {countyFarms.length > 3 && (
                  <p className="text-xs text-text-muted">
                    +{countyFarms.length - 3} more farm shops
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border-default">
                <Link
                  href={`/counties/${county.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  View all in {county} →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-12 text-center">
          <p className="text-text-muted">
            Found {Object.keys(farmsByCounty).length} counties with {farms.length} farm shops across the UK.
          </p>
        </div>
      </div>
    </div>
  )
}
