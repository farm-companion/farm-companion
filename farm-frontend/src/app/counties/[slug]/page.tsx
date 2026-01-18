import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getCachedFarmsByCounty,
  getCachedCountyStats,
  getCachedRelatedCounties,
  getCachedAllCounties,
} from '@/lib/server-cache-counties'
import { FarmCard } from '@/components/FarmCard'
import { Badge } from '@/components/ui/Badge'
import { CountyStats } from '@/components/CountyStats'
import { countyFAQs } from '@/data/county-faqs'

// Revalidate every 6 hours
export const revalidate = 21600

interface CountyPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; page?: string }>
}

// Generate static params for all counties at build time
export async function generateStaticParams() {
  try {
    const counties = await getCachedAllCounties()
    return counties.map((county: { slug: string }) => ({
      slug: county.slug,
    }))
  } catch (error) {
    console.warn('Database unavailable during build, skipping static generation for counties')
    return []
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CountyPageProps): Promise<Metadata> {
  const { slug } = await params
  const { countyName, total } = await getCachedFarmsByCounty(slug, { limit: 1 })

  if (!countyName) {
    return {
      title: 'County Not Found',
      description: 'The requested county could not be found.',
    }
  }

  const title = `Farm Shops & Local Producers in ${countyName} | Farm Companion`
  const description = `Discover ${total} farm shops, local producers, and agricultural businesses in ${countyName}, UK. Find fresh produce, organic farms, pick your own, and more.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://farmcompanion.co.uk/counties/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://farmcompanion.co.uk/counties/${slug}`,
    },
  }
}

export default async function CountyPage({ params, searchParams }: CountyPageProps) {
  const { slug } = await params
  const { category, page = '1' } = await searchParams

  const currentPage = parseInt(page)
  const limit = 24
  const offset = (currentPage - 1) * limit

  // Fetch farms in this county
  const { farms, total, hasMore, countyName } = await getCachedFarmsByCounty(slug, {
    limit,
    offset,
    category: category || undefined,
  })

  if (!countyName) {
    notFound()
  }

  // Fetch county stats
  const stats = await getCachedCountyStats(slug)

  // Fetch related counties
  const relatedCounties = await getCachedRelatedCounties(slug, 6)

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Structured Data - CollectionPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Farm Shops & Local Producers in ${countyName}`,
            description: `Directory of ${total} farms and producers in ${countyName}, UK`,
            url: `https://farmcompanion.co.uk/counties/${slug}`,
            about: {
              '@type': 'Place',
              name: countyName,
              '@id': `https://farmcompanion.co.uk/counties/${slug}`,
            },
            numberOfItems: total,
          }),
        }}
      />

      {/* Structured Data - BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://farmcompanion.co.uk',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Counties',
                item: 'https://farmcompanion.co.uk/counties',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: countyName,
                item: `https://farmcompanion.co.uk/counties/${slug}`,
              },
            ],
          }),
        }}
      />

      {/* Structured Data - FAQPage */}
      {countyFAQs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: countyFAQs.map((faq: { question: string; answer: string }) => ({
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
          <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/counties" className="hover:text-brand-primary transition-colors">
              Counties
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{countyName}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            {/* County Name */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4">
              Farms & Producers in {countyName}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-6">
              Discover {total} local farm shops, pick your own farms, organic producers, and
              agricultural businesses in {countyName}. Support local farmers and enjoy fresh,
              locally-sourced produce.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="default" size="lg">
                {total} {total === 1 ? 'Farm' : 'Farms'}
              </Badge>
              {stats && stats.verified > 0 && (
                <Badge variant="success" size="lg">
                  ✓ {stats.verified} Verified
                </Badge>
              )}
              {stats && stats.averageRating > 0 && (
                <Badge variant="outline" size="lg">
                  ⭐ {stats.averageRating.toFixed(1)} Average Rating
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Stats & Related */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* County Stats */}
              {stats && <CountyStats stats={stats} countyName={countyName} />}

              {/* Related Counties */}
              {relatedCounties.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                  <h2 className="font-semibold text-slate-900 dark:text-white mb-3">
                    Nearby Counties
                  </h2>
                  <div className="space-y-2">
                    {relatedCounties.map((county: { slug: string; name: string; farmCount: number }) => (
                      <Link
                        key={county.slug}
                        href={`/counties/${county.slug}`}
                        className="block px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span>{county.name}</span>
                          <span className="text-xs text-slate-500">({county.farmCount})</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/counties"
                    className="block mt-4 text-sm text-brand-primary hover:underline text-center"
                  >
                    View all counties →
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content - Farm Grid */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {category ? `Farms in ${countyName}` : `All Farms in ${countyName}`}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Showing {farms.length} of {total} {total === 1 ? 'result' : 'results'}
                {category && (
                  <>
                    {' '}
                    in selected category{' '}
                    <Link
                      href={`/counties/${slug}`}
                      className="text-brand-primary hover:underline"
                    >
                      (Clear filter)
                    </Link>
                  </>
                )}
              </p>
            </div>

            {/* Farm Grid */}
            {farms.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {farms.map((farm: any) => (
                    <FarmCard key={farm.id} farm={farm} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    {currentPage > 1 && (
                      <Link
                        href={`/counties/${slug}?page=${currentPage - 1}${category ? `&category=${category}` : ''}`}
                        className="px-4 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Previous
                      </Link>
                    )}

                    <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
                      Page {currentPage} of {totalPages}
                    </span>

                    {hasMore && (
                      <Link
                        href={`/counties/${slug}?page=${currentPage + 1}${category ? `&category=${category}` : ''}`}
                        className="px-4 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                  No farms found in {countyName}
                  {category && ' with the selected category'}.
                </p>
                {category && (
                  <Link
                    href={`/counties/${slug}`}
                    className="text-brand-primary hover:underline"
                  >
                    View all farms in {countyName}
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>

        {/* FAQ Section */}
        {countyFAQs.length > 0 && (
          <section className="mt-12 max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {countyFAQs.map((faq: { question: string; answer: string }, index: number) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
