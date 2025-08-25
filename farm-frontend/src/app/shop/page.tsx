import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { MapPin, Phone, Clock, Star, Map, Calendar } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { cleanDescription } from '@/lib/seo-utils'
import { getFarmDataServer, getFarmStatsServer } from '@/lib/farm-data-server'

// Generate metadata dynamically for better SEO
export async function generateMetadata(): Promise<Metadata> {
  const stats = await getFarmStatsServer()
  
  return {
    title: `UK Farm Shops Directory - Find ${stats.farmCount}+ Local Farm Shops Near You`,
    description: `Discover ${stats.farmCount}+ authentic UK farm shops with fresh local produce. Find farm shops near you with verified information, opening hours, and contact details. Browse by county.`,
    keywords: 'farm shops, UK farm shops, local produce, farm shop directory, fresh food, farm shops near me, organic food, local farmers',
    openGraph: {
      title: `UK Farm Shops Directory — ${stats.farmCount}+ Farm Shops`,
      description: `Find trusted farm shops near you with the freshest local produce. Browse our comprehensive directory of ${stats.farmCount}+ UK farm shops across ${stats.countyCount} counties.`,
      type: 'website',
      url: 'https://www.farmcompanion.co.uk/shop',
      siteName: 'Farm Companion',
      images: [
        {
          url: 'https://www.farmcompanion.co.uk/og-farm-shops.jpg',
          width: 1200,
          height: 630,
          alt: 'UK Farm Shops Directory'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `UK Farm Shops Directory - ${stats.farmCount}+ Farm Shops`,
      description: `Find trusted farm shops near you with the freshest local produce. Browse our comprehensive directory.`,
      images: ['https://www.farmcompanion.co.uk/og-farm-shops.jpg']
    },
    alternates: {
      canonical: 'https://www.farmcompanion.co.uk/shop'
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

// Generate structured data for SEO
function generateStructuredData(farms: FarmShop[], stats: any) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "UK Farm Shops Directory",
    "description": `Directory of ${stats.farmCount}+ farm shops across the UK`,
    "numberOfItems": stats.farmCount,
    "itemListElement": farms.slice(0, 50).map((farm, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "LocalBusiness",
        "name": farm.name,
        "description": farm.description || `${farm.name} - Farm shop in ${farm.location.county}`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": farm.location.address,
          "addressLocality": farm.location.county,
          "postalCode": farm.location.postcode,
          "addressCountry": "GB"
        },
        "url": `https://www.farmcompanion.co.uk/shop/${farm.slug}`,
        "telephone": farm.contact?.phone,
        "email": farm.contact?.email,
        "geo": farm.location.lat && farm.location.lng ? {
          "@type": "GeoCoordinates",
          "latitude": farm.location.lat,
          "longitude": farm.location.lng
        } : undefined
      }
    }))
  }
  
  return structuredData
}

// Loading component for Suspense
function ShopPageLoading() {
  return (
    <div className="min-h-screen bg-background-canvas">
      <div className="animate-pulse">
        {/* Hero skeleton */}
        <div className="bg-background-surface py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="h-12 bg-gray-200 rounded-lg mb-4 max-w-2xl mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded mb-8 max-w-3xl mx-auto"></div>
            <div className="flex justify-center gap-4">
              <div className="h-12 bg-gray-200 rounded-lg w-48"></div>
              <div className="h-12 bg-gray-200 rounded-lg w-48"></div>
            </div>
          </div>
        </div>
        
        {/* Stats skeleton */}
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-12 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
        {farms.map((farm) => (
          <FarmCard key={farm.id} farm={farm} />
        ))}
      </div>
    </div>
  )
}

// Main shop page component
async function ShopPageContent() {
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

  const counties = Object.keys(farmsByCounty).sort()

  // Generate structured data for SEO
  const structuredData = generateStructuredData(farms, stats)

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
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
              Discover {stats.farmCount}+ authentic farm shops across the UK. 
              Find fresh local produce, seasonal delights, and farm-fresh goodness near you.
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
                  We&apos;re currently updating our directory. Please check back soon.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopPageLoading />}>
      <ShopPageContent />
    </Suspense>
  )
}
