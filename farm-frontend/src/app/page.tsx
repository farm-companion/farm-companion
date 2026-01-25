import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Leaf, Calendar, Heart, TrendingUp, Award, Clock } from 'lucide-react'
import NewsletterSignup from '@/components/NewsletterSignup'
import { getFarmStats } from '@/lib/farm-data'
import { SITE_URL } from '@/lib/site'
import { FeaturedGuides } from '@/components/FeaturedGuides'
import { CategoryGrid } from '@/components/CategoryGrid'
import { AnimatedHero } from '@/components/AnimatedHero'
import { AnimatedStats } from '@/components/AnimatedStats'
import { AnimatedFeatures } from '@/components/AnimatedFeatures'
import { SeasonalShowcase } from '@/components/SeasonalShowcase'
import { NearbyFarms } from '@/components/NearbyFarms'
import { OpenNowCTA } from '@/components/OpenNowCTA'
import { WeekendPlanner } from '@/components/WeekendPlanner'
import { SocialProofTicker } from '@/components/SocialProofTicker'

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
        videoSrc="/videos/hero-produce.mp4"
        videoPoster="/main_header.jpg"
      />

      {/* Social Proof Ticker */}
      <SocialProofTicker />

      {/* Social Proof Ticker */}
      <SocialProofTicker />

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

      {/* Weekend Planner Section */}
      <section className="py-12 md:py-16 section-lazy">
        <WeekendPlanner limit={4} />
      </section>

      {/* Animated Features Section */}
      <AnimatedFeatures />

      {/* CTA Section with Stylish Parallax */}
      <section className="relative py-20 md:py-28 lg:py-32 overflow-hidden">
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
          
          {/* Animated overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Static texture - animations removed for performance */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,255,79,0.05),transparent_50%)]" />
          </div>
        </div>

        {/* Content with enhanced styling */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          {/* Icon - static for performance */}
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-sm rounded-full mb-6 sm:mb-8 border border-white/20">
            <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>

          {/* Enhanced typography with staggered animation */}
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 sm:mb-8 leading-tight text-white drop-shadow-2xl animate-fade-in">
            Ready to
            <span className="block text-serum drop-shadow-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>Explore?</span>
          </h2>

          <p className="text-body sm:text-heading md:text-2xl mb-8 sm:mb-12 text-white/95 drop-shadow-lg max-w-3xl mx-auto animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
            Start your journey to discover amazing local farm shops today.
          </p>

          {/* Enhanced CTA button with hover effects */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link
              href="/map"
              className="group bg-serum text-black h-14 sm:h-16 px-8 sm:px-10 rounded-xl text-caption sm:text-body font-semibold hover:bg-serum/90 transition-all duration-300 inline-flex items-center justify-center gap-2 sm:gap-3 shadow-2xl hover:shadow-serum/25 hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serum focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
              Find Farms Near You
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>



      {/* Newsletter Section */}
      <section className="py-12 md:py-16 section-lazy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <NewsletterSignup />
        </div>
      </section>

      {/* SEO Content Section with Subtle Geometric Pattern */}
      <section className="relative bg-background-canvas border-t border-border-default overflow-hidden section-lazy">
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
          <div className="absolute inset-0 bg-background-canvas/85" />
          {/* Additional subtle texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background-canvas/20 via-transparent to-background-canvas/30" />
        </div>
        
        
        
        {/* Content Container with Enhanced Background */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          {/* Special Background Card for Content */}
          <div className="relative">
            {/* Solid white glass effect with window-like border */}
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border-4 border-white/70 dark:border-slate-700/70 shadow-2xl" style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}></div>
            
            {/* Content with proper spacing */}
            <div className="relative z-10 p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                {/* Enhanced main heading with maximum contrast */}
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 dark:text-slate-50 mb-4 animate-fade-in">
                    UK Farm Shops Directory
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-secondary-500 mx-auto rounded-full opacity-60 drop-shadow-sm"></div>
                </div>
                
                {/* Enhanced intro paragraph with maximum contrast */}
                <div className="text-center mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <p className="text-body text-slate-800 dark:text-slate-200 mb-6 leading-relaxed font-medium">
                    Welcome to Farm Companion, your comprehensive guide to UK farm shops. We&apos;ve curated
                    a directory of over <span className="font-bold text-primary-700 dark:text-primary-400">{farmCount}</span> authentic farm shops across <span className="font-bold text-primary-700 dark:text-primary-400">{countyCount}</span> counties,
                    helping you discover the freshest local produce and connect with real farmers.
                  </p>
                </div>
                
                {/* Enhanced content sections with maximum contrast */}
                <div className="space-y-12">
                  <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shadow-sm">
                        <MapPin className="w-4 h-4 text-primary-700 dark:text-primary-400" />
                      </div>
                      Find Farm Shops Near You
                    </h3>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      Search for farm shops near you to buy fresh vegetables, organic meat, artisanal cheese,
                      and homemade preserves. Our interactive map shows verified contact details, opening hours,
                      and what each farm sells locally.
                    </p>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center shadow-sm">
                        <Calendar className="w-4 h-4 text-secondary-700 dark:text-secondary-400" />
                      </div>
                      Seasonal Produce Guides
                    </h3>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      Buy seasonal UK fruit and vegetables at their peak flavour and nutritional value.
                      Our guides show what&apos;s in season each month, with tips on choosing, storing,
                      and cooking the freshest local produce.
                    </p>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
                    <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shadow-sm">
                        <Heart className="w-4 h-4 text-primary-700 dark:text-primary-400" />
                      </div>
                      Support Local Farmers
                    </h3>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
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
