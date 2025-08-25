import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { MapPin, Shield, CheckCircle, Plus, ArrowRight } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { getFarmDataServer, getFarmStatsServer } from '@/lib/farm-data-server'
import FarmSearchBar from '@/components/FarmSearchBar'

// Generate metadata dynamically for better SEO
export async function generateMetadata(): Promise<Metadata> {
  const stats = await getFarmStatsServer()
  
  return {
    title: `Claim Your Farm Shop Listing - ${stats.farmCount}+ UK Farm Shops`,
    description: `Claim ownership of your farm shop listing to update information, add photos, and manage your presence on Farm Companion. Browse ${stats.farmCount}+ farm shops by county.`,
    keywords: 'claim farm shop, farm shop ownership, farm shop management, UK farm shops, farm shop directory',
    openGraph: {
      title: `Claim Your Farm Shop Listing — Farm Companion`,
      description: `Claim ownership of your farm shop listing to update information, add photos, and manage your presence on Farm Companion.`,
      type: 'website',
      url: 'https://www.farmcompanion.co.uk/claim',
      siteName: 'Farm Companion',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Claim Your Farm Shop Listing',
      description: 'Claim ownership of your farm shop listing to update information and manage your presence.',
    },
    alternates: {
      canonical: 'https://www.farmcompanion.co.uk/claim'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    }
  }
}

// Loading component for Suspense
function ClaimPageLoading() {
  return (
    <div className="min-h-screen bg-background-canvas">
      <div className="animate-pulse">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="h-12 bg-gray-200 rounded-lg mb-4 max-w-2xl"></div>
          <div className="h-6 bg-gray-200 rounded mb-8 max-w-3xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced farm card component
function FarmCard({ farm }: { farm: FarmShop }) {
  return (
    <div id={`farm-${farm.slug}`} className="group bg-white dark:bg-gray-800 rounded-2xl border border-border-default/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden scroll-mt-20">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-text-heading dark:text-white mb-2 group-hover:text-serum transition-colors">
              {farm.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-text-muted dark:text-gray-400 mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{farm.location.address}</span>
              {farm.location.postcode && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{farm.location.postcode}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Verified badge */}
          {farm.verified && (
            <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              <span>Verified</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/shop/${farm.slug}`}
            className="text-sm text-text-muted dark:text-gray-400 hover:text-serum transition-colors"
          >
            View Details
          </Link>
          <Link
            href={`/claim/${farm.slug}`}
            className="inline-flex items-center gap-1 text-sm text-serum hover:text-serum/80 font-medium transition-colors group-hover:gap-2"
          >
            Claim This Shop
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}



// County section component
function CountySection({ county, farms }: { county: string; farms: FarmShop[] }) {
  return (
    <section id={`county-${county.toLowerCase().replace(/\s+/g, '-')}`} className="border-t border-border-default pt-8 scroll-mt-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-text-heading dark:text-white">
          {county}
        </h2>
        <span className="text-sm text-text-muted dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {farms.length} farm{farms.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {farms.map((farm, index) => (
          <FarmCard key={`${farm.id}-${county}-${index}`} farm={farm} />
        ))}
      </div>
    </section>
  )
}

// Main claim page component
async function ClaimPageContent() {
  const [farms, stats] = await Promise.all([
    getFarmDataServer(),
    getFarmStatsServer()
  ])
  
  // Group farms by county for better organization
  const farmsByCounty = farms.reduce((acc, farm) => {
    const county = farm.location.county || 'Other'
    if (!acc[county]) {
      acc[county] = []
    }
    acc[county].push(farm)
    return acc
  }, {} as Record<string, FarmShop[]>)

  // Sort counties alphabetically
  const sortedCounties = Object.keys(farmsByCounty).sort()

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
            sizes="100vw"
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
          <FarmSearchBar farms={farms} />
          
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
    </main>
  )
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<ClaimPageLoading />}>
      <ClaimPageContent />
    </Suspense>
  )
}
