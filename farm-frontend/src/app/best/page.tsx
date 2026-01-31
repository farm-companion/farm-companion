import { Metadata } from 'next'
import Link from 'next/link'
import { Award, ArrowRight, Sparkles, TrendingUp, MapPin, Leaf } from 'lucide-react'
import { bestLists } from '@/data/best-lists'
import { Badge } from '@/components/ui/Badge'

// Guide category icons and colors
const guideStyles: Record<string, { icon: typeof Leaf; color: string; label: string }> = {
  'organic-farms': { icon: Leaf, color: 'text-emerald-500 bg-emerald-500/10', label: 'Explore 20+ Locations' },
  'pick-your-own': { icon: MapPin, color: 'text-amber-500 bg-amber-500/10', label: 'Find Seasonal Picks' },
  'london': { icon: MapPin, color: 'text-blue-500 bg-blue-500/10', label: 'Within 60 Minutes' },
}

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

      {/* Discovery Engine - Main Content */}
      <div id="guides-content" className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">

        {/* Featured Spotlight + Bento Grid */}
        {featuredLists.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Featured Guides
              </h2>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Featured Spotlight - Takes 2 columns */}
              {featuredLists[0] && (
                <Link
                  href={`/best/${featuredLists[0].slug}`}
                  className="group lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-10 transition-all hover:shadow-2xl hover:shadow-brand-primary/10"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.3),transparent_50%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.2),transparent_50%)]" />
                  </div>

                  <div className="relative z-10">
                    {/* Trending Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-amber-500/20 border border-amber-400/30">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span className="text-sm font-medium text-amber-200">Trending This Month</span>
                    </div>

                    <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 group-hover:text-serum transition-colors">
                      {featuredLists[0].title}
                    </h3>

                    <p className="text-lg text-white/80 mb-6 max-w-xl leading-relaxed">
                      {featuredLists[0].intro}
                    </p>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-white/90">UK-Wide Coverage</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-white/90">20+ Curated Farms</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="inline-flex items-center gap-2 text-serum font-semibold group-hover:gap-3 transition-all">
                      <span>Explore the Collection</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Secondary Cards - Varying Sizes */}
              {featuredLists.slice(1).map((list, index) => {
                const style = guideStyles[list.category || list.region || ''] || {
                  icon: Award,
                  color: 'text-brand-primary bg-brand-primary/10',
                  label: 'Discover More',
                }
                const Icon = style.icon

                return (
                  <Link
                    key={list.slug}
                    href={`/best/${list.slug}`}
                    className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all hover:shadow-xl hover:border-brand-primary/30 hover:-translate-y-1 ${
                      index === 0 ? 'lg:row-span-1' : ''
                    }`}
                  >
                    {/* Glassmorphism effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                      {/* Icon + Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2.5 rounded-xl ${style.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" size="sm" className="text-xs">
                          Editor&apos;s Pick
                        </Badge>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-brand-primary transition-colors">
                        {list.title}
                      </h3>

                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                        {list.intro}
                      </p>

                      {/* Dynamic Label */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {style.label}
                        </span>
                        <span className="text-brand-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Explore <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* All Guides - Refined Grid */}
        {regularLists.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-8">
              All Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularLists.map((list) => {
                const style = guideStyles[list.category || list.region || ''] || {
                  icon: Award,
                  color: 'text-slate-500 bg-slate-500/10',
                  label: 'Read Guide',
                }
                const Icon = style.icon

                return (
                  <Link
                    key={list.slug}
                    href={`/best/${list.slug}`}
                    className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-all hover:shadow-lg hover:border-brand-primary/50 hover:-translate-y-1"
                  >
                    <div className={`inline-flex p-2 rounded-lg mb-4 ${style.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-brand-primary transition-colors">
                      {list.title}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                      {list.intro}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        {new Date(list.updateDate).toLocaleDateString('en-GB', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-brand-primary font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        {style.label} <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Browse Other Ways */}
        <section className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
            Browse Farms Other Ways
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-8">
            Discover farms by category, location, or explore our interactive map.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Link
              href="/categories"
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center transition-all hover:shadow-lg hover:border-brand-primary hover:-translate-y-1"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                By Category
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Browse by farm type
              </p>
            </Link>

            <Link
              href="/counties"
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center transition-all hover:shadow-lg hover:border-brand-primary hover:-translate-y-1"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                By Location
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Find farms in your county
              </p>
            </Link>

            <Link
              href="/map"
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center transition-all hover:shadow-lg hover:border-brand-primary hover:-translate-y-1"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🗺️</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                Map View
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Explore farms on a map
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
