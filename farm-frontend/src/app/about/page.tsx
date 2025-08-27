import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { MapPin } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { Users } from 'lucide-react'
import { Shield } from 'lucide-react'
import { Leaf } from 'lucide-react'
import { Star } from 'lucide-react'
import { Mail } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { Check } from 'lucide-react'
import { Search } from 'lucide-react'
import { Clock } from 'lucide-react'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About Farm Companion | UK Farm Shops Directory',
  description: 'Learn about Farm Companion, the UK\'s premium guide to real food, real people, and real places. Discover how we help you find trusted farm shops near you.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'About Farm Companion | UK Farm Shops Directory',
    description: 'Learn about Farm Companion, the UK\'s premium guide to real food, real people, and real places.',
    url: `${SITE_URL}/about`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/about-header.jpg`,
        width: 1200,
        height: 630,
        alt: 'About Farm Companion - UK farm shops directory',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Farm Companion | UK Farm Shops Directory',
    description: 'Learn about Farm Companion, the UK\'s premium guide to real food, real people, and real places.',
    images: [`${SITE_URL}/about-header.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function AboutPage() {
  return (
    <main className="bg-background-canvas">
      {/* Professional Hero Section with About Page Image */}
      <section className="relative h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden">
        {/* Background Image with Professional Handling */}
        <div className="absolute inset-0">
          <Image
            src="/about-header.jpg"
            alt="Abundant display of fresh, colorful fruits and vegetables including red tomatoes, orange carrots, green leafy vegetables, and purple berries, arranged in wooden crates and baskets at a farm shop"
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
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              About Farm
              <span className="block text-serum drop-shadow-lg">Companion</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              The UK&apos;s premium guide to real food, real people, and real places.
            </p>
            <p className="text-lg text-white/80 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              We help you find trusted farm shops near you—fast, clear, and without the clutter.
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
                href="#about-content"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
              >
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div id="about-content" className="mx-auto max-w-4xl px-6 py-12">

      {/* What we do - Clarity Pillar: Information */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-text-heading font-heading">
              What we do
            </h2>
            <p className="text-lg text-text-body leading-relaxed">
              Farm Companion makes it easy to discover farm shops that sell fresh, seasonal food.
              Search by place, browse a clean map, and open beautiful, simple profiles with the
              essentials: address, opening hours, what they sell, and how to get there.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-serum/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-serum" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-heading">Map-first</h3>
                  <p className="text-text-body">See nearby shops at a glance.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-serum/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-serum" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-heading">Seasonal focus</h3>
                  <p className="text-text-body">Check what&apos;s in season and who sells it.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-serum/10 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-serum" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-heading">Real stories</h3>
                  <p className="text-text-body">Meet the people behind the produce.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-background-surface rounded-2xl p-8 border border-border-default">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-serum rounded-full"></div>
                <span className="text-sm font-medium text-text-muted">Live Map</span>
              </div>
              <div className="h-48 bg-gradient-to-br from-serum/20 to-solar/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-12 h-12 text-serum/60" />
              </div>
              <p className="text-sm text-text-muted text-center">
                Interactive map showing nearby farm shops
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How we differ - Clarity Pillar: Hierarchy */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-text-heading font-heading text-center mb-12">
          How we&apos;re different
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-background-surface rounded-xl p-6 border border-border-default hover:border-serum/30 transition-colors duration-300">
            <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-serum" />
            </div>
            <h3 className="font-semibold text-text-heading mb-2">Made for farm food</h3>
            <p className="text-text-body text-sm">Everything is tailored to farm shops, not generic businesses.</p>
          </div>
          <div className="bg-background-surface rounded-xl p-6 border border-border-default hover:border-serum/30 transition-colors duration-300">
            <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-serum" />
            </div>
            <h3 className="font-semibold text-text-heading mb-2">Clean and fast</h3>
            <p className="text-text-body text-sm">No endless lists; just a clear map and concise cards.</p>
          </div>
          <div className="bg-background-surface rounded-xl p-6 border border-border-default hover:border-serum/30 transition-colors duration-300">
            <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-serum" />
            </div>
            <h3 className="font-semibold text-text-heading mb-2">Honest ranking</h3>
            <p className="text-text-body text-sm">We prioritise verified, complete listings—not ad spend.</p>
          </div>
          <div className="bg-background-surface rounded-xl p-6 border border-border-default hover:border-serum/30 transition-colors duration-300">
            <div className="w-12 h-12 bg-serum/10 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-serum" />
            </div>
            <h3 className="font-semibold text-text-heading mb-2">Open maps</h3>
            <p className="text-text-body text-sm">We use open, privacy-friendly maps (no Google tracking).</p>
          </div>
        </div>
      </section>

      {/* Trust & verification - Clarity Pillar: Emotion */}
      <section className="mb-16 bg-background-surface rounded-2xl p-8 border border-border-default">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-serum/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-serum" />
          </div>
          <h2 className="text-3xl font-bold text-text-heading font-heading mb-4">
            Trust & verification
          </h2>
          <p className="text-lg text-text-body">Every shop shows a simple trust status:</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-text-heading mb-2">Owner-confirmed</h3>
            <p className="text-text-body text-sm">The owner reviewed and confirmed the details.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-text-heading mb-2">Publicly verified</h3>
            <p className="text-text-body text-sm">Cross-checked against reputable public sources.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-text-heading mb-2">Under review</h3>
            <p className="text-text-body text-sm">We&apos;re checking; basic details are available meanwhile.</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-text-muted">
            See something wrong? Use the &ldquo;Suggest an update&rdquo; link on any shop page.
          </p>
        </div>
      </section>

      {/* Seasonal food - Clarity Pillar: Action */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-serum/5 to-solar/5 rounded-2xl p-8 border border-serum/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text-heading font-heading mb-4">
              Seasonal food, simply
            </h2>
            <p className="text-lg text-text-body max-w-2xl mx-auto">
              Use our seasonal calendar to see what&apos;s great right now—then filter the map to find
              shops that stock it. Planning a weekend? Build a short list and print your &ldquo;farm run&rdquo;.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/seasonal" 
              className="btn-secondary group flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>What&apos;s in season?</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link 
              href="/map" 
              className="btn-primary group flex items-center justify-center space-x-2"
            >
              <MapPin className="w-4 h-4" />
              <span>Open the map</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Own a farm shop - Clarity Pillar: Action */}
      <section className="mb-16">
        <div className="bg-background-surface rounded-2xl p-8 border border-border-default">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-text-heading font-heading mb-4">
              Own a farm shop?
            </h2>
            <p className="text-lg text-text-body max-w-2xl mx-auto">
              You can claim or add your listing for free. Highlight what makes you special and keep
              your details fresh. We also offer a premium highlight option for extra visibility.
            </p>
          </div>
          <div className="text-center">
            <Link 
              href="/add" 
              className="btn-secondary group inline-flex items-center space-x-2"
            >
              <span>Add a Farm Shop</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy & ads - Clarity Pillar: Information */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-midnight/5 to-obsidian/5 rounded-2xl p-8 border border-border-default">
          <h2 className="text-3xl font-bold text-text-heading font-heading text-center mb-6">
            Privacy & ads
          </h2>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-lg text-text-body mb-4">
              We show <strong>light, respectful ads</strong> to cover costs. Ads only load after you give consent.
              We don&apos;t sell personal data. You can change your cookie choices any time.
            </p>
            <p className="text-sm text-text-muted">
              Read our <Link href="/privacy" className="text-text-link hover:underline font-medium">Privacy Policy</Link> and <Link href="/terms" className="text-text-link hover:underline font-medium">Terms</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ - Clarity Pillar: Information */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-text-heading font-heading text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="max-w-2xl mx-auto space-y-4">
          <details className="group bg-background-surface rounded-xl border border-border-default overflow-hidden">
            <summary className="cursor-pointer p-6 font-semibold text-text-heading flex items-center justify-between hover:bg-background-canvas transition-colors duration-200">
              Is Farm Companion free?
              <ChevronDown className="w-5 h-5 text-text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-text-body">Yes. Browsing and adding a basic listing are free.</p>
            </div>
          </details>
          <details className="group bg-background-surface rounded-xl border border-border-default overflow-hidden">
            <summary className="cursor-pointer p-6 font-semibold text-text-heading flex items-center justify-between hover:bg-background-canvas transition-colors duration-200">
              Do you take commissions?
              <ChevronDown className="w-5 h-5 text-text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-text-body">No. We&apos;re an independent directory. Shops sell directly to you.</p>
            </div>
          </details>
          <details className="group bg-background-surface rounded-xl border border-border-default overflow-hidden">
            <summary className="cursor-pointer p-6 font-semibold text-text-heading flex items-center justify-between hover:bg-background-canvas transition-colors duration-200">
              How current is the data?
              <ChevronDown className="w-5 h-5 text-text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-text-body">
                We review listings regularly and rely on owners and customers to flag changes. Look for the
                &ldquo;Updated&rdquo; date on each profile.
              </p>
            </div>
          </details>
          <details className="group bg-background-surface rounded-xl border border-border-default overflow-hidden">
            <summary className="cursor-pointer p-6 font-semibold text-text-heading flex items-center justify-between hover:bg-background-canvas transition-colors duration-200">
              How do I find farm shops near me?
              <ChevronDown className="w-5 h-5 text-text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-text-body">
                Use our interactive map to search by location, or browse by county. You can also search for specific produce like &ldquo;strawberries&rdquo; or &ldquo;organic meat&rdquo; to find farms that sell what you need.
              </p>
            </div>
          </details>
          <details className="group bg-background-surface rounded-xl border border-border-default overflow-hidden">
            <summary className="cursor-pointer p-6 font-semibold text-text-heading flex items-center justify-between hover:bg-background-canvas transition-colors duration-200">
              What&apos;s the best time to buy seasonal produce?
              <ChevronDown className="w-5 h-5 text-text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-text-body">
                Check our seasonal guide to see what&apos;s in season each month. UK produce is typically at its peak during its natural growing season, offering better flavour and value.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* Contact - Clarity Pillar: Navigation */}
      <section className="mb-16 text-center">
        <div className="bg-background-surface rounded-2xl p-8 border border-border-default">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-serum/10 rounded-full mb-4">
            <Mail className="w-8 h-8 text-serum" />
          </div>
          <h2 className="text-3xl font-bold text-text-heading font-heading mb-4">
            Contact
          </h2>
          <p className="text-lg text-text-body mb-4">
            Suggestions or corrections? Email us at{' '}
            <a 
              className="text-text-link hover:underline font-medium" 
              href="mailto:hello@farmcompanion.co.uk"
            >
              hello@farmcompanion.co.uk
            </a>
          </p>
        </div>
      </section>

      {/* CTA Footer - Clarity Pillar: Action */}
      <footer className="text-center space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/map" 
            className="btn-primary group flex items-center justify-center space-x-2"
          >
            <MapPin className="w-4 h-4" />
            <span>Find farm shops near me</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link 
            href="/add" 
            className="btn-secondary group flex items-center justify-center space-x-2"
          >
            <span>Add a Farm Shop</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <p className="text-sm text-text-muted">
          Made with ❤️ for local food • Open source
        </p>
      </footer>
      </div>
    </main>
  )
}
