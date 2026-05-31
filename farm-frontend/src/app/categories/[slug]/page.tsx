import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getCachedCategoryBySlug,
  getCachedFarmsByCategory,
  getCachedCategoryStats,
  getCachedRelatedCategories,
  getCachedAllCategories,
} from '@/lib/server-cache-categories'
import { FarmCard } from '@/components/FarmCard'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Badge } from '@/components/ui/Badge'
import { categoryFAQs, genericCategoryFAQs } from '@/data/category-faqs'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ county?: string; page?: string }>
}

// Generate static params for all categories at build time
// Returns empty array if database is unreachable (allows dynamic rendering)
export async function generateStaticParams() {
  try {
    const categories = await getCachedAllCategories()
    return categories.map((category: any) => ({
      slug: category.slug,
    }))
  } catch {
    // Database unreachable during build - pages will render dynamically
    return []
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCachedCategoryBySlug(slug)

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    }
  }

  const farmCount = category._count.farms

  const title = `${category.name} in the UK | Farm Companion`
  const description =
    category.description ||
    `Discover ${farmCount} ${category.name.toLowerCase()} across the UK. Browse local producers, farm shops, and agricultural businesses.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://farmcompanion.co.uk/categories/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://farmcompanion.co.uk/categories/${slug}`,
    },
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { county, page = '1' } = await searchParams

  // Fetch category data
  const category = await getCachedCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const currentPage = parseInt(page)
  const limit = 24
  const offset = (currentPage - 1) * limit

  // Fetch farms in this category
  const { farms, total, hasMore } = await getCachedFarmsByCategory(slug, {
    limit,
    offset,
    county: county || undefined,
  })

  // Fetch category stats
  const stats = await getCachedCategoryStats(slug)

  // Fetch related categories
  const relatedCategories = await getCachedRelatedCategories(slug, 6)

  const farmCount = category._count.farms
  const totalPages = Math.ceil(total / limit)

  // Get FAQs for this category
  const faqs = categoryFAQs[slug] || genericCategoryFAQs

  return (
    <div className="min-h-screen bg-paper">
      {/* Structured Data - CollectionPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: category.name,
            description: category.description,
            url: `https://farmcompanion.co.uk/categories/${slug}`,
            about: {
              '@type': 'Thing',
              name: category.name,
            },
            numberOfItems: farmCount,
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
                name: 'Categories',
                item: 'https://farmcompanion.co.uk/categories',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: category.name,
                item: `https://farmcompanion.co.uk/categories/${slug}`,
              },
            ],
          }),
        }}
      />

      {/* Structured Data - FAQPage */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq: { question: string; answer: string }) => ({
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
            <Link href="/categories" className="hover:text-brand transition-colors">
              Categories
            </Link>
            <span>/</span>
            <span className="font-medium text-ink">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b border-border bg-surface">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            {/* Category Icon & Name */}
            <div className="flex items-center gap-4 mb-4">
              <CategoryIcon slug={category.slug} size="lg" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink">
                {category.name}
              </h1>
            </div>

            {/* Description */}
            {category.description && (
              <p className="text-body md:text-heading text-ink-muted mb-6">
                {category.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="default" size="lg">
                {farmCount} {farmCount === 1 ? 'Farm' : 'Farms'}
              </Badge>
              {stats.verified > 0 && (
                <Badge variant="success" size="lg">
                  ✓ {stats.verified} Verified
                </Badge>
              )}
              {stats.averageRating > 0 && (
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
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Top Counties Filter */}
              {stats.topCounties.length > 0 && (
                <div className="bg-surface rounded-[2px] border border-border p-4">
                  <h2 className="font-semibold text-ink mb-3">
                    Filter by County
                  </h2>
                  <div className="space-y-2">
                    <Link
                      href={`/categories/${slug}`}
                      className={`block px-3 py-2 rounded-[2px] text-caption transition-colors ${
                        !county
                          ? 'bg-brand text-brand-text'
                          : 'text-ink hover:bg-surface-2'
                      }`}
                    >
                      All Counties ({farmCount})
                    </Link>
                    {stats.topCounties.slice(0, 10).map((countyData: { county: string; count: number }) => (
                      <Link
                        key={countyData.county}
                        href={`/categories/${slug}?county=${encodeURIComponent(countyData.county)}`}
                        className={`block px-3 py-2 rounded-[2px] text-caption transition-colors ${
                          county === countyData.county
                            ? 'bg-brand text-brand-text'
                            : 'text-ink hover:bg-surface-2'
                        }`}
                      >
                        {countyData.county} ({countyData.count})
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Categories */}
              {relatedCategories.length > 0 && (
                <div className="bg-surface rounded-[2px] border border-border p-4">
                  <h2 className="font-semibold text-ink mb-3">
                    Related Categories
                  </h2>
                  <div className="space-y-2">
                    {relatedCategories.map((relatedCat) => (
                      <Link
                        key={relatedCat.id}
                        href={`/categories/${relatedCat.slug}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-[2px] text-caption text-ink hover:bg-surface-2 transition-colors"
                      >
                        <CategoryIcon slug={relatedCat.slug} size="sm" />
                        <span>{relatedCat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content - Farm Grid */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-ink mb-2">
                {county ? `${category.name} in ${county}` : `All ${category.name}`}
              </h2>
              <p className="text-ink-muted">
                Showing {farms.length} of {total} {total === 1 ? 'result' : 'results'}
                {county && (
                  <>
                    {' '}
                    in {county}{' '}
                    <Link
                      href={`/categories/${slug}`}
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
                        href={`/categories/${slug}?page=${currentPage - 1}${county ? `&county=${encodeURIComponent(county)}` : ''}`}
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
                        href={`/categories/${slug}?page=${currentPage + 1}${county ? `&county=${encodeURIComponent(county)}` : ''}`}
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
                  No farms found in this category
                  {county && ` in ${county}`}.
                </p>
                {county && (
                  <Link
                    href={`/categories/${slug}`}
                    className="text-brand hover:underline"
                  >
                    View all {category.name}
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-ink mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq: { question: string; answer: string }, index: number) => (
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
