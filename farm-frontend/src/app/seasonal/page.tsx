import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { PRODUCE } from '@/data/produce'
import SeasonalGrid from '@/components/SeasonalGrid'
import { MapPin } from 'lucide-react'
import { SITE_URL } from '@/lib/site'
import JsonLd from '@/components/JsonLd'

// Revalidate every 12 hours for seasonal data
export const revalidate = 43200

export const metadata: Metadata = {
  title: 'British Seasonal Produce Calendar | Farm Companion',
  description: 'Explore all 12 months of British seasonal produce. Find the freshest local fruits and vegetables at farm shops near you, with detailed guides for every season.',
  alternates: {
    canonical: `${SITE_URL}/seasonal`,
  },
  openGraph: {
    title: 'British Seasonal Produce Calendar | Farm Companion',
    description: 'Complete year-round guide to seasonal British produce. Discover what\'s fresh each month at UK farm shops.',
    url: `${SITE_URL}/seasonal`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/seasonal-header.jpg`,
        width: 1200,
        height: 630,
        alt: 'British seasonal produce calendar - UK farm shops',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'British Seasonal Produce Calendar | Farm Companion',
    description: 'Complete year-round guide to seasonal British produce at UK farm shops.',
    images: [`${SITE_URL}/seasonal-header.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Get seasonal metadata for all produce items
function getSeasonalMetadata() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const monthName = now.toLocaleString('en-GB', { month: 'long' })

  // Enrich produce items with seasonal status
  const enrichedProduce = PRODUCE.map(produce => {
    const isInSeason = produce.monthsInSeason.includes(currentMonth)
    const isPeakSeason = produce.peakMonths?.includes(currentMonth) || false

    // Calculate if coming soon (within 2 months)
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1
    const isComingSoon = !isInSeason && (
      produce.monthsInSeason.includes(nextMonth) ||
      produce.monthsInSeason.includes(monthAfterNext)
    )

    // Determine primary season for color coding
    const seasonMap: Record<number, 'spring' | 'summer' | 'autumn' | 'winter'> = {
      3: 'spring', 4: 'spring', 5: 'spring',
      6: 'summer', 7: 'summer', 8: 'summer',
      9: 'autumn', 10: 'autumn', 11: 'autumn',
      12: 'winter', 1: 'winter', 2: 'winter',
    }

    // Use peak month if available, otherwise first month in season
    const primaryMonth = produce.peakMonths?.[0] || produce.monthsInSeason[0]
    const primarySeason = seasonMap[primaryMonth]

    return {
      ...produce,
      isInSeason,
      isPeakSeason,
      isComingSoon,
      primarySeason,
    }
  })

  // Group by seasonal status
  const inSeasonNow = enrichedProduce.filter(p => p.isInSeason)
  const comingSoon = enrichedProduce.filter(p => p.isComingSoon)

  return {
    currentMonth,
    monthName,
    allProduce: enrichedProduce,
    inSeasonNow,
    comingSoon,
  }
}

export default async function SeasonalPage() {
  const { currentMonth, monthName, allProduce, inSeasonNow, comingSoon } = getSeasonalMetadata()

  // CollectionPage + ItemList JSON-LD with all 12 items
  const seasonalJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/seasonal#collection`,
    url: `${SITE_URL}/seasonal`,
    name: 'British Seasonal Produce Calendar',
    description: 'Complete year-round guide to seasonal produce available at UK farm shops',
    isPartOf: { '@id': `${SITE_URL}#website` },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Seasonal Produce',
      numberOfItems: allProduce.length,
      itemListOrder: 'http://schema.org/ItemListOrderAscending',
      itemListElement: allProduce.map((produce, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: produce.name,
          url: `${SITE_URL}/seasonal/${produce.slug}`,
          description: `British seasonal guide for ${produce.name}`,
        }
      }))
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <JsonLd data={seasonalJsonLd} />

      {/* Editorial Hero Section */}
      <section className="relative h-[85vh] min-h-[700px] max-h-[900px] overflow-hidden">
        {/* Hero Image with Paper Texture */}
        <div className="absolute inset-0">
          <Image
            src="/seasonal-header.jpg"
            alt="Artfully arranged British seasonal produce including heirloom tomatoes, fresh strawberries, and vibrant leafy greens on rustic wooden table"
            fill
            className="object-cover object-center"
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={90}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />

          {/* Gradient overlays for editorial depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a2a]/50 via-black/30 to-[#2D3436]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Paper grain texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center justify-center pt-24 pb-20 px-6">
          <div className="text-center max-w-5xl mx-auto">
            {/* Editorial Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#A8E6CF] animate-pulse" />
              <span className="text-white/90 text-caption font-['IBM_Plex_Sans_Condensed'] tracking-wide uppercase">
                {monthName} {new Date().getFullYear()}
              </span>
            </div>

            {/* Hero Title - Clash Display */}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-semibold mb-6 leading-[1.15] tracking-[-0.02em] text-white drop-shadow-2xl"
              style={{ fontFamily: 'Clash Display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              British Seasonal
              <span className="block text-[#A8E6CF] mt-2">Produce Calendar</span>
            </h1>

            {/* Subtitle - Manrope */}
            <p className="text-xl md:text-2xl text-white/85 mb-10 leading-relaxed max-w-3xl mx-auto font-['Manrope'] drop-shadow-lg">
              Discover what's fresh every month of the year. From spring asparagus to winter kale,
              explore the full rhythm of British seasonal produce.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#seasonal-calendar"
                className="group bg-white text-[#1a3a2a] px-8 py-4 rounded-xl font-semibold font-['IBM_Plex_Sans_Condensed'] hover:bg-[#FAF8F5] transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Explore Calendar
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <Link
                href="/map"
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold font-['IBM_Plex_Sans_Condensed'] hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
              >
                <MapPin className="w-5 h-5" />
                Find Farm Shops
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-white/60">
          <span className="text-caption font-['IBM_Plex_Sans_Condensed'] uppercase tracking-wider">Scroll to explore</span>
          <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Seasonal Calendar Section */}
      <div id="seasonal-calendar" className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="text-4xl md:text-6xl font-semibold leading-[1.15] tracking-[-0.02em] text-[#1a3a2a] mb-4"
            style={{ fontFamily: 'Clash Display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            The Full Calendar
          </h2>
          <p className="text-body md:text-heading text-[#2D3436]/70 max-w-2xl mx-auto font-['Manrope']">
            {inSeasonNow.length} items in season now • {allProduce.length} items year-round
          </p>
        </div>

        {/* Interactive Seasonal Grid */}
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-96 bg-white/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        }>
          <SeasonalGrid
            allProduce={allProduce}
            currentMonth={currentMonth}
            inSeasonNow={inSeasonNow}
            comingSoon={comingSoon}
          />
        </Suspense>
      </div>

      {/* CTA Section - Find Farm Shops */}
      <section className="relative bg-[#1a3a2a] overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(168, 230, 207, 0.4) 0%, transparent 50%),
                            radial-gradient(circle at 70% 80%, rgba(200, 105, 65, 0.3) 0%, transparent 50%)`,
            backgroundSize: '600px 600px, 400px 400px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <h2
            className="text-4xl md:text-6xl font-semibold leading-[1.15] tracking-[-0.02em] text-white mb-6"
            style={{ fontFamily: 'Clash Display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            Find Fresh Seasonal Produce
          </h2>
          <p className="text-heading text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed font-['Manrope']">
            Visit local farm shops to get the freshest seasonal produce at its peak flavor.
            Support British farmers and taste the difference.
          </p>
          <Link
            href="/map"
            className="group inline-flex items-center justify-center gap-3 bg-white text-[#1a3a2a] px-10 py-5 rounded-xl font-semibold font-['IBM_Plex_Sans_Condensed'] hover:bg-[#FAF8F5] transition-all duration-300 shadow-2xl hover:shadow-white/25 hover:scale-105"
          >
            <MapPin className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Find Farm Shops Near You
          </Link>
        </div>
      </section>
    </main>
  )
}
