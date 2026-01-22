import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight } from 'lucide-react'
import { FarmShop } from '@/types/farm'
import { SITE_URL } from '@/lib/site'
import CountiesSearch from '@/components/CountiesSearch'
import BackToTop from '@/components/BackToTop'
import { prisma } from '@/lib/prisma'

import type { Metadata } from 'next'

// Force dynamic rendering to avoid database connection issues during build
export const dynamic = 'force-dynamic'

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

// Load farm data from database
async function getFarms(): Promise<FarmShop[]> {
  try {
    const farms = await prisma.farm.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        city: true,
        county: true,
        postcode: true,
        latitude: true,
        longitude: true,
        phone: true,
        email: true,
        website: true,
        verified: true,
        categories: {
          include: {
            category: true,
          },
        },
        images: {
          where: {
            status: 'approved',
            isHero: true,
          },
          take: 1,
          select: {
            url: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Transform to FarmShop type
    return farms.map((farm) => ({
      id: farm.id,
      name: farm.name,
      slug: farm.slug,
      description: farm.description || undefined,
      location: {
        lat: Number(farm.latitude),
        lng: Number(farm.longitude),
        address: farm.address,
        city: farm.city || undefined,
        county: farm.county,
        postcode: farm.postcode,
      },
      contact: {
        phone: farm.phone || undefined,
        email: farm.email || undefined,
        website: farm.website || undefined,
      },
      offerings: farm.categories.map((fc) => fc.category.name),
      images: farm.images.length > 0 ? [farm.images[0].url] : undefined,
      verified: farm.verified,
    }))
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
            <h1 className="text-display font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Farm Shops by
              <span className="block text-serum drop-shadow-lg">County</span>
            </h1>
            <p className="text-heading text-white/90 mb-4 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
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

        {/* Search Bar */}
        <div className="mb-8">
          <CountiesSearch counties={Object.keys(farmsByCounty)} />
        </div>

        {/* Counties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(farmsByCounty).map(([county, countyFarms]) => (
            <div
              key={county}
              className="bg-background-surface border border-border-default rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading font-semibold text-text-heading">
                  {county}
                </h2>
                <span className="text-caption text-text-muted bg-background-canvas px-2 py-1 rounded-full">
                  {countyFarms.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {countyFarms.slice(0, 3).map((farm: { id: string; slug: string; name: string }) => (
                  <Link
                    key={farm.id}
                    href={`/shop/${farm.slug}`}
                    className="block text-caption text-text-body hover:text-text-heading transition-colors"
                  >
                    {farm.name}
                  </Link>
                ))}
                
                {countyFarms.length > 3 && (
                  <p className="text-small text-text-muted">
                    +{countyFarms.length - 3} more farm shops
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border-default">
                <Link
                  href={`/counties/${county.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-caption text-brand-primary hover:text-brand-primary/80 transition-colors"
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

      {/* Back to Top Button */}
      <BackToTop />
    </main>
  )
}
