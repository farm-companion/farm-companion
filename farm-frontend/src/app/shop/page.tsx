import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getFarmDataServer, getFarmStatsServer } from '@/lib/farm-data-server'
import ShopPageClient from '@/components/ShopPageClient'

// Revalidate every 6 hours for fresh farm data
export const revalidate = 21600

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
          url: 'https://www.farmcompanion.co.uk/og?title=UK Farm Shops Directory&subtitle=Find Farm Shops Near You&type=shop',
          width: 1200,
          height: 630,
          alt: 'UK Farm Shops Directory',
          type: 'image/png'
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
function generateStructuredData(farms: any[], stats: any) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "UK Farm Shops Directory",
    "description": `Directory of ${stats.farmCount}+ farm shops across the UK`,
    "numberOfItems": stats.farmCount,
    "itemListElement": farms.slice(0, 50).map((farm: any, index: number) => ({
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



// Main shop page component
async function ShopPageContent() {
  const [farms, stats] = await Promise.all([
    getFarmDataServer(),
    getFarmStatsServer()
  ])
  
  // Generate structured data for SEO
  const structuredData = generateStructuredData(farms, stats)

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ShopPageClient farms={farms} stats={stats} />
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
