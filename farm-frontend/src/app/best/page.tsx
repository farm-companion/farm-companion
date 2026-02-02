/**
 * Best Farm Guides - Luxury Editorial Index
 *
 * Design principles:
 * - Paper White (#F9F9F9) and Deep Charcoal (#1A1A1A)
 * - Rule of 80/20: 80% visual, 20% functional
 * - Staggered asymmetry with large gutters
 * - No shadows, no rounded corners, clean horizontal rules
 */

import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { bestLists } from '@/data/best-lists'
import {
  EditorialHero,
  AsymmetricalGrid,
  EditorialCard,
  DataCallout,
  PillarCarousel,
} from '@/components/best/editorial'

export const metadata: Metadata = {
  title: 'Best Farm Guides | Farm Companion',
  description: 'Expertly curated guides to the finest farms across the UK. Handpicked recommendations for organic farms, pick your own, and farm cafes.',
  openGraph: {
    title: 'Best Farm Guides | Farm Companion',
    description: 'Expertly curated guides to the finest farms across the UK.',
    type: 'website',
    url: 'https://farmcompanion.co.uk/best',
  },
  alternates: {
    canonical: 'https://farmcompanion.co.uk/best',
  },
}

// Curated editorial images - atmospheric, magazine-quality photography
// IMPORTANT: No images of people, pigs, or bacon allowed
const EDITORIAL_IMAGES: Record<string, { src: string; alt: string }> = {
  'best-organic-farms-uk': {
    src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80&auto=format',
    alt: 'Greenhouse rows with organic seedlings in afternoon light',
  },
  'top-pick-your-own-farms': {
    src: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1200&q=80&auto=format',
    alt: 'Sun-drenched strawberry fields ready for harvest',
  },
  'best-farm-shops-london': {
    src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80&auto=format',
    alt: 'Artisan produce display in rustic farm shop',
  },
  'top-farm-cafes-uk': {
    src: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1200&q=80&auto=format',
    alt: 'Rustic farmhouse cafe with morning light',
  },
  'best-lavender-farms': {
    src: 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=1200&q=80&auto=format',
    alt: 'Purple lavender fields stretching to the horizon',
  },
  'best-farmers-markets-uk': {
    src: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80&auto=format',
    alt: 'Vibrant farmers market stall at dawn',
  },
  'top-veg-box-schemes-uk': {
    src: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80&auto=format',
    alt: 'Freshly harvested seasonal vegetables in wooden crate',
  },
  'best-farm-school-visits-uk': {
    src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80&auto=format',
    alt: 'Pastoral farmland with grazing sheep',
  },
  'top-ice-cream-farms-uk': {
    src: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=1200&q=80&auto=format',
    alt: 'Dairy cows in lush green pasture',
  },
  'best-cheese-makers-uk': {
    src: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=1200&q=80&auto=format',
    alt: 'Artisan cheese wheels aging in cellar',
  },
}

// Default image - atmospheric farm landscape
const DEFAULT_IMAGE = {
  src: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1200&q=80&auto=format',
  alt: 'Golden hour over British farmland',
}

