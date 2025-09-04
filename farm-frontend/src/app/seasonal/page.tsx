import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import ClientMonthSelector from '@/components/ClientMonthSelector'
import ProduceCard from '@/components/ProduceCard'
import { getProduceInSeason, getProduceAtPeak } from '@/lib/produce-integration'
import { MapPin } from 'lucide-react'
import { SITE_URL } from '@/lib/site'
import JsonLd from '@/components/JsonLd'

// Revalidate every 12 hours for seasonal data
export const revalidate = 43200

export const metadata: Metadata = {
  title: 'Seasonal Produce Guide | Farm Companion',
  description: 'Discover what\'s in season now with our comprehensive UK seasonal produce guide. Find the freshest local fruits and vegetables at farm shops near you.',
  alternates: {
    canonical: `${SITE_URL}/seasonal`,
  },
  openGraph: {
    title: 'Seasonal Produce Guide | Farm Companion',
    description: 'What\'s in season now? Find the freshest local produce with our comprehensive UK seasonal guide.',
    url: `${SITE_URL}/seasonal`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/seasonal-header.jpg`,
        width: 1200,
        height: 630,
        alt: 'Seasonal produce guide - UK farm shops',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seasonal Produce Guide | Farm Companion',
    description: 'What\'s in season now? Find the freshest local produce with our comprehensive UK seasonal guide.',
    images: [`${SITE_URL}/seasonal-header.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Server-side data fetching
async function getSeasonalData() {
  const now = new Date()
  const month = now.getMonth() + 1
  
  // Get static produce data
  const inSeasonProduce = getProduceInSeason(month)
  const atPeakProduce = getProduceAtPeak(month)
  
  // Use static images for server-side rendering
  // API images will be loaded client-side if needed
  const produceWithImages = [...new Set([...inSeasonProduce, ...atPeakProduce])].map((produce) => {
    return {
      ...produce,
      hasApiImages: false // Will be updated client-side
    }
  })
  
  return {
    month,
    inSeasonProduce: produceWithImages.filter(p => inSeasonProduce.some(sp => sp.slug === p.slug)),
    atPeakProduce: produceWithImages.filter(p => atPeakProduce.some(sp => sp.slug === p.slug)),
    monthName: new Date(now.getFullYear(), month - 1).toLocaleString('en-GB', { month: 'long' })
  }
}

// Server-side seasonal content
function SeasonalContent({ month, inSeasonProduce, atPeakProduce, monthName }: {
  month: number
  inSeasonProduce: any[]
  atPeakProduce: any[]
  monthName: string
}) {
  // Combine and deduplicate
  const allInSeason = [...new Set([...inSeasonProduce, ...atPeakProduce])]

  return (
    <div className="space-y-8">
      {/* Seasonal Wisdom - PuredgeOS 3.0 Compliant */}
      <section className="bg-background-surface rounded-3xl p-8 border border-border-default">
        <h2 className="text-2xl font-heading font-semibold text-text-heading mb-4">
          What&apos;s in Season in {monthName}
        </h2>
        <p className="text-text-muted leading-relaxed">
          Eating seasonally means enjoying produce at its peak flavour and nutritional value. 
          This month, look for these fresh, local delights at your nearest farm shop.
        </p>
      </section>

      {/* Produce Gallery */}
      <section className="section-lazy">
        <h2 className="text-2xl font-heading font-semibold text-text-heading mb-6">
          Fresh & In Season
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allInSeason.map((produce) => (
            <ProduceCard
              key={produce.slug}
              produce={produce}
              month={month}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default async function SeasonalPage() {
  const { month, inSeasonProduce, atPeakProduce, monthName } = await getSeasonalData()
  
  // Combine and deduplicate for structured data
  const allInSeason = [...new Set([...inSeasonProduce, ...atPeakProduce])]
  
  // CollectionPage + ItemList JSON-LD
  const seasonalJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/seasonal#collection`,
    url: `${SITE_URL}/seasonal`,
    name: 'Seasonal Produce Guide',
    description: 'Comprehensive guide to seasonal produce available at UK farm shops',
    isPartOf: { '@id': `${SITE_URL}#website` },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Seasonal Produce',
      numberOfItems: allInSeason.length,
      itemListOrder: 'http://schema.org/ItemListOrderAscending',
      itemListElement: allInSeason.map((produce, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: produce.name,
          url: `${SITE_URL}/seasonal/${produce.slug}`,
          description: `Seasonal guide for ${produce.name}`,
        }
      }))
    }
  }

  return (
    <main className="min-h-screen bg-background-canvas">
      <JsonLd data={seasonalJsonLd} />
      {/* Professional Hero Section with Seasonal Produce Image */}
      <section className="relative h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden">
        {/* Background Image with Professional Handling */}
        <div className="absolute inset-0">
          <Image
            src="/seasonal-header.jpg"
            alt="Assorted seasonal fruits and vegetables arranged in a colorful gradient pattern, including tomatoes, carrots, apples, and leafy greens, representing the variety of UK seasonal produce"
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
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          {/* Subtle texture overlay for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Seasonal Produce
              <span className="block text-serum drop-shadow-lg">Guide</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              What&apos;s in season {monthName}? Find fresh UK fruit and vegetables at their peak, 
              plus tips on buying local produce from farm shops near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/map"
                className="bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl backdrop-blur-sm"
              >
                <MapPin className="w-5 h-5" />
                Find Farm Shops
              </Link>
              <Link
                href="#seasonal-content"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
              >
                Explore {monthName}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Month Selector - Client Component */}
      <section className="border-b border-border-default bg-background-canvas">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Suspense fallback={<div className="h-12 bg-background-surface rounded animate-pulse" />}>
            <ClientMonthSelector currentMonth={month} />
          </Suspense>
        </div>
      </section>

      {/* Main Content */}
      <div id="seasonal-content" className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={
          <div className="space-y-8">
            <div className="h-64 bg-background-surface rounded-3xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-background-surface rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        }>
          <SeasonalContent 
            month={month}
            inSeasonProduce={inSeasonProduce}
            atPeakProduce={atPeakProduce}
            monthName={monthName}
          />
        </Suspense>
      </div>

      {/* Find Fresh Seasonal Produce Section with Parallax */}
      <section className="relative bg-background-surface border-t border-border-default overflow-hidden">
        {/* Parallax Background */}
        <Image
          src="/produce-secondary-image.jpg"
          alt="Fresh seasonal produce including colorful vegetables and fruits"
          fill
          className="object-cover object-center transform scale-110 transition-transform duration-1000 ease-out"
          sizes="100vw"
          quality={80}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
        
        {/* Gradient Overlays for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        
        {/* Subtle animated texture overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            radial-gradient(circle at 30% 20%, rgba(0, 194, 178, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(212, 255, 79, 0.2) 0%, transparent 50%)
          `,
          backgroundSize: '300px 300px, 200px 200px',
          backgroundPosition: '0 0, 100px 100px'
        }} />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 drop-shadow-lg">
              Find Fresh Seasonal Produce
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              Visit local farm shops to get the freshest seasonal produce at its peak flavor.
            </p>
            <Link
              href="/map"
              className="group bg-white/95 backdrop-blur-sm text-black px-10 py-5 rounded-xl font-semibold hover:bg-white transition-all duration-300 inline-flex items-center justify-center gap-3 shadow-2xl hover:shadow-white/25 hover:scale-105 border border-white/20"
            >
              <MapPin className="w-6 h-6 group-hover:animate-gentle-bounce" />
              Find Farm Shops Near You
            </Link>
          </div>
        </div>
      </section>

      {/* Ad Slot */}
      
    </main>
  )
}
