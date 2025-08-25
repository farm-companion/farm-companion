import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Leaf, Calendar, Heart } from 'lucide-react'
import NewsletterSignup from '@/components/NewsletterSignup'
import { getFarmStats } from '@/lib/farm-data'

export const metadata: Metadata = {
  title: 'Farm Companion — UK Farm Shops Directory',
  description: 'Discover 1,300+ authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information. Find farm shops near you with our interactive map.',
  keywords: ['farm shops', 'UK farm shops', 'local produce', 'fresh food', 'farm directory', 'farm shop near me', 'local farms', 'seasonal produce', 'farm fresh', 'UK farms', 'farm shop directory', 'local food', 'farm to table'],
  openGraph: {
    title: 'Farm Companion — UK Farm Shops Directory',
    description: 'Find trusted farm shops near you with verified information and the freshest local produce.',
    url: 'https://farmcompanion.co.uk',
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
    description: 'Find trusted farm shops near you with verified information and the freshest local produce.',
    images: ['/og.jpg'],
  },
  alternates: {
    canonical: '/',
  },
}

export default async function HomePage() {
  const { farmCount, countyCount } = await getFarmStats()

  return (
    <main className="min-h-screen bg-background-canvas">
      {/* Professional Hero Section with Image Overlay */}
      <section className="relative h-screen min-h-[600px] max-h-[800px] overflow-hidden">
        {/* Background Image with Professional Handling */}
        <div className="absolute inset-0">
          <Image
            src="/overlay-banner.jpg"
            alt="Fresh local produce and flowers from UK farm shops"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
                  {/* Professional Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
        {/* Subtle texture overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        </div>
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Find Fresh Local
              <span className="block text-serum drop-shadow-lg">Farm Shops</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Discover {farmCount}+ authentic UK farm shops with the freshest local produce, 
              seasonal delights, and farm-fresh goodness near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/map"
                className="bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl backdrop-blur-sm"
              >
                <MapPin className="w-5 h-5" />
                Explore Farm Map
              </Link>
              <Link
                href="/seasonal"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
              >
                What&apos;s in Season
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Subtle Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-background-canvas border-b border-border-default">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
            <div>
              <div className="text-4xl font-heading font-bold text-serum mb-2">{farmCount}+</div>
              <div className="text-text-muted">Farm Shops</div>
            </div>
            <div>
              <div className="text-4xl font-heading font-bold text-serum mb-2">{countyCount}</div>
              <div className="text-text-muted">Counties</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background-surface py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-heading mb-4">
              Why Choose Farm Shops?
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-12">
              Experience the difference of truly fresh, local produce from family-run farms across the UK.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-background-canvas border border-border-default">
              <div className="w-16 h-16 bg-serum/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading mb-2">Fresh & Local</h3>
              <p className="text-text-muted">Direct from farm to table, ensuring maximum freshness and flavor.</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-background-canvas border border-border-default">
              <div className="w-16 h-16 bg-serum/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading mb-2">Seasonal Selection</h3>
              <p className="text-text-muted">Discover what&apos;s in season and at its peak flavor throughout the year.</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-background-canvas border border-border-default">
              <div className="w-16 h-16 bg-serum/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading mb-2">Family Values</h3>
              <p className="text-text-muted">Support local families and sustainable farming practices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Stylish Parallax */}
      <section className="relative py-32 overflow-hidden">
        {/* Multi-layer Parallax Background */}
        <div className="absolute inset-0">
          {/* Primary background with parallax */}
          <div 
            className="absolute inset-0 bg-cover bg-center transform scale-110 transition-transform duration-1000 ease-out" 
            style={{ 
              backgroundImage: 'url(/counties.jpg)',
              backgroundAttachment: 'fixed',
              backgroundPosition: 'center 20%'
            }}
          />
          
          {/* Animated overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Subtle animated texture */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.1),transparent_50%)] animate-pulse" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,255,79,0.05),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
        
        {/* Content with enhanced styling */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Animated icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20 animate-bounce" style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}>
            <MapPin className="w-12 h-12 text-white" />
          </div>
          
          {/* Enhanced typography with staggered animation */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-8 leading-tight text-white drop-shadow-2xl animate-fade-in">
            Ready to
            <span className="block text-serum drop-shadow-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>Explore?</span>
          </h2>
          
          <p className="text-xl md:text-2xl mb-12 text-white/95 drop-shadow-lg max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Start your journey to discover amazing local farm shops today.
          </p>
          
          {/* Enhanced CTA button with hover effects */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link
              href="/map"
              className="group bg-serum text-black px-10 py-5 rounded-xl font-semibold hover:bg-serum/90 transition-all duration-300 inline-flex items-center justify-center gap-3 shadow-2xl hover:shadow-serum/25 hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              <MapPin className="w-6 h-6 transition-transform group-hover:scale-110" />
              Find Farms Near You
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>



      {/* Newsletter Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <NewsletterSignup />
        </div>
      </section>

      {/* SEO Content Section with Subtle Geometric Pattern */}
      <section className="relative bg-background-canvas border-t border-border-default overflow-hidden">
        {/* Subtle Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(0, 194, 178, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(212, 255, 79, 0.08) 0%, transparent 50%),
              linear-gradient(45deg, transparent 40%, rgba(0, 194, 178, 0.02) 50%, transparent 60%),
              linear-gradient(-45deg, transparent 40%, rgba(212, 255, 79, 0.02) 50%, transparent 60%)
            `,
            backgroundSize: '400px 400px, 300px 300px, 200px 200px, 150px 150px',
            backgroundPosition: '0 0, 100px 100px, 50px 50px, 25px 25px'
          }} />
        </div>
        
        {/* Subtle embossed texture overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(0, 194, 178, 0.01) 2px,
              rgba(0, 194, 178, 0.01) 4px
            )
          `,
          backgroundSize: '8px 8px'
        }} />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          <div className="prose prose-lg max-w-none">
            {/* Enhanced main heading with subtle animation */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-text-heading mb-4 animate-fade-in">
                UK Farm Shops Directory
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-serum to-solar mx-auto rounded-full opacity-60"></div>
            </div>
            
            {/* Enhanced intro paragraph with stats */}
            <div className="text-center mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-xl text-text-muted mb-6 leading-relaxed">
                Welcome to Farm Companion, your comprehensive guide to UK farm shops. We&apos;ve curated 
                a directory of over <span className="font-semibold text-serum">{farmCount}</span> authentic farm shops across <span className="font-semibold text-serum">{countyCount}</span> counties, 
                helping you discover the freshest local produce and connect with real farmers.
              </p>
            </div>
            
            {/* Enhanced content sections with subtle styling */}
            <div className="space-y-12">
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-2xl font-heading font-semibold text-text-heading mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-serum/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-serum" />
                  </div>
                  Find Farm Shops Near You
                </h3>
                <p className="text-text-muted leading-relaxed">
                  Whether you&apos;re looking for fresh vegetables, organic meat, artisanal cheese, or 
                  homemade preserves, our interactive map makes it easy to find farm shops in your area. 
                  Each listing includes verified contact information, opening hours, and details about 
                  what each farm offers.
                </p>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-2xl font-heading font-semibold text-text-heading mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-serum/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-serum" />
                  </div>
                  Seasonal Produce Guides
                </h3>
                <p className="text-text-muted leading-relaxed">
                  Eating seasonally means enjoying produce at its peak flavour and nutritional value. 
                  Our seasonal guides help you understand what&apos;s in season throughout the year, 
                  with tips on selection, storage, and preparation for the freshest ingredients.
                </p>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <h3 className="text-2xl font-heading font-semibold text-text-heading mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-serum/10 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-serum" />
                  </div>
                  Support Local Farmers
                </h3>
                <p className="text-text-muted leading-relaxed">
                  By choosing to shop at local farm shops, you&apos;re supporting British farmers and 
                  contributing to sustainable, local food systems. You&apos;ll enjoy fresher produce, 
                  reduce food miles, and help maintain the UK&apos;s rich agricultural heritage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
