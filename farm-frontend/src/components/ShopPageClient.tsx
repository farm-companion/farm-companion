'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Phone } from 'lucide-react'
import { Clock } from 'lucide-react'
import { Star } from 'lucide-react'
import { Map } from 'lucide-react'
import { Calendar } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { cleanDescription } from '@/lib/seo-utils'
import FarmSearchBar from './FarmSearchBar'
import BackToTop from './BackToTop'

interface ShopPageClientProps {
  farms: FarmShop[]
  stats: any
}

// Enhanced farm card component with PuredgeOS styling
function FarmCard({ farm }: { farm: FarmShop }) {
  const description = cleanDescription(farm.description || '')
  const previewText = description.length > 120 ? description.substring(0, 120) + '...' : description

  return (
    <article className="group bg-white dark:bg-gray-800 rounded-2xl border border-border-default/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-text-heading dark:text-white mb-2 group-hover:text-serum transition-colors">
              <Link 
                href={`/shop/${farm.slug}`}
                className="hover:text-serum transition-colors"
              >
                {farm.name}
              </Link>
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-text-muted dark:text-gray-400 mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{farm.location.address}</span>
              {farm.location.county && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="font-medium text-serum">{farm.location.county}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Verified badge */}
          {farm.verified && (
            <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              <Star className="w-3 h-3 fill-current" />
              <span>Verified</span>
            </div>
          )}
        </div>

        {previewText && (
          <p className="text-text-body dark:text-gray-300 text-sm leading-relaxed mb-4">
            {previewText}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-text-muted dark:text-gray-400">
            {farm.contact?.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">{farm.contact.phone}</span>
              </div>
            )}
            {farm.hours && farm.hours.length > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Open</span>
              </div>
            )}
          </div>
          
          <Link
            href={`/shop/${farm.slug}`}
            className="text-serum hover:text-serum/80 font-medium text-sm transition-colors flex items-center gap-1 group-hover:gap-2"
          >
            View Details
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}

// County section component
function CountySection({ county, farms }: { county: string; farms: FarmShop[] }) {
  return (
    <div className="border-b border-border-default pb-8 last:border-b-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-heading font-semibold text-text-heading dark:text-white">
          {county}
        </h3>
        <span className="text-sm text-text-muted dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {farms.length} farm{farms.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm, index) => (
          <FarmCard key={`${farm.id}-${county}-${index}`} farm={farm} />
        ))}
      </div>
    </div>
  )
}

export default function ShopPageClient({ farms, stats }: ShopPageClientProps) {
  const [filteredFarms, setFilteredFarms] = useState<FarmShop[]>(farms)

  // Group filtered farms by county for better organization
  const farmsByCounty = useMemo(() => {
    return filteredFarms.reduce((acc, farm) => {
      const county = farm.location.county || 'Other'
      if (!acc[county]) {
        acc[county] = []
      }
      acc[county].push(farm)
      return acc
    }, {} as Record<string, FarmShop[]>)
  }, [filteredFarms])

  const counties = Object.keys(farmsByCounty).sort()

  return (
    <>
      <BackToTop />
      
      <main className="min-h-screen bg-background-canvas dark:bg-gray-900">
        {/* Hero Section - PuredgeOS 3.0 Compliant */}
        <section className="relative overflow-hidden bg-background-surface dark:bg-gray-800">
          {/* Sophisticated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-serum/5 via-transparent to-solar/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.03),transparent_50%)]" />
          
          <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-text-heading dark:text-white">
              UK Farm Shops Directory
            </h1>
            <p className="text-xl md:text-2xl text-text-muted dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Browse {stats.farmCount}+ UK farm shops by county. Find fresh local produce, 
              buy seasonal fruit and vegetables, and discover authentic farm experiences near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/map"
                className="bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Map className="w-5 h-5" />
                Explore Interactive Map
              </Link>
              <Link
                href="/seasonal"
                className="border-2 border-serum text-serum dark:text-serum px-8 py-4 rounded-lg font-semibold hover:bg-serum hover:text-black dark:hover:bg-serum dark:hover:text-black transition-all duration-200 inline-flex items-center justify-center gap-2 transform hover:scale-105"
              >
                <Calendar className="w-5 h-5" />
                What&apos;s in Season
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-background-canvas dark:bg-gray-900 border-b border-border-default">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="group">
                <div className="text-4xl font-heading font-bold text-serum mb-2 group-hover:scale-110 transition-transform">
                  {stats.farmCount}+
                </div>
                <div className="text-text-muted dark:text-gray-400">Farm Shops</div>
              </div>
              <div className="group">
                <div className="text-4xl font-heading font-bold text-serum mb-2 group-hover:scale-110 transition-transform">
                  {stats.countyCount}
                </div>
                <div className="text-text-muted dark:text-gray-400">Counties</div>
              </div>
              <div className="group">
                <div className="text-4xl font-heading font-bold text-serum mb-2 group-hover:scale-110 transition-transform">
                  100%
                </div>
                <div className="text-text-muted dark:text-gray-400">Verified Farms</div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="bg-background-surface dark:bg-gray-800 border-b border-border-default">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <FarmSearchBar 
              farms={farms} 
              onSearchResults={setFilteredFarms}
              className="mb-6"
            />
          </div>
        </section>

        {/* Farm Directory */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-heading dark:text-white mb-4">
                Browse by County
              </h2>
              <p className="text-lg text-text-muted dark:text-gray-300 max-w-2xl mx-auto">
                Find farm shops in your area with our comprehensive county-by-county directory.
              </p>
            </div>

            {counties.length > 0 ? (
              <div className="space-y-12">
                {counties.map((county) => (
                  <CountySection 
                    key={county} 
                    county={county} 
                    farms={farmsByCounty[county]} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <MapPin className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-text-heading dark:text-white mb-2">
                  No farm shops found
                </h3>
                <p className="text-text-muted dark:text-gray-400">
                  Try adjusting your search criteria or browse all farm shops.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
