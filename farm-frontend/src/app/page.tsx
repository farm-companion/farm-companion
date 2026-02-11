import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Calendar, Heart } from 'lucide-react'
import { getFarmStats } from '@/lib/farm-data'
import { SITE_URL } from '@/lib/site'
import { AnimatedHero } from '@/components/AnimatedHero'
import { OpenNowCTA } from '@/components/OpenNowCTA'

// Lazy-load below-fold sections to reduce initial JS bundle via code splitting.
// Each dynamic() call produces a separate chunk loaded on demand.
const SocialProofTicker = dynamic(
  () => import('@/components/SocialProofTicker').then(m => m.SocialProofTicker)
)
const AnimatedStats = dynamic(
  () => import('@/components/AnimatedStats').then(m => m.AnimatedStats)
)
const SeasonalShowcase = dynamic(
  () => import('@/components/SeasonalShowcase').then(m => m.SeasonalShowcase)
)
const FeaturedGuides = dynamic(
  () => import('@/components/FeaturedGuides').then(m => m.FeaturedGuides)
)
const CategoryGrid = dynamic(
  () => import('@/components/CategoryGrid').then(m => m.CategoryGrid)
)
const NearbyFarms = dynamic(
  () => import('@/components/NearbyFarms').then(m => m.NearbyFarms)
)
const WeekendPlanner = dynamic(
  () => import('@/components/WeekendPlanner').then(m => m.WeekendPlanner)
)
const AnimatedFeatures = dynamic(
  () => import('@/components/AnimatedFeatures').then(m => m.AnimatedFeatures)
)
const NewsletterSignup = dynamic(
  () => import('@/components/NewsletterSignup')
)

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Farm Companion — UK Farm Shops Directory',
    description: 'Discover authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information. Find farm shops near you, farmshopsnearme, farm shop near you with our interactive map and location-based search.',
    keywords: [
      'farm shops', 'UK farm shops', 'local produce', 'fresh food', 'farm directory', 
      'farm shop near me', 'farmshopsnearme', 'farm shop near you', 'farms near me', 
      'local farms', 'seasonal produce', 'farm fresh', 'UK farms', 'farm shop directory', 
      'local food', 'farm to table', 'farm shops near me', 'farm shops near you',
      'farm shop directory near me', 'farm shops UK', 'local farm shops', 'farm shop finder',
      'farm shops map', 'farm shop locations', 'farm shop search', 'farm shop locator',
      'farm shops in my area', 'farm shops nearby', 'farm shops close to me',
      'farm shop directory UK', 'farm shop finder near me', 'farm shop search near me'
    ],
    openGraph: {
      title: 'Farm Companion — UK Farm Shops Directory',
      description: 'Find trusted farm shops near you, farmshopsnearme, farm shop near you with verified information and the freshest local produce. Use our interactive map to discover farm shops in your area.',
      url: SITE_URL,
      siteName: 'Farm Companion',
      images: [
        {
          url: '/og.jpg',
          width: 1200,
          height: 630,
          alt: 'Farm Companion - UK farm shops directory',
        },
      ],
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Farm Companion — UK Farm Shops Directory',
      description: 'Find trusted farm shops near you, farmshopsnearme, farm shop near you with verified information and the freshest local produce. Use our interactive map to discover farm shops in your area.',
      images: ['/og.jpg'],
    },
    alternates: {
      canonical: '/',
    },
  }
}

// Enable ISR for better TTFB performance
export const revalidate = 3600 // Revalidate every hour

