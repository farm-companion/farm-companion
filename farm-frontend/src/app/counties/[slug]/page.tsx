import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getCachedFarmsByCounty,
  getCachedCountyStats,
  getCachedCountyHeroImageUrl,
  getCachedRelatedCounties,
  getCachedAllCounties,
} from '@/lib/server-cache-counties'
import { FarmCard } from '@/components/FarmCard'
import { CountyHero } from '@/components/CountyHero'
import { CountyStats } from '@/components/CountyStats'
import { countyFAQs } from '@/data/county-faqs'
import { pittiCountyImageUrl } from '@/data/pitti-counties'

// Revalidate every 6 hours
export const revalidate = 21600

interface CountyPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; page?: string }>
}

// Generate static params for all counties at build time
// Returns empty array if database is unreachable (allows dynamic rendering)
export async function generateStaticParams() {
  try {
    const counties = await getCachedAllCounties()
    return counties.map((county: { slug: string }) => ({
      slug: county.slug,
    }))
  } catch {
    // Database unreachable during build - pages will render dynamically
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

  // Hero image: a dedicated Pitti county illustration when one exists,
  // otherwise reuse a representative image from the county's own farms so
  // every county page has a hero (no new image generation).
  const heroImageUrl = pittiCountyImageUrl(slug) ?? (await getCachedCountyHeroImageUrl(slug))

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-paper">
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
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-caption text-ink-muted">
            <Link href="/" className="hover:text-brand transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/counties" className="hover:text-brand transition-colors">
              Counties
            </Link>
            <span>/</span>
            <span className="font-medium text-ink">{countyName}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section — dedicated Pitti county illustration when one exists,
          otherwise a representative image reused from the county's farms;
          typography-led fallback only when a county has no usable imagery. */}
      <CountyHero
        countyName={countyName}
        total={total}
        stats={stats}
        imageUrl={heroImageUrl}
      />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Stats & Related */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* County Stats */}
              {stats && <CountyStats stats={stats} countyName={countyName} />}

              {/* Related Counties */}
              {relatedCounties.length > 0 && (
                <div className="bg-surface rounded-[2px] border border-border p-4">
                  <h2 className="font-semibold text-ink mb-3">
                    Nearby Counties
                  </h2>
                  <div className="space-y-2">
                    {relatedCounties.map((county: { slug: string; name: string; farmCount: number }) => (
                      <Link
                        key={county.slug}
                        href={`/counties/${county.slug}`}
                        className="block px-3 py-2 rounded-[2px] text-caption text-ink hover:bg-surface-2 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span>{county.name}</span>
                          <span className="text-small text-ink-muted">({county.farmCount})</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/counties"
                    className="block mt-4 text-caption text-brand hover:underline text-center"
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
              <h2 className="text-2xl font-bold text-ink mb-2">
                {category ? `Farms in ${countyName}` : `All Farms in ${countyName}`}
              </h2>
              <p className="text-ink-muted">
                Showing {farms.length} of {total} {total === 1 ? 'result' : 'results'}
                {category && (
                  <>
                    {' '}
                    in selected category{' '}
                    <Link
                      href={`/counties/${slug}`}
                      className="text-brand hover:underline"
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
                        className="px-4 py-2 rounded-[2px] bg-surface border border-border text-ink hover:bg-surface-2 transition-colors"
                      >
                        Previous
                      </Link>
                    )}

                    <span className="px-4 py-2 text-ink-muted">
                      Page {currentPage} of {totalPages}
                    </span>

                    {hasMore && (
                      <Link
                        href={`/counties/${slug}?page=${currentPage + 1}${category ? `&category=${category}` : ''}`}
                        className="px-4 py-2 rounded-[2px] bg-surface border border-border text-ink hover:bg-surface-2 transition-colors"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-body text-ink-muted mb-4">
                  No farms found in {countyName}
                  {category && ' with the selected category'}.
                </p>
                {category && (
                  <Link
                    href={`/counties/${slug}`}
                    className="text-brand hover:underline"
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
            <h2 className="text-3xl font-bold text-ink mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {countyFAQs.map((faq: { question: string; answer: string }, index: number) => (
                <div
                  key={index}
                  className="bg-surface rounded-[2px] border border-border p-6"
                >
                  <h3 className="text-body font-semibold text-ink mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-ink-muted leading-relaxed">
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
