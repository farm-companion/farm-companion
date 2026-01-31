import { Metadata } from 'next'
import Link from 'next/link'
import { Award, ArrowRight } from 'lucide-react'
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
    <main className="bg-background-canvas">
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

      {/* Professional Hero Section matching Counties page */}
      <section className="relative h-[70vh] min-h-[600px] max-h-[800px] overflow-hidden">
        {/* Background Image with Professional Handling */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1920&q=80&auto=format"
            alt="Golden hour sunlight over lush farmland with a rustic barn"
            className="w-full h-full object-cover object-center"
          />
          {/* Professional Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          {/* Subtle texture overlay for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>

        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Best Farm
              <span className="block text-serum drop-shadow-lg">Guides</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Expertly curated guides to the finest farms across the UK.
            </p>
            <p className="text-body text-white/80 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Handpicked recommendations for organic farms, pick your own, and farm cafes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#guides-content"
                className="bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl backdrop-blur-sm"
              >
                <Award className="w-5 h-5" />
                Browse Guides
              </Link>
              <Link
                href="/counties"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
              >
                Explore Counties
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div id="guides-content" className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Featured Guides */}
          {featuredLists.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
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
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 text-center">
              Browse Farms Other Ways
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Link
                href="/categories"
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 text-center transition-all hover:shadow-md hover:border-brand-primary"
              >
                <div className="text-3xl mb-2">🏪</div>
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
                <div className="text-3xl mb-2">📍</div>
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
                <div className="text-3xl mb-2">🗺️</div>
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
    </main>
  )
}
