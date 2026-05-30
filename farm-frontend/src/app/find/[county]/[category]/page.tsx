import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import {
  generateSEOPageParams,
  getSEOPageData,
  generateItemListSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo-pages'
import { FarmCard } from '@/components/FarmCard'
import { Badge } from '@/components/ui/Badge'
import { MapPin, ChevronRight, Store, ArrowRight } from 'lucide-react'
import { CategoryIcon } from '@/components/CategoryIcon'

// Revalidate every 6 hours
export const revalidate = 21600

interface FindPageProps {
  params: Promise<{ county: string; category: string }>
}

// Generate static params for all county+category combinations
export async function generateStaticParams() {
  try {
    return await generateSEOPageParams()
  } catch {
    // Database unreachable during build - pages will render dynamically
    return []
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: FindPageProps): Promise<Metadata> {
  const { county, category } = await params
  const data = await getSEOPageData(county, category)

  if (!data) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
    }
  }

  return {
    title: data.meta.title,
    description: data.meta.description,
    openGraph: {
      ...data.meta.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.meta.title,
      description: data.meta.description,
    },
    alternates: {
      canonical: data.meta.canonical,
    },
  }
}

export default async function FindPage({ params }: FindPageProps) {
  const { county, category } = await params
  const data = await getSEOPageData(county, category)

  if (!data) {
    notFound()
  }

  const { farms, total, breadcrumbs, relatedPages } = data

  // Generate structured data
  const itemListSchema = generateItemListSchema(farms, data.meta.canonical)
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs)

  return (
    <>
      {/* Structured Data */}
      <Script
        id="itemlist-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-paper">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="border-b border-border bg-surface"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <ol className="flex items-center gap-2 text-sm text-ink-muted">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="w-4 h-4" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-ink font-medium">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="hover:text-ink transition-colors"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-surface border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-start gap-4">
              <CategoryIcon slug={data.category.slug} size="lg" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-ink">
                  {data.category.name} in {data.county.name}
                </h1>
                <p className="mt-2 text-lg text-ink-muted">
                  {total === 0
                    ? `No farm shops found selling ${data.category.name.toLowerCase()} in ${data.county.name} yet.`
                    : `Discover ${total} farm shop${total === 1 ? '' : 's'} selling ${data.category.name.toLowerCase()} in ${data.county.name}.`}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <Badge variant="secondary" className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {data.county.name}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" />
                    {total} shop{total === 1 ? '' : 's'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Farm Grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {farms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farms.map((farm) => (
                <FarmCard
                  key={farm.id}
                  farm={{
                    id: farm.id,
                    name: farm.name,
                    slug: farm.slug,
                    description: farm.description,
                    location: farm.location,
                    images: farm.images,
                    hours: farm.hours as any[] | undefined,
                    offerings: [],
                    contact: farm.contact,
                    verified: farm.verified,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
                <Store className="w-8 h-8 text-ink-subtle" />
              </div>
              <h2 className="text-xl font-semibold text-ink mb-2">
                No shops found yet
              </h2>
              <p className="text-ink-muted max-w-md mx-auto">
                We haven&apos;t found any farm shops selling {data.category.name.toLowerCase()} in{' '}
                {data.county.name} yet. Check back soon or explore other counties.
              </p>
              <Link
                href={`/counties/${data.county.slug}`}
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-brand text-brand-text rounded-[2px] font-medium hover:bg-brand-hover transition-colors"
              >
                View all shops in {data.county.name}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Related Pages */}
        {relatedPages.length > 0 && (
          <section className="bg-surface border-t border-border">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-xl font-semibold text-ink mb-6">
                {data.category.name} in other counties
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {relatedPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group p-4 rounded-[2px] border border-border hover:border-brand transition-colors"
                  >
                    <p className="font-medium text-ink group-hover:text-brand transition-colors line-clamp-2">
                      {page.title.replace(` in ${data.county.name}`, '').replace(data.category.name + ' in ', '')}
                    </p>
                    <p className="text-sm text-ink-muted mt-1">
                      {page.count} shop{page.count === 1 ? '' : 's'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SEO Content */}
        {data.category.description && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-xl font-semibold text-ink mb-4">
                About {data.category.name}
              </h2>
              <p className="text-ink-muted max-w-3xl">
                {data.category.description}
              </p>
            </div>
          </section>
        )}
      </main>
    </>
  )
}
