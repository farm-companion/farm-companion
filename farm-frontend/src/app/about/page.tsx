/**
 * About Page
 *
 * Luxury editorial design matching the Best Farm Guides aesthetic.
 * Narrow text columns, serif headings, vertical line accents.
 *
 * WCAG AA Compliant: Uses semantic color system for dark/light mode support.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_URL } from '@/lib/site'
import { ScrollIndicator } from '@/components/best/editorial/ScrollIndicator'
import ObfuscatedEmail from '@/components/ObfuscatedEmail'

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
        url: `${SITE_URL}/about.jpg`,
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
    images: [`${SITE_URL}/about.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background-secondary">
      {/* Editorial Hero - Full bleed with minimalist typography */}
      <section data-header-invert className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/about.jpg"
            alt="Abundant display of fresh, colorful fruits and vegetables at a farm shop"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <div className="w-px h-16 bg-white/60 mb-8" aria-hidden="true" />

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal text-white tracking-tight leading-[1.1] max-w-4xl">
            About Farm Companion
          </h1>

          <p className="mt-6 text-sm md:text-base text-white/80 tracking-[0.15em] uppercase font-medium max-w-2xl">
            Real Food, Real People, Real Places
          </p>

          <div className="w-px h-16 bg-white/60 mt-8" aria-hidden="true" />
        </div>

        <ScrollIndicator targetId="#content" />
      </section>

      {/* Main Content */}
      <div id="content" className="py-24">
        {/* Introduction with drop cap */}
        <section className="max-w-2xl mx-auto px-6 mb-24">
          <p className="text-lg leading-[1.9] text-foreground first-letter:text-6xl first-letter:font-serif first-letter:float-left first-letter:mr-4 first-letter:mt-1 first-letter:text-foreground">
            Farm Companion is the UK&apos;s premium guide to discovering farm shops that sell fresh, seasonal food. We help you find trusted farm shops near you, with a clean map interface, beautiful profiles, and the essentials you need: address, opening hours, what they sell, and how to get there.
          </p>
        </section>

        {/* What We Do */}
        <section className="max-w-2xl mx-auto px-6 mb-24">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-center mb-12 text-foreground">
            What We Do
          </h2>

          <div className="space-y-6">
            <p className="text-lg leading-[1.9] text-foreground">
              We believe finding good food should be simple. Search by place, browse a clean map, and discover farm shops with beautiful, informative profiles. No endless lists or cluttered interfaces, just the information you need presented with care.
            </p>

            <div className="py-10 border-t border-b border-border my-12">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl md:text-5xl font-light text-foreground leading-none mb-2" style={{ fontWeight: 200 }}>
                    Map
                  </div>
                  <div className="text-xs tracking-[0.1em] uppercase text-foreground-muted">
                    First
                  </div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-light text-foreground leading-none mb-2" style={{ fontWeight: 200 }}>
                    Seasonal
                  </div>
                  <div className="text-xs tracking-[0.1em] uppercase text-foreground-muted">
                    Focus
                  </div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-light text-foreground leading-none mb-2" style={{ fontWeight: 200 }}>
                    Real
                  </div>
                  <div className="text-xs tracking-[0.1em] uppercase text-foreground-muted">
                    Stories
                  </div>
                </div>
              </div>
            </div>

            <p className="text-lg leading-[1.9] text-foreground">
              Use our seasonal calendar to see what&apos;s great right now, then filter the map to find shops that stock it. Planning a weekend? Build a short list and discover your next farm run.
            </p>
          </div>
        </section>

        {/* How We're Different */}
        <section className="mb-24">
          <figure className="relative w-screen left-1/2 -translate-x-1/2 mb-16">
            <div className="relative h-[40vh] min-h-[300px] max-h-[500px]">
              <Image
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80&auto=format"
                alt="Rolling green hills and countryside landscape"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          </figure>

          <div className="max-w-2xl mx-auto px-6">
            <h2 className="font-serif text-2xl md:text-3xl font-normal text-center mb-12 text-foreground">
              How We&apos;re Different
            </h2>

            <div className="space-y-12">
              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                  Made for Farm Food
                </h3>
                <p className="text-lg leading-[1.9] text-foreground">
                  Everything is tailored specifically for farm shops, not generic business listings. We understand the unique rhythm of seasonal produce, the importance of provenance, and the stories behind each farm.
                </p>
              </div>

              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                  Clean and Fast
                </h3>
                <p className="text-lg leading-[1.9] text-foreground">
                  No endless lists or cluttered interfaces. Just a clear map, concise cards, and the information you need presented with elegance and intention.
                </p>
              </div>

              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                  Honest Ranking
                </h3>
                <p className="text-lg leading-[1.9] text-foreground">
                  We prioritise verified, complete listings. Position is earned through quality of information, not advertising spend. Trust is built through transparency.
                </p>
              </div>

              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                  Privacy-First Maps
                </h3>
                <p className="text-lg leading-[1.9] text-foreground">
                  We use open, privacy-friendly mapping technology. Your location data stays with you, not with tracking companies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Verification */}
        <section className="max-w-2xl mx-auto px-6 mb-24">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-center mb-6 text-foreground">
            Trust & Verification
          </h2>

          <p className="text-center text-foreground-muted mb-12">
            Every shop shows a simple trust status
          </p>

          <div className="space-y-8">
            <div className="text-center py-6 border-t border-border">
              <div className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
                Owner-Confirmed
              </div>
              <p className="text-lg text-foreground">
                The owner reviewed and confirmed the details personally.
              </p>
            </div>

            <div className="text-center py-6 border-t border-border">
              <div className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
                Publicly Verified
              </div>
              <p className="text-lg text-foreground">
                Cross-checked against reputable public sources.
              </p>
            </div>

            <div className="text-center py-6 border-t border-b border-border">
              <div className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
                Under Review
              </div>
              <p className="text-lg text-foreground">
                We&apos;re checking the details. Basic information is available meanwhile.
              </p>
            </div>
          </div>

          <p className="text-center text-foreground-muted text-sm mt-8">
            See something wrong? Use the &ldquo;Suggest an update&rdquo; link on any shop page.
          </p>
        </section>

        {/* Pull Quote */}
        <section className="max-w-3xl mx-auto px-6 mb-24">
          <blockquote className="py-12 text-center">
            <p className="text-xl md:text-2xl lg:text-3xl font-serif italic text-foreground leading-relaxed">
              &ldquo;We help you find trusted farm shops near you, fast, clear, and without the clutter.&rdquo;
            </p>
          </blockquote>
        </section>

        {/* For Farm Shop Owners */}
        <section className="max-w-2xl mx-auto px-6 mb-24">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-center mb-12 text-foreground">
            Own a Farm Shop?
          </h2>

          <p className="text-lg leading-[1.9] text-foreground text-center mb-8">
            You can claim or add your listing for free. Highlight what makes you special and keep your details fresh. We also offer a premium option for additional visibility.
          </p>

          <div className="text-center">
            <Link
              href="/add"
              className="inline-block text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
            >
              Add Your Farm Shop
            </Link>
          </div>
        </section>

        {/* Privacy */}
        <section className="max-w-2xl mx-auto px-6 mb-24">
          <h2 className="font-serif text-2xl md:text-3xl font-normal text-center mb-12 text-foreground">
            Privacy & Advertising
          </h2>

          <p className="text-lg leading-[1.9] text-foreground text-center mb-6">
            We show light, respectful advertising to cover costs. Ads only load after you give consent. We don&apos;t sell personal data. You can change your cookie choices at any time.
          </p>

          <p className="text-center text-foreground-muted text-sm">
            Read our{' '}
            <Link href="/privacy" className="border-b border-foreground-muted hover:opacity-70 transition-opacity">
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link href="/terms" className="border-b border-foreground-muted hover:opacity-70 transition-opacity">
              Terms
            </Link>
          </p>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-6 mb-24">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-center mb-12 text-foreground">
            Questions & Answers
          </h2>

          <div className="space-y-12">
            <div>
              <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                Is Farm Companion Free?
              </h3>
              <p className="text-lg leading-[1.9] text-foreground">
                Yes. Browsing and adding a basic listing are completely free.
              </p>
            </div>

            <div>
              <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                Do You Take Commissions?
              </h3>
              <p className="text-lg leading-[1.9] text-foreground">
                No. We&apos;re an independent directory. Shops sell directly to you.
              </p>
            </div>

            <div>
              <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                How Current Is The Data?
              </h3>
              <p className="text-lg leading-[1.9] text-foreground">
                We review listings regularly and rely on owners and customers to flag changes. Look for the &ldquo;Updated&rdquo; date on each profile.
              </p>
            </div>

            <div>
              <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                How Do I Find Farm Shops Near Me?
              </h3>
              <p className="text-lg leading-[1.9] text-foreground">
                Use our interactive map to search by location, or browse by county. You can also search for specific produce like &ldquo;strawberries&rdquo; or &ldquo;organic meat&rdquo; to find farms that sell what you need.
              </p>
            </div>

            <div>
              <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                What&apos;s The Best Time To Buy Seasonal Produce?
              </h3>
              <p className="text-lg leading-[1.9] text-foreground">
                Check our seasonal guide to see what&apos;s in season each month. UK produce is typically at its peak during its natural growing season, offering better flavour and value.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="max-w-2xl mx-auto px-6 mb-24">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-center mb-8 text-foreground">
            Contact
          </h2>

          <p className="text-lg text-foreground text-center">
            Suggestions or corrections? Email us at{' '}
            <ObfuscatedEmail
              className="border-b border-foreground hover:opacity-70 transition-opacity"
            />
          </p>
        </section>

        {/* Footer CTA */}
        <section className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-px h-12 bg-border mx-auto mb-12" aria-hidden="true" />

          <div className="space-y-6">
            <Link
              href="/map"
              className="inline-block text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
            >
              Find Farm Shops Near Me
            </Link>

            <div className="flex items-center justify-center gap-6">
              <span className="w-12 h-px bg-border" aria-hidden="true" />
              <span className="text-xs tracking-[0.1em] uppercase text-foreground-muted">or</span>
              <span className="w-12 h-px bg-border" aria-hidden="true" />
            </div>

            <Link
              href="/seasonal"
              className="inline-block text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
            >
              Explore Seasonal Produce
            </Link>
          </div>

          <p className="text-xs tracking-[0.1em] uppercase text-foreground-muted mt-16">
            Made with care for local food
          </p>

          <div className="w-16 h-px bg-border mx-auto mt-8" aria-hidden="true" />
        </section>
      </div>
    </main>
  )
}
