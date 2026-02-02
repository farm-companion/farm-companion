/**
 * Best Farm Guide Article Page
 *
 * Luxury editorial design with Paper White (#F9F9F9) and Deep Charcoal (#1A1A1A).
 * Follows "The Luxury of Space" principle with minimal UI and maximum visual impact.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { bestLists } from '@/data/best-lists'
import { getCachedFarmsByCategory, getCachedCategoryBySlug } from '@/lib/server-cache-categories'
import { getCachedFarmsByCounty } from '@/lib/server-cache-counties'
import { FarmCard } from '@/components/FarmCard'
import {
  BentoGrid,
  ORGANIC_CRITERIA,
  PYO_CRITERIA,
  FARM_SHOP_CRITERIA,
  FAQAccordion,
  addTipsToFAQs,
  EditorialArticle,
} from '@/components/best'
import { EditorialHero, PillarCarousel } from '@/components/best/editorial'

// Revalidate every 24 hours
export const revalidate = 86400

interface BestPageProps {
  params: Promise<{ slug: string }>
}

// Generate static params for all best-of lists
export async function generateStaticParams() {
  return bestLists.map((list: { slug: string }) => ({
    slug: list.slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BestPageProps): Promise<Metadata> {
  const { slug } = await params
  const list = bestLists.find((l: { slug: string }) => l.slug === slug)

  if (!list) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
    }
  }

  return {
    title: list.metaTitle,
    description: list.metaDescription,
    openGraph: {
      title: list.metaTitle,
      description: list.metaDescription,
      type: 'article',
      url: `https://farmcompanion.co.uk/best/${slug}`,
      publishedTime: list.publishDate,
      modifiedTime: list.updateDate,
    },
    twitter: {
      card: 'summary_large_image',
      title: list.metaTitle,
      description: list.metaDescription,
    },
    alternates: {
      canonical: `https://farmcompanion.co.uk/best/${slug}`,
    },
  }
}

// Curated hero images - dramatic, atmospheric editorial photography
const HERO_IMAGES: Record<string, { src: string; alt: string }> = {
  'best-organic-farms-uk': {
    src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1920&q=80&auto=format',
    alt: 'Organic vegetable garden rows stretching toward misty hills',
  },
  'top-pick-your-own-farms': {
    src: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1920&q=80&auto=format',
    alt: 'Golden sunlight filtering through strawberry fields',
  },
  'best-farm-shops-london': {
    src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80&auto=format',
    alt: 'Artisan produce beautifully arranged in rustic farm shop',
  },
  'top-farm-cafes-uk': {
    src: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1920&q=80&auto=format',
    alt: 'Warm morning light in a countryside farmhouse cafe',
  },
  'best-lavender-farms': {
    src: 'https://images.unsplash.com/photo-1499002238440-d264f04f1758?w=1920&q=80&auto=format',
    alt: 'Endless rows of purple lavender under summer sky',
  },
  'best-farmers-markets-uk': {
    src: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1920&q=80&auto=format',
    alt: 'Early morning at the farmers market',
  },
  'top-veg-box-schemes-uk': {
    src: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1920&q=80&auto=format',
    alt: 'Fresh seasonal harvest in rustic wooden crate',
  },
  'best-farm-school-visits-uk': {
    src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=80&auto=format',
    alt: 'Idyllic British farmland with grazing livestock',
  },
  'top-ice-cream-farms-uk': {
    src: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=1920&q=80&auto=format',
    alt: 'Dairy herd in verdant pasture at dawn',
  },
  'best-cheese-makers-uk': {
    src: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=1920&q=80&auto=format',
    alt: 'Aged artisan cheese wheels in traditional cellar',
  },
}

const DEFAULT_HERO = {
  src: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1920&q=80&auto=format',
  alt: 'Golden hour light sweeping across British farmland',
}

export default async function BestPage({ params }: BestPageProps) {
  const { slug } = await params
  const list = bestLists.find((l: { slug: string }) => l.slug === slug)

  if (!list) {
    notFound()
  }

  // Fetch farms based on category or region
  let farms: any[] = []
  let categoryInfo: any = null

  if (list.category) {
    const result = await getCachedFarmsByCategory(list.category, { limit: 20 })
    farms = result.farms
    categoryInfo = await getCachedCategoryBySlug(list.category)
  } else if (list.region === 'london') {
    const londonCounties = ['surrey', 'kent', 'essex', 'hertfordshire', 'buckinghamshire']
    const farmPromises = londonCounties.map((county: string) =>
      getCachedFarmsByCounty(county, { limit: 5 })
    )
    const results = await Promise.all(farmPromises)
    farms = results.flatMap((r) => r.farms).slice(0, 20)
  }

  // Determine which criteria set to use
  const getCriteriaForCategory = () => {
    if (list.category === 'organic-farms') return ORGANIC_CRITERIA
    if (list.category === 'pick-your-own') return PYO_CRITERIA
    if (list.region === 'london') return FARM_SHOP_CRITERIA
    return ORGANIC_CRITERIA
  }

  // Get FAQ category for tips
  const getFAQCategory = () => {
    if (list.category === 'organic-farms') return 'organic'
    if (list.category === 'pick-your-own') return 'pyo'
    return 'farm-shop'
  }

  // Get hero image
  const heroImage = HERO_IMAGES[slug] || DEFAULT_HERO

  // Related guides for pillar carousel
  const relatedGuides = bestLists
    .filter((l) => l.slug !== slug && l.featured)
    .slice(0, 4)
    .map((l) => ({
      href: `/best/${l.slug}`,
      title: l.title,
      image: HERO_IMAGES[l.slug] || DEFAULT_HERO,
    }))

  return (
    <main className="bg-[#F9F9F9]">
      {/* Structured Data - Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: list.title,
            description: list.metaDescription,
            image: heroImage.src,
            datePublished: list.publishDate,
            dateModified: list.updateDate,
            author: {
              '@type': 'Organization',
              name: 'Farm Companion',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Farm Companion',
              logo: {
                '@type': 'ImageObject',
                url: 'https://farmcompanion.co.uk/logo.png',
              },
            },
          }),
        }}
      />

      {/* FAQ Schema */}
      {list.faqs && list.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: list.faqs.map((faq: { question: string; answer: string }) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      )}

      {/* Editorial Hero */}
      <EditorialHero
        title={list.heading}
        subtitle={list.category?.replace(/-/g, ' ').toUpperCase() || 'FARM GUIDE'}
        image={heroImage}
        scrollTarget="#content"
      />

      {/* Breadcrumb - Minimal, wide-tracked */}
      <div className="bg-[#F9F9F9] py-8">
        <nav className="max-w-2xl mx-auto px-6">
          <div className="flex items-center gap-3 text-xs tracking-[0.15em] uppercase text-[#6B6B6B]">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">
              Home
            </Link>
            <span className="w-4 h-px bg-[#E5E5E5]" />
            <Link href="/best" className="hover:text-[#1A1A1A] transition-colors">
              Guides
            </Link>
            <span className="w-4 h-px bg-[#E5E5E5]" />
            <span className="text-[#1A1A1A]">{list.title}</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div id="content">
        {/* Selection Criteria - Only show if NO editorial content */}
        {!(list.editorialIntro || list.farmProfiles) && (
          <section className="py-16 md:py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="text-xs tracking-[0.2em] uppercase text-[#6B6B6B] mb-4">
                  Selection Criteria
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] mb-4">
                  What Makes These Farms Special
                </h2>
                <p className="text-[#6B6B6B] max-w-2xl mx-auto">
                  Every farm on this list has been carefully selected based on these key criteria.
                </p>
              </div>
              <BentoGrid items={getCriteriaForCategory()} />
            </div>
          </section>
        )}

        {/* Editorial Article Section */}
        {(list.editorialIntro || list.farmProfiles) && (
          <section className="py-16 md:py-24 overflow-hidden">
            <EditorialArticle
              articleNumber={list.articleNumber}
              title={list.title}
              persona={list.persona}
              approach={list.approach}
              seoKeywords={list.seoKeywords}
              editorialIntro={list.editorialIntro}
              farmProfiles={list.farmProfiles}
              farms={farms}
            />
          </section>
        )}

        {/* Featured Farms - Only show if no editorial farm profiles */}
        {farms.length > 0 && !list.farmProfiles && (
          <section id="featured-farms" className="py-16 md:py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6">
              {/* Section header */}
              <div className="text-center mb-16">
                <p className="text-xs tracking-[0.2em] uppercase text-[#6B6B6B] mb-4">
                  Featured Farms
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] mb-4">
                  {farms.length} Outstanding Farms
                </h2>
                <div className="w-16 h-px bg-[#E5E5E5] mx-auto" />
              </div>

              {/* Farm grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {farms.map((farm: any) => (
                  <FarmCard key={farm.id} farm={farm} />
                ))}
              </div>

              {/* View all link */}
              {list.category && (
                <div className="text-center">
                  <Link
                    href={`/categories/${list.category}`}
                    className="inline-block text-xs tracking-[0.15em] uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 hover:opacity-70 transition-opacity"
                  >
                    View All {categoryInfo?.name || 'Farms'}
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {list.faqs && list.faqs.length > 0 && (
          <section className="py-16 md:py-24 bg-[#F9F9F9]">
            <div className="max-w-3xl mx-auto px-6">
              <div className="text-center mb-16">
                <p className="text-xs tracking-[0.2em] uppercase text-[#6B6B6B] mb-4">
                  Common Questions
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A]">
                  The Essential Guide
                </h2>
              </div>
              <FAQAccordion
                faqs={addTipsToFAQs(list.faqs, getFAQCategory())}
                title=""
              />
            </div>
          </section>
        )}

        {/* Related Guides - Pillar Carousel */}
        {relatedGuides.length > 0 && (
          <PillarCarousel items={relatedGuides} title="More Guides" />
        )}

        {/* Article meta footer */}
        <div className="py-16 bg-[#F9F9F9]">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="w-px h-12 bg-[#E5E5E5] mx-auto mb-8" />
            <p className="text-xs tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">
              Last Updated
            </p>
            <p className="text-sm text-[#1A1A1A]">
              {new Date(list.updateDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <div className="w-px h-12 bg-[#E5E5E5] mx-auto mt-8" />
          </div>
        </div>
      </div>
    </main>
  )
}
