'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Shield, CheckCircle, Plus, ArrowRight } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { dedupeFarms } from '@/lib/schemas'

import BackToTopButton from '@/components/BackToTopButton'

// Enhanced farm card component with modern PuredgeOS styling
function FarmCard({ farm }: { farm: FarmShop }) {
  return (
    <article className="group relative bg-white dark:bg-obsidian rounded-2xl border border-sandstone/20 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
      {/* Premium gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-serum via-solar to-serum opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Claim status indicator */}
      <div className="absolute top-4 right-4 z-10">
        {farm.verified ? (
          <div className="flex items-center gap-1.5 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 fill-current" />
            <span className="font-medium">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 shadow-sm">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-medium">Available</span>
          </div>
        )}
      </div>
      
      <div className="p-6 pt-8">
        {/* Header with name and location */}
        <div className="mb-6">
          <h3 className="text-xl font-heading font-bold text-obsidian dark:text-sandstone mb-3 group-hover:text-serum transition-colors leading-tight">
            {farm.name}
          </h3>
          
          {/* Enhanced location display */}
          <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex-shrink-0 w-8 h-8 bg-serum/10 rounded-lg flex items-center justify-center mt-0.5">
              <MapPin className="w-4 h-4 text-serum" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{farm.location.address}</p>
              {farm.location.county && (
                <p className="text-serum font-semibold">{farm.location.county}</p>
              )}
            </div>
          </div>
        </div>

        {/* Farm details with enhanced styling */}
        <div className="space-y-4 mb-6">
          {/* Contact info with icon */}
          {farm.contact?.phone && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-solar/20 rounded-md flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-solar rounded-full" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{farm.contact.phone}</span>
            </div>
          )}
          
          {/* Hours info with icon */}
          {farm.hours && farm.hours.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Open for business</span>
            </div>
          )}
          
          {/* Enhanced offerings display */}
          {farm.offerings && farm.offerings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {farm.offerings.slice(0, 3).map((offering, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-sandstone/60 to-sandstone/40 dark:from-gray-700 dark:to-gray-600 text-obsidian dark:text-sandstone rounded-lg border border-sandstone/30 dark:border-gray-600"
                >
                  {offering}
                </span>
              ))}
              {farm.offerings.length > 3 && (
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-serum/20 to-serum/10 text-serum rounded-lg border border-serum/30">
                  +{farm.offerings.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Enhanced action buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-sandstone/20 dark:border-gray-700">
          <Link
            href={`/shop/${farm.slug}`}
            className="text-serum hover:text-serum/80 font-medium text-sm transition-all duration-200 flex items-center gap-2 group-hover:gap-3 hover:scale-105"
          >
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <Link
            href={`/claim/${farm.slug}`}
            className="relative bg-gradient-to-r from-serum to-solar text-black px-6 py-3 rounded-xl font-bold text-sm hover:from-serum/90 hover:to-solar/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 group/claim"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Claim This Shop
            </span>
            {/* Shine effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/claim:opacity-100 group-hover/claim:animate-pulse transition-opacity duration-300" />
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
        // Use the same approach as the map page - fetch from API and apply deduplication
        const response = await fetch('/api/farms?limit=2000', { 
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch farms data: ${response.status} ${response.statusText}`)
        }
        
        const apiResponse = await response.json()
        console.log('🔍 API response received:', apiResponse)
        
        // Extract farms array from API response
        const rawFarms = apiResponse.farms || []
        console.log('🔍 Raw farm data loaded:', rawFarms.length, 'farms')
        
        // Validate that we received an array
        if (!Array.isArray(rawFarms)) {
          throw new Error(`Expected farms array, but received: ${typeof rawFarms}`)
        }
        
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
      <section data-header-invert className="relative h-[80vh] min-h-[700px] max-h-[900px] overflow-hidden">
        {/* Background Image with Professional Handling */}
        <div className="absolute inset-0">
          <Image
            src="/feedback.jpg"
            alt="Professional farm shop management interface showing business owner updating their listing with fresh produce and customer information"
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
        <div className="relative h-full flex items-center justify-center pt-20 pb-20">
          <div className="text-center max-w-4xl mx-auto px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Claim Your Farm
              <span className="block text-serum drop-shadow-lg">Shop Listing</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Take control of your farm shop&apos;s online presence. Update information, add photos, and connect with customers.
            </p>
            <p className="text-lg text-white/80 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Join {stats.farmCount}+ farm shops already managing their listings on Farm Companion.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-serum mb-2 drop-shadow-lg">{stats.farmCount}+</div>
                <div className="text-white/80 text-sm md:text-base">Active Listings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-serum mb-2 drop-shadow-lg">{stats.countyCount}</div>
                <div className="text-white/80 text-sm md:text-base">UK Counties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-serum mb-2 drop-shadow-lg">100%</div>
                <div className="text-white/80 text-sm md:text-base">Free to Claim</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background-surface dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-heading dark:text-white mb-4">
              Why Claim Your Listing?
            </h2>
            <p className="text-xl text-text-muted dark:text-gray-300 max-w-3xl mx-auto">
              Take control of your farm shop&apos;s online presence and connect with customers who are actively looking for local produce.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-border-default/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading dark:text-white mb-4">
                Update Your Information
              </h3>
              <p className="text-text-muted dark:text-gray-300 leading-relaxed">
                Keep your opening hours, contact details, and product offerings up to date. Customers always see your latest information.
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-border-default/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading dark:text-white mb-4">
                Reach Local Customers
              </h3>
              <p className="text-text-muted dark:text-gray-300 leading-relaxed">
                Get discovered by customers searching for farm shops in your area. Our map helps people find you when they need fresh produce.
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-border-default/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-6">
                <Plus className="w-6 h-6 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading dark:text-white mb-4">
                Add Your Photos
              </h3>
              <p className="text-text-muted dark:text-gray-300 leading-relaxed">
                Showcase your farm shop with beautiful photos. Let customers see your fresh produce, friendly staff, and welcoming atmosphere.
              </p>
            </div>
            
            {/* Benefit 4 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-border-default/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading dark:text-white mb-4">
                Build Trust & Credibility
              </h3>
              <p className="text-text-muted dark:text-gray-300 leading-relaxed">
                Verified listings get more customer trust. Show that you&apos;re a legitimate, active farm shop that cares about customer experience.
              </p>
            </div>
            
            {/* Benefit 5 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-border-default/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-6">
                <ArrowRight className="w-6 h-6 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading dark:text-white mb-4">
                Free Marketing
              </h3>
              <p className="text-text-muted dark:text-gray-300 leading-relaxed">
                Get free exposure to customers actively looking for farm shops. No monthly fees, no hidden costs—just results.
              </p>
            </div>
            
            {/* Benefit 6 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-border-default/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading dark:text-white mb-4">
                Easy Management
              </h3>
              <p className="text-text-muted dark:text-gray-300 leading-relaxed">
                Simple dashboard to manage your listing. Update information, add photos, and respond to customer inquiries—all in one place.
              </p>
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
