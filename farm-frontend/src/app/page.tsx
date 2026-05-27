import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { getFarmStats } from '@/lib/farm-data'
import { SITE_URL } from '@/lib/site'
import { AnimatedHero } from '@/components/AnimatedHero'
import { OpenNowCTA } from '@/components/OpenNowCTA'

// Five-section homepage (brief §5). Removed: Site Statistics, social-proof
// ticker, "How It Works", "Taste the Difference"/animated features, and the
// Weekend Planner — see DESIGN_BRIEF §5/§11. Below-fold sections are lazy
// chunks loaded on demand.
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
  const { countyCount } = await getFarmStats()

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

      {/* Hero (brief §5.2) */}
      <AnimatedHero
        countyCount={countyCount}
      />

      {/* Worth the Detour — curated nearby picks (brief §5.3) */}
      <NearbyFarms limit={4} />

      {/* Browse by what you're after (brief §5.4) */}
      <CategoryGrid limit={8} />

      {/* Seasonal */}
      <SeasonalShowcase />

      {/* Journal (brief §5.5; newsletter lives in the footer) */}
      <FeaturedGuides />
    </div>
  )
}
// Deployment trigger
// Build fix Thu Sep  4 20:34:42 BST 2025