export default function BestGuidesPage() {
  const featuredLists = bestLists.filter((list) => list.featured)
  const allLists = bestLists

  // Get first featured guide for hero
  const heroGuide = featuredLists[0]

  // Stats for data callout
  const stats = [
    { value: `${bestLists.length}`, label: 'Curated Guides', sublabel: 'And growing' },
    { value: '1,300+', label: 'Farms Listed', sublabel: 'Across the UK' },
    { value: '92', label: 'Counties', sublabel: 'Full coverage' },
    { value: '100%', label: 'Independent', sublabel: 'No paid listings' },
  ]

  // Items for pillar carousel (related sections)
  const pillarItems = [
    {
      href: '/categories',
      title: 'Browse by Category',
      image: EDITORIAL_IMAGES['best-organic-farms-uk'] || DEFAULT_IMAGE,
    },
    {
      href: '/counties',
      title: 'Explore by County',
      image: EDITORIAL_IMAGES['top-pick-your-own-farms'] || DEFAULT_IMAGE,
    },
    {
      href: '/map',
      title: 'Interactive Map',
      image: EDITORIAL_IMAGES['best-farm-shops-london'] || DEFAULT_IMAGE,
    },
    {
      href: '/seasonal',
      title: 'Seasonal Guide',
      image: EDITORIAL_IMAGES['top-farm-cafes-uk'] || DEFAULT_IMAGE,
    },
  ]

  return (
    <main className="bg-background-secondary">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Best Farm Guides',
            description: 'Curated guides to the finest farms across the UK',
            url: 'https://farmcompanion.co.uk/best',
            numberOfItems: bestLists.length,
          }),
        }}
      />

      {/* Editorial Hero */}
      <EditorialHero
        title="Best Farm Guides"
        subtitle="Expertly curated guides to the finest farms across the UK"
        image={{
          src: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1920&q=80&auto=format',
          alt: 'Golden hour sunlight over British farmland',
        }}
        scrollTarget="#content"
      />

      {/* Main Content */}
      <div id="content" className="bg-background-secondary">
        {/* Featured Guide - Full width editorial treatment */}
        {heroGuide && (
          <section className="py-16 md:py-24">
            <div className="max-w-6xl mx-auto px-6">
              {/* Section label */}
              <div className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-12">
                Featured Guide
              </div>

              {/* Featured article - asymmetric layout */}
              <Link href={`/best/${heroGuide.slug}`} className="group block">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
                  {/* Image - 60% */}
                  <div className="lg:col-span-7">
                    <div className="relative aspect-[4/3] overflow-hidden bg-border">
                      <Image
                        src={EDITORIAL_IMAGES[heroGuide.slug]?.src || DEFAULT_IMAGE.src}
                        alt={EDITORIAL_IMAGES[heroGuide.slug]?.alt || DEFAULT_IMAGE.alt}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        priority
                      />
                    </div>
                  </div>

                  {/* Content - 40% */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Meta */}
                    <div className="text-xs tracking-[0.15em] uppercase text-foreground-muted">
                      {heroGuide.category?.replace(/-/g, ' ') || 'Guide'}
                    </div>

                    {/* Title */}
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight group-hover:opacity-70 transition-opacity duration-300">
                      {heroGuide.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-foreground-muted text-lg leading-relaxed group-hover:opacity-70 transition-opacity duration-300">
                      {heroGuide.intro}
                    </p>

                    {/* Thin horizontal rule */}
                    <div className="w-16 h-px bg-border" />

                    {/* Read more */}
                    <div className="text-xs tracking-[0.15em] uppercase text-foreground opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                      Read Article
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Horizontal divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-border" />
        </div>

        {/* All Guides - Asymmetrical grid */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            {/* Section label */}
            <div className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-12">
              All Guides
            </div>

            {/* Staggered asymmetric grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-y-16">
              {allLists.slice(1).map((list, idx) => {
                // Alternate between wide (7 cols) and narrow (5 cols)
                const isWide = idx % 3 !== 2
                const colSpan = isWide ? 'md:col-span-7' : 'md:col-span-5'
                const colStart = idx % 2 === 0 ? 'md:col-start-1' : 'md:col-start-6'

                return (
                  <div key={list.slug} className={`col-span-12 ${colSpan} ${idx % 2 !== 0 ? colStart : ''}`}>
                    <EditorialCard
                      href={`/best/${list.slug}`}
                      title={list.title}
                      excerpt={list.intro}
                      image={EDITORIAL_IMAGES[list.slug] || DEFAULT_IMAGE}
                      meta={{
                        category: list.category?.replace(/-/g, ' '),
                        date: new Date(list.updateDate).toLocaleDateString('en-GB', {
                          month: 'short',
                          year: 'numeric',
                        }),
                      }}
                      variant={isWide ? 'featured' : 'standard'}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Data Callout */}
        <DataCallout data={stats} title="By the Numbers" />

        {/* Pillar Carousel - Related sections */}
        <PillarCarousel items={pillarItems} title="Explore More" />
      </div>
    </main>
  )
}
