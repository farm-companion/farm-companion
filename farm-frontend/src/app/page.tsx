import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Leaf, Calendar, Heart, TrendingUp, Award, Clock } from 'lucide-react'
import NewsletterSignup from '@/components/NewsletterSignup'
import { getFarmStatsServer } from '@/lib/farm-data-server'
import { SITE_URL } from '@/lib/site'
import { FeaturedGuides } from '@/components/FeaturedGuides'
import { CategoryGrid } from '@/components/CategoryGrid'
import { AnimatedHero } from '@/components/AnimatedHero'
import { AnimatedStats } from '@/components/AnimatedStats'
import { AnimatedFeatures } from '@/components/AnimatedFeatures'
import { SeasonalShowcase } from '@/components/SeasonalShowcase'
import { NearbyFarms } from '@/components/NearbyFarms'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Farm Companion — UK Farm Shops Directory',
    description:
      'Discover authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information. Find farm shops near you, farmshopsnearme, farm shop near you with our interactive map and location-based search.',
    keywords: [
      'farm shops',
      'UK farm shops',
      'local produce',
      'fresh food',
      'farm directory',
      'farm shop near me',
      'farmshopsnearme',
      'farm shop near you',
      'farms near me',
      'local farms',
      'seasonal produce',
      'farm fresh',
      'UK farms',
      'farm shop directory',
      'local food',
      'farm to table',
      'farm shops near me',
      'farm shops near you',
      'farm shop directory near me',
      'farm shops UK',
      'local farm shops',
      'farm shop finder',
      'farm shops map',
      'farm shop locations',
      'farm shop search',
      'farm shop locator',
      'farm shops in my area',
      'farm shops nearby',
      'farm shops close to me',
      'farm shop directory UK',
      'farm shop finder near me',
      'farm shop search near me',
    ],
    openGraph: {
      title: 'Farm Companion — UK Farm Shops Directory',
      description:
        'Find trusted farm shops near you, farmshopsnearme, farm shop near you with verified information and the freshest local produce. Use our interactive map to discover farm shops in your area.',
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
      description:
        'Find trusted farm shops near you, farmshopsnearme, farm shop near you with verified information and the freshest local produce. Use our interactive map to discover farm shops in your area.',
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
  const { farmCount, countyCount } = await getFarmStatsServer()

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
            description:
              'UK farm shops directory helping you find fresh local produce, farm shops, and agricultural businesses across the UK.',
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
            description:
              'Discover authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information.',
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

      {/* Animated Hero Section */}
      <AnimatedHero countyCount={countyCount} />

      {/* Animated Stats Section */}
      <AnimatedStats farmCount={farmCount} countyCount={countyCount} />

      {/* Seasonal Showcase Section */}
      <SeasonalShowcase />

      {/* Featured Guides Section */}
      <FeaturedGuides />

      {/* Category Grid Section */}
      <CategoryGrid limit={8} />

      {/* Nearby Farms Section */}
      <NearbyFarms limit={4} />

      {/* Animated Features Section */}
      <AnimatedFeatures />

      {/* CTA Section with Stylish Parallax */}
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
        {/* Multi-layer Parallax Background */}
        <div className="absolute inset-0">
          {/* Primary background with parallax */}
          <Image
            src="/counties.jpg"
            alt="UK countryside landscape with rolling hills and farmland"
            fill
            className="scale-110 transform object-cover object-center transition-transform duration-1000 ease-out"
            sizes="100vw"
            quality={80}
            priority
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />

          {/* Animated overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Subtle animated texture */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.1),transparent_50%)]" />
            <div
              className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_70%_80%,rgba(212,255,79,0.05),transparent_50%)]"
              style={{ animationDelay: '1s' }}
            />
          </div>
        </div>

        {/* Content with enhanced styling */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6">
          {/* Animated icon */}
          <div
            className="mb-6 inline-flex h-20 w-20 animate-bounce items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm sm:mb-8 sm:h-24 sm:w-24"
            style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}
          >
            <MapPin className="h-10 w-10 text-white sm:h-12 sm:w-12" />
          </div>

          {/* Enhanced typography with staggered animation */}
          <h2 className="mb-6 animate-fade-in font-heading text-3xl font-bold leading-tight text-white drop-shadow-2xl sm:mb-8 sm:text-4xl md:text-6xl lg:text-7xl">
            Ready to
            <span
              className="animate-slide-up block text-brand-primary drop-shadow-2xl"
              style={{ animationDelay: '0.2s' }}
            >
              Explore?
            </span>
          </h2>

          <p
            className="mx-auto mb-8 max-w-3xl animate-fade-in px-4 text-lg text-white/95 drop-shadow-lg sm:mb-12 sm:text-xl md:text-2xl"
            style={{ animationDelay: '0.4s' }}
          >
            Start your journey to discover amazing local farm shops today.
          </p>

          {/* Enhanced CTA button with hover effects */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link
              href="/map"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-brand-primary px-8 text-sm font-semibold text-black shadow-premium-xl backdrop-blur-sm transition-[background-color,transform,box-shadow] duration-150 hover:bg-brand-primary/90 hover:shadow-premium-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98] sm:gap-3 sm:px-10 sm:text-base"
            >
              <MapPin className="h-5 w-5 transition-transform group-hover:scale-110 sm:h-6 sm:w-6" />
              Find Farms Near You
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-lazy py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <NewsletterSignup />
        </div>
      </section>

      {/* SEO Content Section with Subtle Geometric Pattern */}
      <section className="section-lazy relative overflow-hidden border-t border-border-default bg-background-canvas">
        {/* Orange Grove Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/oranges-background.jpg"
            alt="Vibrant orange grove with wooden table and fresh oranges, representing the natural beauty of farm produce"
            fill
            className="object-cover object-center blur-sm"
            sizes="100vw"
            quality={80}
            priority={false}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
          {/* Subtle overlay to ensure text readability */}
          <div className="bg-background-canvas/85 absolute inset-0" />
          {/* Additional subtle texture overlay */}
          <div className="from-background-canvas/20 to-background-canvas/30 absolute inset-0 bg-gradient-to-br via-transparent" />
        </div>

        {/* Content Container with Enhanced Background */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-20">
          {/* Special Background Card for Content */}
          <div className="relative">
            {/* Solid white glass effect with window-like border */}
            <div
              className="bg-background-surface/60 dark:bg-background-canvas/80 absolute inset-0 rounded-2xl border-4 border-border-default shadow-premium-xl backdrop-blur-md"
              style={{
                boxShadow:
                  '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              }}
            ></div>

            {/* Content with proper spacing */}
            <div className="relative z-10 p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                {/* Enhanced main heading with maximum contrast */}
                <div className="mb-12 text-center">
                  <h2 className="mb-4 animate-fade-in font-heading text-3xl font-bold text-text-heading md:text-4xl">
                    UK Farm Shops Directory
                  </h2>
                  <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-brand-primary to-solar opacity-60 drop-shadow-sm"></div>
                </div>

                {/* Enhanced intro paragraph with maximum contrast */}
                <div
                  className="mb-16 animate-fade-in text-center"
                  style={{ animationDelay: '0.2s' }}
                >
                  <p className="mb-6 text-lg font-medium leading-relaxed text-text-body">
                    Welcome to Farm Companion, your comprehensive guide to UK farm shops. We&apos;ve
                    curated a directory of over{' '}
                    <span className="font-bold text-brand-primary">{farmCount}</span> authentic farm
                    shops across <span className="font-bold text-brand-primary">{countyCount}</span>{' '}
                    counties, helping you discover the freshest local produce and connect with real
                    farmers.
                  </p>
                </div>

                {/* Enhanced content sections with maximum contrast */}
                <div className="space-y-12">
                  <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <h3 className="mb-4 flex items-center gap-3 font-heading text-xl font-semibold text-text-heading">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 shadow-sm">
                        <MapPin className="h-4 w-4 text-brand-primary" />
                      </div>
                      Find Farm Shops Near You
                    </h3>
                    <p className="font-medium leading-relaxed text-text-body">
                      Search for farm shops near you to buy fresh vegetables, organic meat,
                      artisanal cheese, and homemade preserves. Our interactive map shows verified
                      contact details, opening hours, and what each farm sells locally.
                    </p>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <h3 className="mb-4 flex items-center gap-3 font-heading text-xl font-semibold text-text-heading">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 shadow-sm">
                        <Calendar className="h-4 w-4 text-brand-primary" />
                      </div>
                      Seasonal Produce Guides
                    </h3>
                    <p className="font-medium leading-relaxed text-text-body">
                      Buy seasonal UK fruit and vegetables at their peak flavour and nutritional
                      value. Our guides show what&apos;s in season each month, with tips on
                      choosing, storing, and cooking the freshest local produce.
                    </p>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
                    <h3 className="mb-4 flex items-center gap-3 font-heading text-xl font-semibold text-text-heading">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 shadow-sm">
                        <Heart className="h-4 w-4 text-brand-primary" />
                      </div>
                      Support Local Farmers
                    </h3>
                    <p className="font-medium leading-relaxed text-text-body">
                      By choosing to shop at local farm shops, you&apos;re supporting British
                      farmers and contributing to sustainable, local food systems. You&apos;ll enjoy
                      fresher produce, reduce food miles, and help maintain the UK&apos;s rich
                      agricultural heritage.
                    </p>
                  </div>
                </div>
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
