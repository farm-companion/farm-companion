import Link from 'next/link'
import { slugifyCounty } from '@/lib/county-slug'
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

// Use dynamic rendering to prevent connection pool exhaustion during build
export const dynamic = 'force-dynamic'

// Metadata for SEO and clarity
export const metadata: Metadata = {
  title: 'Farm Shops by County',
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
        url: `${SITE_URL}/og?title=Farm%20Shops%20by%20County&subtitle=Every%20county%20in%20the%20UK`,
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
    images: [`${SITE_URL}/og?title=Farm%20Shops%20by%20County&subtitle=Every%20county%20in%20the%20UK`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Group farms by county
function groupFarmsByCounty(farms: FarmShop[]) {
  const grouped = farms.reduce((acc, farm) => {
    // An absent county used to become 'Unknown County', whose link
    // /counties/unknown-county 404s. Drop the farm from the grouping
    // instead of inventing a destination for it.
    const county = farm.location?.county
    if (!county) return acc
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
    <main className="bg-paper">
      {/* Hero — our own illustration behind a contained paper panel, the same
          pattern as the homepage. The copy sits on cream rather than on the
          artwork, so the headings keep their contrast and the poster is left
          whole instead of flattened under dark overlays. */}
      <section
        data-immersive-hero="light"
        className="relative overflow-hidden bg-paper h-[65vh] min-h-[460px] md:h-[78vh] md:max-h-[820px]"
      >
        <Image
          src="/images/pitti/hero-homepage-dev-seed50920962-v2.webp"
          alt="Illustration of the British countryside: rolling fields divided by dry-stone walls, a red tractor, cottages, and a low red sun"
          fill
          className="object-cover object-[center_70%]"
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={60}
        />

        {/* Contained bottom-left overlay (max 580px, translucent paper) */}
        <div className="relative h-full flex items-end">
          <div className="w-full max-w-[580px] m-5 md:m-10 p-6 md:p-8 bg-paper/92 backdrop-blur-sm border border-border shadow-sm">
            <p className="text-caption uppercase tracking-[0.18em] text-ink-muted mb-3">
              {farms.length.toLocaleString('en-GB')} farm shops
            </p>
            <h1 className="font-clash text-4xl md:text-5xl lg:text-6xl font-semibold text-ink tracking-tight leading-[1.05] mb-4">
              Farm Shops by County
            </h1>
            <p className="text-body md:text-lg text-ink-muted leading-relaxed mb-6">
              Pick a county and see every farm shop we have in it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="#counties-content"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-[2px] bg-brand text-brand-text font-semibold transition-colors duration-200 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                <MapPin className="w-5 h-5" />
                Browse Counties
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-[2px] bg-surface text-ink border border-ink font-semibold transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
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
              <h2 className="text-heading font-semibold text-ink mb-4 text-center lg:text-left">
                Explore by Region
              </h2>
              <UKCountyMap
                counties={Object.entries(farmsByCounty).map(([name, farms]) => ({
                  name,
                  slug: slugifyCounty(name),
                  farmCount: farms.length,
                }))}
              />
              <p className="mt-4 text-small text-ink-muted text-center">
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
                  href={`/counties/${slugifyCounty(county)}`}
                  className="group block bg-surface rounded-[2px] border border-border p-4 sm:p-5 hover:border-border-strong transition-colors duration-200"
                >
                  {/* Mobile: Stacked | Desktop: Horizontal */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    {/* County Name + Badge */}
                    <div className="flex items-center gap-3 sm:min-w-[280px]">
                      <h2 className="text-body font-semibold text-ink group-hover:text-brand transition-colors">
                        {county}
                      </h2>
                      <CountyDensityBadge count={countyFarms.length} />
                    </div>

                    {/* Farm Names - Hidden on mobile, shown on tablet+ */}
                    <div className="hidden sm:flex flex-1 items-center gap-2 text-caption text-ink-muted overflow-hidden">
                      {countyFarms.slice(0, 3).map((farm: { id: string; slug: string; name: string }, idx: number) => (
                        <span key={farm.id} className="flex items-center">
                          {idx > 0 && <span className="mx-2 text-ink-subtle">&middot;</span>}
                          <span className="truncate max-w-[150px]">{farm.name}</span>
                        </span>
                      ))}
                      {countyFarms.length > 3 && (
                        <span className="text-ink-muted ml-1">+{countyFarms.length - 3} more</span>
                      )}
                    </div>

                    {/* Mobile: Show farm count */}
                    <div className="sm:hidden text-small text-ink-muted">
                      {countyFarms.length} farm {countyFarms.length === 1 ? 'shop' : 'shops'}
                    </div>

                    {/* Arrow indicator */}
                    <div className="hidden sm:flex items-center text-ink-muted group-hover:text-brand transition-colors">
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
          <p className="text-ink-muted">
            Found {Object.keys(farmsByCounty).length} counties with {farms.length} farm shops across the UK.
          </p>
        </div>
      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </main>
  )
}
