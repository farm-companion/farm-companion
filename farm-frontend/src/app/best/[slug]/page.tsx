import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { bestLists } from '@/data/best-lists'
import { getCachedFarmsByCategory, getCachedCategoryBySlug } from '@/lib/server-cache-categories'
import { getCachedFarmsByCounty } from '@/lib/server-cache-counties'
import { FarmCard } from '@/components/FarmCard'
import { Badge } from '@/components/ui/Badge'
import {
  BentoGrid,
  ORGANIC_CRITERIA,
  PYO_CRITERIA,
  FARM_SHOP_CRITERIA,
  FAQAccordion,
  addTipsToFAQs,
  SensoryHook,
  StatsBar,
} from '@/components/best'

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
    // For London, get farms from nearby counties
    const londonCounties = ['surrey', 'kent', 'essex', 'hertfordshire', 'buckinghamshire']
    const farmPromises = londonCounties.map((county: string) =>
      getCachedFarmsByCounty(county, { limit: 5 })
    )
    const results = await Promise.all(farmPromises)
    farms = results.flatMap((r) => r.farms).slice(0, 20)
  }

  // Determine which criteria set to use based on category
  const getCriteriaForCategory = () => {
    if (list.category === 'organic-farms') return ORGANIC_CRITERIA
    if (list.category === 'pick-your-own') return PYO_CRITERIA
    if (list.region === 'london') return FARM_SHOP_CRITERIA
    return ORGANIC_CRITERIA // default
  }

  // Get FAQ category for tips
  const getFAQCategory = () => {
    if (list.category === 'organic-farms') return 'organic'
    if (list.category === 'pick-your-own') return 'pyo'
    return 'farm-shop'
  }

  return (
    <main className="bg-background-canvas">
      {/* Structured Data - Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: list.title,
            description: list.metaDescription,
            image: 'https://farmcompanion.co.uk/og-image.jpg',
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

      {/* God-Tier Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&q=80&auto=format"
            alt="Fresh organic vegetables and produce in morning light"
            className="w-full h-full object-cover object-center"
          />
          {/* Professional Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        {/* Hero Content - Split Layout */}
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href="/best" className="hover:text-white transition-colors">
                  Best Of
                </Link>
                <span>/</span>
                <span className="text-white font-medium">{list.title}</span>
              </nav>

              {/* Editor's Badge */}
              {list.featured && (
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-400/30">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-sm font-medium text-amber-200">Editor&apos;s Choice</span>
                </div>
              )}

              {/* Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight drop-shadow-lg">
                {list.heading}
              </h1>

              {/* Intro */}
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl leading-relaxed">
                {list.intro}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="#featured-farms"
                  className="bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl"
                >
                  <span>Explore {farms.length} Farms</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <span className="text-white/80 text-sm">Last updated:</span>
                  <span className="text-white font-medium text-sm">
                    {new Date(list.updateDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sensory Hook - Evocative Intro */}
      <SensoryHook category={getFAQCategory()} />

      {/* Stats Bar - Key Metrics */}
      <StatsBar
        farmsCount={farms.length}
        regionsCount={12}
        lastUpdated={list.updateDate}
        featured={list.featured}
      />

      {/* Selection Criteria Bento Grid */}
      <section className="py-16 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                What Makes These Farms Special
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Every farm on this list has been carefully selected based on these key criteria.
              </p>
            </div>
            <BentoGrid items={getCriteriaForCategory()} />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">

          {/* Featured Farms Section */}
          {farms.length > 0 && (
            <section id="featured-farms" className="mb-16 scroll-mt-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Featured {list.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {farms.length} outstanding farms exemplifying the very best.
                  </p>
                </div>
                {list.category && (
                  <Link
                    href={`/categories/${list.category}`}
                    className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {farms.map((farm: any) => (
                  <FarmCard key={farm.id} farm={farm} />
                ))}
              </div>

              {list.category && (
                <div className="text-center md:hidden">
                  <Link
                    href={`/categories/${list.category}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg font-medium transition-all hover:bg-brand-primary/90 hover:shadow-md"
                  >
                    View All {categoryInfo?.name || 'Farms'}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* FAQ Section with Accordion */}
          {list.faqs && list.faqs.length > 0 && (
            <FAQAccordion
              faqs={addTipsToFAQs(list.faqs, getFAQCategory())}
              title="The Organic Intel"
              className="mb-16"
            />
          )}

          {/* Related Lists */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              More Curated Lists
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bestLists
                .filter((l: { slug: string; featured?: boolean }) => l.slug !== slug && l.featured)
                .slice(0, 3)
                .map((relatedList: { slug: string; title: string; intro: string; updateDate: string }) => (
                  <Link
                    key={relatedList.slug}
                    href={`/best/${relatedList.slug}`}
                    className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-all hover:shadow-lg hover:border-brand-primary hover:-translate-y-1"
                  >
                    <h3 className="text-body font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-brand-primary transition-colors">
                      {relatedList.title}
                    </h3>
                    <p className="text-caption text-slate-600 dark:text-slate-400 line-clamp-2">
                      {relatedList.intro}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