export default async function HomePage() {
  const { farmCount, countyCount } = await getFarmStats()

  return (
    <div className="min-h-screen bg-background-canvas">
      {/* Structured Data - Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Farm Companion',
            url: 'https://farmcompanion.co.uk',
            logo: 'https://farmcompanion.co.uk/logo.png',
            description: 'UK farm shops directory helping you find fresh local produce, farm shops, and agricultural businesses across the UK.',
            sameAs: [
              // Add social media URLs when available
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              availableLanguage: 'English',
            },
          }),
        }}
      />

      {/* Structured Data - WebSite */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Farm Companion',
            url: 'https://farmcompanion.co.uk',
            description: 'Discover authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information.',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://farmcompanion.co.uk/shop?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      {/* Floating Open Now CTA */}
      <OpenNowCTA variant="floating" />

      {/* Animated Hero Section */}
      <AnimatedHero
        countyCount={countyCount}
      />

      {/* Social Proof Ticker */}
      <SocialProofTicker />

      {/* Animated Stats Section */}
      <AnimatedStats farmCount={farmCount} countyCount={countyCount} />

      {/* Seasonal Showcase Section */}
      <SeasonalShowcase />

      {/* Featured Guides Section -- dark, bleeds downward into CategoryGrid */}
      <div className="relative">
        <FeaturedGuides />
        <div className="absolute inset-x-0 -bottom-24 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10" aria-hidden="true" />
      </div>

      {/* Category Grid Section */}
      <CategoryGrid limit={8} />

      {/* Nearby Farms Section -- dark, bleeds upward into CategoryGrid and downward into WeekendPlanner */}
      <div className="relative">
        <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-t from-[#050e05]/80 to-transparent pointer-events-none z-10" aria-hidden="true" />
        <NearbyFarms limit={4} />
        <div className="absolute inset-x-0 -bottom-24 h-24 bg-gradient-to-b from-[#050e05]/80 to-transparent pointer-events-none z-10" aria-hidden="true" />
      </div>

      {/* Weekend Planner Section */}
      <WeekendPlanner limit={4} />

      {/* Animated Features Section -- dark, bleeds upward into WeekendPlanner */}
      <div className="relative">
        <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-10" aria-hidden="true" />
        <AnimatedFeatures />
      </div>


      {/* Newsletter Section */}
      <section className="py-12 md:py-16 section-lazy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <NewsletterSignup />
        </div>
      </section>

      {/* SEO Content Section - LV Editorial */}
      <section className="bg-background-canvas dark:bg-[#0C0A09] border-t border-border-default section-lazy">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-20 md:py-28">
          {/* Heading block */}
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted mb-4 font-accent">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-heading mb-6 leading-tight">
              UK Farm Shops Directory
            </h2>
            <div className="w-12 h-px bg-border-strong mx-auto" />
          </div>

          {/* Intro */}
          <p className="text-center text-text-body leading-relaxed mb-14 max-w-2xl mx-auto">
            Over <span className="font-semibold text-text-heading">{farmCount}</span> verified farm shops across <span className="font-semibold text-text-heading">{countyCount}</span> counties.
            Search by location, by what's in season, or by what you're craving.
          </p>

          {/* Feature list */}
          <div className="space-y-10">
            <div className="flex gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background-surface dark:bg-background-elevated border border-border-default flex items-center justify-center">
                <MapPin className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-text-heading mb-2">
                  Search by Location
                </h3>
                <p className="text-text-body leading-relaxed">
                  Enter a postcode or town and see verified farm shops on the map. Each listing shows
                  contact details, opening hours, and what they sell.
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-border-subtle" />

            <div className="flex gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background-surface dark:bg-background-elevated border border-border-default flex items-center justify-center">
                <Calendar className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-text-heading mb-2">
                  Seasonal Produce Guides
                </h3>
                <p className="text-text-body leading-relaxed">
                  See what's in season each month and where to find it at its best.
                  Tips on choosing, storing, and cooking what's ripe right now.
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-border-subtle" />

            <div className="flex gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background-surface dark:bg-background-elevated border border-border-default flex items-center justify-center">
                <Heart className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-text-heading mb-2">
                  Every Listing Verified
                </h3>
                <p className="text-text-body leading-relaxed">
                  We check opening hours, confirm named suppliers, and verify that each shop
                  sells produce with a genuine connection to farming. No glorified delis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
// Deployment trigger
// Build fix Thu Sep  4 20:34:42 BST 2025
