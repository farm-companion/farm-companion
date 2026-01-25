import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { SITE_URL } from '@/lib/site'
import CountiesSearch from '@/components/CountiesSearch'
import BackToTop from '@/components/BackToTop'
import { CountyDensityBadge, CountyDensityLegend, UKCountyMap } from '@/components/counties'
import { getFarmData } from '@/lib/farm-data'

import type { Metadata } from 'next'

// Revalidate every 6 hours for fresh farm data
export const revalidate = 21600

// Metadata for SEO and clarity
export const metadata: Metadata = {
  title: 'Farm Shops by County | Farm Companion',
  description: 'Browse farm shops organized by county across the UK. Find local farm shops, fresh produce, and authentic farm experiences in your area.',
  alternates: {
    canonical: `${SITE_URL}/counties`,
  },
  openGraph: {
    title: 'Farm Shops by County | Farm Companion',
    description: 'Browse farm shops organized by county across the UK. Find local farm shops, fresh produce, and authentic farm experiences in your area.',
    url: `${SITE_URL}/counties`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/counties.jpg`,
        width: 1200,
        height: 630,
        alt: 'Farm shops by county - UK farm directory',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farm Shops by County | Farm Companion',
    description: 'Browse farm shops organized by county across the UK. Find local farm shops, fresh produce, and authentic farm experiences in your area.',
    images: [`${SITE_URL}/counties.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
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
  const farms = await getFarmData()
  const farmsByCounty = groupFarmsByCounty(farms)

  return (
    <main className="bg-background-canvas">
      {/* Professional Hero Section with Counties Page Image */}
      <section className="relative h-[70vh] min-h-[600px] max-h-[800px] overflow-hidden">
        {/* Background Image with Professional Handling */}
        <div className="absolute inset-0">
          <Image
            src="/counties.jpg"
            alt="Panoramic view of rolling hills and valleys across UK counties"
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Farm Shops by
              <span className="block text-serum drop-shadow-lg">County</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Discover authentic farm shops organized by county across the UK.
            </p>
            <p className="text-body text-white/80 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Find local producers and fresh food in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#counties-content"
                className="bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl backdrop-blur-sm"
              >
                <MapPin className="w-5 h-5" />
                Browse Counties
              </Link>
              <Link
                href="/map"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
              >
                View Map
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div id="counties-content" className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

        {/* Two Column Layout: Map + Search/List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Interactive Map */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-heading font-semibold text-text-heading mb-4 text-center lg:text-left">
                Explore by Region
              </h2>
              <UKCountyMap
                counties={Object.entries(farmsByCounty).map(([name, farms]) => ({
                  name,
                  slug: name.toLowerCase().replace(/\s+/g, '-'),
                  farmCount: farms.length,
                }))}
              />
              <p className="mt-4 text-small text-text-muted text-center">
                Click a region to explore
              </p>
            </div>
          </div>

          {/* Search + Counties List */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <div className="mb-6">
              <CountiesSearch counties={Object.keys(farmsByCounty)} />
            </div>

            {/* Density Legend */}
            <div className="mb-8">
              <CountyDensityLegend />
            </div>

            {/* Counties List - Horizontal Cards for Readability */}
            <div className="space-y-3">
              {Object.entries(farmsByCounty).map(([county, countyFarms]) => (
                <Link
                  key={county}
                  href={`/counties/${county.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group block obsidian-card p-4 sm:p-5 hover:border-brand-primary/30 dark:hover:border-white/20 transition-all duration-200"
                >
                  {/* Mobile: Stacked | Desktop: Horizontal */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    {/* County Name + Badge */}
                    <div className="flex items-center gap-3 sm:min-w-[280px]">
                      <h2 className="text-body obsidian-weight text-text-heading group-hover:text-brand-primary transition-colors">
                        {county}
                      </h2>
                      <CountyDensityBadge count={countyFarms.length} />
                    </div>

                    {/* Farm Names - Hidden on mobile, shown on tablet+ */}
                    <div className="hidden sm:flex flex-1 items-center gap-2 text-caption text-text-muted overflow-hidden">
                      {countyFarms.slice(0, 3).map((farm: { id: string; slug: string; name: string }, idx: number) => (
                        <span key={farm.id} className="flex items-center">
                          {idx > 0 && <span className="mx-2 text-border-default">&middot;</span>}
                          <span className="truncate max-w-[150px]">{farm.name}</span>
                        </span>
                      ))}
                      {countyFarms.length > 3 && (
                        <span className="text-text-subtle ml-1">+{countyFarms.length - 3} more</span>
                      )}
                    </div>

                    {/* Mobile: Show farm count */}
                    <div className="sm:hidden text-small text-text-muted">
                      {countyFarms.length} farm {countyFarms.length === 1 ? 'shop' : 'shops'}
                    </div>

                    {/* Arrow indicator */}
                    <div className="hidden sm:flex items-center text-text-muted group-hover:text-brand-primary transition-colors">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-12 text-center">
          <p className="text-text-muted">
            Found {Object.keys(farmsByCounty).length} counties with {farms.length} farm shops across the UK.
          </p>
        </div>
      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </main>
  )
}
