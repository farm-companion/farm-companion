import { Metadata } from 'next'
import Link from 'next/link'
import { bestLists } from '@/data/best-lists'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Best Farm Guides & Curated Lists | Farm Companion',
  description: 'Discover our curated guides to the best farms, farm shops, and agricultural experiences across the UK. Expert recommendations for organic farms, pick your own, farm cafés, and more.',
  openGraph: {
    title: 'Best Farm Guides & Curated Lists | Farm Companion',
    description: 'Discover our curated guides to the best farms, farm shops, and agricultural experiences across the UK.',
    type: 'website',
    url: 'https://farmcompanion.co.uk/best',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Farm Guides & Curated Lists | Farm Companion',
    description: 'Discover our curated guides to the best farms, farm shops, and agricultural experiences across the UK.',
  },
  alternates: {
    canonical: 'https://farmcompanion.co.uk/best',
  },
}

export default function BestGuidesPage() {
  // Separate featured and regular lists
  const featuredLists = bestLists.filter((list: { featured?: boolean }) => list.featured)
  const regularLists = bestLists.filter((list: { featured?: boolean }) => !list.featured)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Structured Data - CollectionPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Best Farm Guides & Curated Lists',
            description: 'Curated guides to the best farms and agricultural experiences across the UK',
            url: 'https://farmcompanion.co.uk/best',
            numberOfItems: bestLists.length,
          }),
        }}
      />

      {/* Breadcrumbs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-caption text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">Best Of</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-display font-bold text-slate-900 dark:text-white mb-4">
              Best Farm Guides
            </h1>
            <p className="text-heading text-slate-600 dark:text-slate-400 mb-6">
              Discover our expertly curated guides to the finest farms, farm shops, and agricultural
              experiences across the UK. From organic producers to pick your own farms, we&apos;ve
              handpicked the best destinations for every interest.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Badge variant="default" size="lg">
                {bestLists.length} Curated Guides
              </Badge>
              <Badge variant="outline" size="lg">
                Updated Regularly
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Featured Guides */}
          {featuredLists.length > 0 && (
            <section className="mb-12">
              <h2 className="text-display font-bold text-slate-900 dark:text-white mb-6">
                Featured Guides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredLists.map((list) => (
                  <Link
                    key={list.slug}
                    href={`/best/${list.slug}`}
                    className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 transition-all hover:shadow-lg hover:border-brand-primary"
                  >
                    <div className="mb-3">
                      <Badge variant="default" size="sm">
                        Editor&apos;s Choice
                      </Badge>
                    </div>
                    <h3 className="text-heading font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-brand-primary transition-colors">
                      {list.title}
                    </h3>
                    <p className="text-caption text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                      {list.intro}
                    </p>
                    <div className="flex items-center justify-between text-small text-slate-500">
                      <span>
                        Updated: {new Date(list.updateDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-brand-primary group-hover:translate-x-1 transition-transform">
                        Read Guide →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Guides */}
          {regularLists.length > 0 && (
            <section>
              <h2 className="text-display font-bold text-slate-900 dark:text-white mb-6">
                All Guides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularLists.map((list) => (
                  <Link
                    key={list.slug}
                    href={`/best/${list.slug}`}
                    className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 transition-all hover:shadow-lg hover:border-brand-primary"
                  >
                    <h3 className="text-heading font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-brand-primary transition-colors">
                      {list.title}
                    </h3>
                    <p className="text-caption text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                      {list.intro}
                    </p>
                    <div className="flex items-center justify-between text-small text-slate-500">
                      <span>
                        Updated: {new Date(list.updateDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-brand-primary group-hover:translate-x-1 transition-transform">
                        Read Guide →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Browse Other Ways */}
          <section className="mt-12 bg-slate-100 dark:bg-slate-800 rounded-lg p-8">
            <h2 className="text-display font-bold text-slate-900 dark:text-white mb-4 text-center">
              Browse Farms Other Ways
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Link
                href="/categories"
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 text-center transition-all hover:shadow-md hover:border-brand-primary"
              >
                <div className="text-display mb-2">🏪</div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  By Category
                </h3>
                <p className="text-caption text-slate-600 dark:text-slate-400">
                  Browse by farm type
                </p>
              </Link>

              <Link
                href="/counties"
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 text-center transition-all hover:shadow-md hover:border-brand-primary"
              >
                <div className="text-display mb-2">📍</div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  By Location
                </h3>
                <p className="text-caption text-slate-600 dark:text-slate-400">
                  Find farms in your county
                </p>
              </Link>

              <Link
                href="/map"
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 text-center transition-all hover:shadow-md hover:border-brand-primary"
              >
                <div className="text-display mb-2">🗺️</div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Map View
                </h3>
                <p className="text-caption text-slate-600 dark:text-slate-400">
                  Explore farms on a map
                </p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
