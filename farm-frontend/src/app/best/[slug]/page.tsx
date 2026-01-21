import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { bestLists } from '@/data/best-lists'
import { getCachedFarmsByCategory, getCachedCategoryBySlug } from '@/lib/server-cache-categories'
import { getCachedFarmsByCounty } from '@/lib/server-cache-counties'
import { FarmCard } from '@/components/FarmCard'
import { Badge } from '@/components/ui/Badge'

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
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

      {/* Breadcrumbs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-caption text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/best" className="hover:text-brand-primary transition-colors">
              Best Of
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{list.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Category Icon (if available) */}
            {categoryInfo?.icon && (
              <div className="text-display mb-4" aria-hidden="true">
                {categoryInfo.icon}
              </div>
            )}

            {/* Heading */}
            <h1 className="text-display font-bold text-slate-900 dark:text-white mb-4">
              {list.heading}
            </h1>

            {/* Intro */}
            <p className="text-heading text-slate-600 dark:text-slate-400 mb-6">
              {list.intro}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="default" size="lg">
                {farms.length} Featured Farms
              </Badge>
              {list.featured && (
                <Badge variant="outline" size="lg">
                  Editor&apos;s Choice
                </Badge>
              )}
              <span className="text-caption text-slate-500">
                Updated: {new Date(list.updateDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(list.content) }} />
          </article>

          {/* Featured Farms Section */}
          {farms.length > 0 && (
            <section className="mb-12">
              <h2 className="text-heading font-bold text-slate-900 dark:text-white mb-6">
                Featured {list.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Here are {farms.length} outstanding farms that exemplify the best of {list.title.toLowerCase()}.
                Each has been selected for quality, customer reviews, and overall experience.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {farms.map((farm: any) => (
                  <FarmCard key={farm.id} farm={farm} />
                ))}
              </div>

              {list.category && (
                <div className="text-center">
                  <Link
                    href={`/categories/${list.category}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg font-medium transition-all hover:bg-brand-primary/90 hover:shadow-md"
                  >
                    View All {categoryInfo?.name || 'Farms'}
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* FAQ Section */}
          {list.faqs && list.faqs.length > 0 && (
            <section className="mb-12">
              <h2 className="text-heading font-bold text-slate-900 dark:text-white mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {list.faqs.map((faq: { question: string; answer: string }, index: number) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6"
                  >
                    <h3 className="text-heading font-semibold text-slate-900 dark:text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Lists */}
          <section>
            <h2 className="text-heading font-bold text-slate-900 dark:text-white mb-6">
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
                    className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 transition-all hover:shadow-lg hover:border-brand-primary"
                  >
                    <h3 className="text-heading font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-brand-primary transition-colors">
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
    </div>
  )
}

// Simple Markdown to HTML converter for basic formatting
function convertMarkdownToHTML(markdown: string): string {
  let html = markdown

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>[\s\S]*<\/li>)/g, '<ul>$1</ul>')

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<li')) {
      return para
    }
    return `<p>${para}</p>`
  }).join('\n')

  return html
}
