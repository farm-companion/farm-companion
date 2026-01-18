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

      {/* CTA Section with Premium Parallax */}
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Multi-layer Parallax Background */}
        <div className="absolute inset-0">
          {/* Primary background with parallax */}
          <Image
            src="/counties.jpg"
            alt="UK countryside landscape with rolling hills and farmland"
            fill
            className="object-cover object-center transform scale-110 transition-transform duration-1000 ease-out"
            sizes="100vw"
            quality={80}
            priority
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />

          {/* Premium overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/40 via-transparent to-neutral-900/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/20 to-transparent" />

          {/* Subtle animated accent */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--brand-primary-rgb),0.15),transparent_50%)] animate-pulse" />
          </div>
        </div>

        {/* Content with premium styling */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          {/* Premium icon container */}
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-xl rounded-2xl mb-8 sm:mb-10 border border-white/20 shadow-2xl">
            <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>

          {/* Premium typography */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight text-white">
            Ready to
            <span className="block text-brand-primary drop-shadow-lg">Explore?</span>
          </h2>

          <p className="text-lg sm:text-xl md:text-2xl mb-10 sm:mb-14 text-white/90 max-w-3xl mx-auto px-4">
            Start your journey to discover amazing local farm shops today.
          </p>

          {/* Premium CTA button */}
          <Link
            href="/map"
            className="group inline-flex items-center justify-center gap-3 h-14 sm:h-16 px-8 sm:px-10 rounded-2xl text-base sm:text-lg font-semibold bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-2xl shadow-brand-primary/30 hover:shadow-3xl hover:shadow-brand-primary/40 hover:scale-105 hover:-translate-y-1 active:scale-100 active:translate-y-0 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          >
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
            Find Farms Near You
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>



      {/* Newsletter Section */}
      <section className="py-16 md:py-20 section-lazy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <NewsletterSignup />
        </div>
      </section>

      {/* SEO Content Section - Premium glassmorphism */}
      <section className="relative bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 overflow-hidden section-lazy">
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
          {/* Premium overlay */}
          <div className="absolute inset-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm" />
        </div>

        {/* Content Container - Premium card */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24">
          <div className="relative">
            {/* Premium glassmorphism card */}
            <div className="absolute inset-0 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-xl rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-2xl"></div>

            {/* Content */}
            <div className="relative z-10 p-8 md:p-12 lg:p-16">
              <div className="prose prose-lg max-w-none">
                {/* Premium heading */}
                <div className="text-center mb-14">
                  <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                    UK Farm Shops Directory
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-brand-primary to-brand-primary/60 mx-auto rounded-full"></div>
                </div>

                {/* Intro paragraph */}
                <div className="text-center mb-16">
                  <p className="text-lg text-neutral-700 dark:text-neutral-200 mb-6 leading-relaxed">
                    Welcome to Farm Companion, your comprehensive guide to UK farm shops. We&apos;ve curated
                    a directory of over <span className="font-bold text-brand-primary">{farmCount}</span> authentic farm shops across <span className="font-bold text-brand-primary">{countyCount}</span> counties,
                    helping you discover the freshest local produce and connect with real farmers.
                  </p>
                </div>

                {/* Content sections - Premium cards */}
                <div className="space-y-8">
                  <div className="p-6 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-700/50">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-brand-primary" />
                      </div>
                      Find Farm Shops Near You
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      Search for farm shops near you to buy fresh vegetables, organic meat, artisanal cheese,
                      and homemade preserves. Our interactive map shows verified contact details, opening hours,
                      and what each farm sells locally.
                    </p>
                  </div>

                  <div className="p-6 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-700/50">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-brand-primary" />
                      </div>
                      Seasonal Produce Guides
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      Buy seasonal UK fruit and vegetables at their peak flavour and nutritional value.
                      Our guides show what&apos;s in season each month, with tips on choosing, storing,
                      and cooking the freshest local produce.
                    </p>
                  </div>

                  <div className="p-6 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-700/50">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-brand-primary" />
                      </div>
                      Support Local Farmers
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      By choosing to shop at local farm shops, you&apos;re supporting British farmers and
                      contributing to sustainable, local food systems. You&apos;ll enjoy fresher produce,
                      reduce food miles, and help maintain the UK&apos;s rich agricultural heritage.
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
