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

// Curated images for editorial cards
const EDITORIAL_IMAGES: Record<string, { src: string; alt: string }> = {
  'best-organic-farms-uk': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/1/main.webp',
    alt: 'Fresh organic kale leaves',
  },
  'top-pick-your-own-farms': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/1/main.webp',
    alt: 'Fresh strawberries with morning dew',
  },
  'best-farm-shops-london': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/1/main.webp',
    alt: 'Fresh vine-ripened tomatoes',
  },
  'top-farm-cafes-uk': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/1/main.webp',
    alt: 'Fresh British apples',
  },
  'best-lavender-farms': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/1/main.webp',
    alt: 'Fresh asparagus spears',
  },
  'best-farmers-markets-uk': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/carrots/1/main.webp',
    alt: 'Fresh orange carrots',
  },
  'top-veg-box-schemes-uk': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broad-beans/1/main.webp',
    alt: 'Fresh broad beans',
  },
  'best-farm-school-visits-uk': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/peas/1/main.webp',
    alt: 'Fresh garden peas',
  },
  'top-ice-cream-farms-uk': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/raspberries/1/main.webp',
    alt: 'Fresh raspberries',
  },
  'best-cheese-makers-uk': {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/spinach/1/main.webp',
    alt: 'Fresh spinach leaves',
  },
}

// Default image for guides without specific images
const DEFAULT_IMAGE = {
  src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/2/main.webp',
  alt: 'Fresh farm produce',
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
    <main className="bg-[#F9F9F9]">
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
      <div id="content" className="bg-[#F9F9F9]">
        {/* Featured Guide - Full width editorial treatment */}
        {heroGuide && (
          <section className="py-16 md:py-24">
            <div className="max-w-6xl mx-auto px-6">
              {/* Section label */}
              <div className="text-xs tracking-[0.2em] uppercase text-[#6B6B6B] mb-12">
                Featured Guide
              </div>

              {/* Featured article - asymmetric layout */}
              <Link href={`/best/${heroGuide.slug}`} className="group block">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
                  {/* Image - 60% */}
                  <div className="lg:col-span-7">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#E5E5E5]">
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
                    <div className="text-xs tracking-[0.15em] uppercase text-[#6B6B6B]">
                      {heroGuide.category?.replace(/-/g, ' ') || 'Guide'}
                    </div>

                    {/* Title */}
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1A1A1A] leading-tight group-hover:opacity-70 transition-opacity duration-300">
                      {heroGuide.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-[#6B6B6B] text-lg leading-relaxed group-hover:opacity-70 transition-opacity duration-300">
                      {heroGuide.intro}
                    </p>

                    {/* Thin horizontal rule */}
                    <div className="w-16 h-px bg-[#E5E5E5]" />

                    {/* Read more */}
                    <div className="text-xs tracking-[0.15em] uppercase text-[#1A1A1A] opacity-60 group-hover:opacity-100 transition-opacity duration-300">
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
          <div className="h-px bg-[#E5E5E5]" />
        </div>

        {/* All Guides - Asymmetrical grid */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            {/* Section label */}
            <div className="text-xs tracking-[0.2em] uppercase text-[#6B6B6B] mb-12">
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
