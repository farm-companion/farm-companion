'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Shield, CheckCircle, Plus, ArrowRight } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { dedupeFarms } from '@/lib/schemas'
import FarmSearchBar from '@/components/FarmSearchBar'
import BackToTopButton from '@/components/BackToTopButton'

// Enhanced farm card component with PuredgeOS styling
function FarmCard({ farm }: { farm: FarmShop }) {
  return (
    <article className="group relative bg-white dark:bg-obsidian rounded-xl border border-sandstone/20 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-serum to-solar opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="p-6">
        {/* Header with name and verification */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-heading font-semibold text-obsidian dark:text-sandstone mb-2 group-hover:text-serum transition-colors truncate">
              {farm.name}
            </h3>
            
            {/* Location with improved hierarchy */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0 text-serum" />
              <span className="truncate font-medium">{farm.location.address}</span>
              {farm.location.county && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="font-semibold text-serum">{farm.location.county}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Enhanced verified badge */}
          {farm.verified && (
            <div className="flex items-center gap-1.5 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
              <CheckCircle className="w-3.5 h-3.5 fill-current" />
              <span className="font-medium">Verified</span>
            </div>
          )}
        </div>

        {/* Farm details section */}
        <div className="space-y-3 mb-6">
          {/* Contact info */}
          {farm.contact?.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-serum rounded-full flex-shrink-0" />
              <span className="font-medium">{farm.contact.phone}</span>
            </div>
          )}
          
          {/* Hours info */}
          {farm.hours && farm.hours.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-solar rounded-full flex-shrink-0" />
              <span className="font-medium">Open for business</span>
            </div>
          )}
          
          {/* Offerings preview */}
          {farm.offerings && farm.offerings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {farm.offerings.slice(0, 3).map((offering, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-sandstone/50 dark:bg-gray-700 text-obsidian dark:text-sandstone rounded-full"
                >
                  {offering}
                </span>
              ))}
              {farm.offerings.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-serum/10 text-serum rounded-full">
                  +{farm.offerings.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons with improved hierarchy */}
        <div className="flex items-center justify-between pt-4 border-t border-sandstone/20 dark:border-gray-700">
          <Link
            href={`/shop/${farm.slug}`}
            className="text-serum hover:text-serum/80 font-medium text-sm transition-colors flex items-center gap-1.5 group-hover:gap-2"
          >
            View Details
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          
          <Link
            href={`/claim/${farm.slug}`}
            className="bg-serum text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-serum/90 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            Claim This Shop
          </Link>
        </div>
      </div>
    </article>
  )
}

// County section component
function CountySection({ county, farms }: { county: string; farms: FarmShop[] }) {
  return (
    <div className="border-b border-sandstone/20 dark:border-gray-700 pb-12 last:border-b-0">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-serum to-solar rounded-full" />
          <h3 className="text-2xl font-heading font-bold text-obsidian dark:text-sandstone">
            {county}
          </h3>
        </div>
        <span className="text-sm font-semibold text-serum bg-serum/10 dark:bg-serum/20 px-4 py-2 rounded-full border border-serum/20 dark:border-serum/30">
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

// Main claim page component
function ClaimPageContent() {
  const [farms, setFarms] = useState<FarmShop[]>([])
  const [filteredFarms, setFilteredFarms] = useState<FarmShop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ farmCount: 0, countyCount: 92 }) // 39 England + 6 NI + 34 Scotland + 13 Wales = 92

  // Fetch farm data on client side
  useEffect(() => {
    async function fetchFarms() {
      try {
        // Use the same approach as the map page - fetch from JSON and apply deduplication
        const response = await fetch('/data/farms.uk.json', { 
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch farms data: ${response.status} ${response.statusText}`)
        }
        
        const rawFarms = await response.json()
        console.log('🔍 Raw farm data loaded:', rawFarms.length, 'farms')
        
        // Apply comprehensive validation and deduplication (same as map page)
        const { farms: validFarms, stats } = dedupeFarms(rawFarms)
        
        console.log('📊 Farm data processing:', stats)
        console.log('✅ Valid farms after validation and deduplication:', validFarms.length, 'out of', rawFarms.length)
        
        setFarms(validFarms)
        setFilteredFarms(validFarms)
        setStats({ farmCount: validFarms.length, countyCount: 92 }) // Use fixed county count: 39 England + 6 NI + 34 Scotland + 13 Wales = 92
      } catch (error) {
        console.error('Error fetching farms:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFarms()
  }, [])

  // Group farms by county for better organization
  const farmsByCounty = useMemo(() => {
    return filteredFarms.reduce((acc: Record<string, FarmShop[]>, farm: FarmShop) => {
      const county = farm.location.county || 'Other'
      if (!acc[county]) {
        acc[county] = []
      }
      acc[county].push(farm)
      return acc
    }, {})
  }, [filteredFarms])

  const sortedCounties = Object.keys(farmsByCounty).sort()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-canvas dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="bg-background-surface py-16">
            <div className="max-w-7xl mx-auto px-6">
              <div className="h-12 bg-gray-200 rounded-lg mb-4 max-w-2xl mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded mb-8 max-w-3xl mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background-canvas dark:bg-gray-900">
      {/* Professional Hero Section with Claim Page Image */}
      <section className="relative h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden">
        {/* Background Image with Professional Handling */}
        <div className="absolute inset-0">
          <Image
            src="/claim.jpg"
            alt="Green keyboard key with 'Claim' text and document icons"
            fill
            className="object-cover object-center"
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
          {/* Professional Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          {/* Subtle texture overlay for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-6">
            {/* Visual Element - Keyboard Key */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-serum rounded-2xl shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500 flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <div className="text-center transform -rotate-12">
                    <div className="text-white font-bold text-lg md:text-xl mb-1">CLAIM</div>
                    <div className="text-white/80 text-xs">✓ VERIFIED</div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-solar rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-black rounded-full"></div>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Claim Your Farm
              <span className="block text-serum drop-shadow-lg">Shop Listing</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Find your farm shop below and claim ownership to update information, add photos, and manage your listing.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-serum mb-2 drop-shadow-lg">{stats.farmCount}+</div>
                <div className="text-white/80 text-sm md:text-base">Farm Shops</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-serum mb-2 drop-shadow-lg">{stats.countyCount}</div>
                <div className="text-white/80 text-sm md:text-base">Counties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-serum mb-2 drop-shadow-lg">100%</div>
                <div className="text-white/80 text-sm md:text-base">Free to Claim</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to claim section */}
      <section className="py-16 bg-background-canvas dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border-default/30 shadow-sm p-8 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-serum/10 rounded-lg">
                <Shield className="w-6 h-6 text-serum" />
              </div>
              <h2 className="text-2xl font-heading font-semibold text-text-heading dark:text-white">
                How to Claim Your Listing
              </h2>
            </div>
            <ol className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-serum text-black rounded-full flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="text-text-body dark:text-gray-300">
                    Find your farm shop in the list below (organized by county)
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-serum text-black rounded-full flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="text-text-body dark:text-gray-300">
                    Click &quot;Claim This Shop&quot; next to your listing
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-serum text-black rounded-full flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div>
                  <p className="text-text-body dark:text-gray-300">
                    Fill out the claim form with your contact information
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-serum text-black rounded-full flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div>
                  <p className="text-text-body dark:text-gray-300">
                    We&apos;ll verify your ownership and grant you access to manage your listing
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Responsive Search Bar */}
          <FarmSearchBar 
            farms={farms} 
            onSearchResults={setFilteredFarms}
          />
          
          {/* Farms by county */}
          <div className="space-y-8">
            {sortedCounties.map((county) => (
              <CountySection 
                key={county} 
                county={county} 
                farms={farmsByCounty[county]} 
              />
            ))}
          </div>

          {/* Add new farm section */}
          <div className="mt-16 bg-gradient-to-r from-serum/10 to-solar/10 rounded-2xl border border-serum/20 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-serum/20 rounded-full">
                <Plus className="w-8 h-8 text-serum" />
              </div>
            </div>
            <h2 className="text-2xl font-heading font-semibold text-text-heading dark:text-white mb-4">
              Don&apos;t See Your Farm Shop?
            </h2>
            <p className="text-text-muted dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              If your farm shop isn&apos;t listed above, you can add it to our directory and start managing it right away.
            </p>
            <Link
              href="/add"
              className="inline-flex items-center gap-2 bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Add Your Farm Shop
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Back to Top Button */}
      <BackToTopButton />
    </main>
  )
}

export default function ClaimPage() {
  return <ClaimPageContent />
}
