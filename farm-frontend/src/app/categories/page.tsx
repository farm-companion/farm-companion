import { Metadata } from 'next'
import Link from 'next/link'
import { getCachedAllCategories } from '@/lib/server-cache-categories'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Farm Categories | Farm Companion',
  description:
    'Browse farms by category. Find organic farms, pick your own, farm shops, dairy producers, and more across the UK.',
  openGraph: {
    title: 'Farm Categories | Farm Companion',
    description:
      'Browse farms by category. Find organic farms, pick your own, farm shops, dairy producers, and more across the UK.',
    type: 'website',
    url: 'https://farmcompanion.co.uk/categories',
  },
  alternates: {
    canonical: 'https://farmcompanion.co.uk/categories',
  },
}

export default async function CategoriesPage() {
  const categories = await getCachedAllCategories()

  // Group categories by display order ranges for better organization
  const primaryCategories = categories.filter((cat) => cat.displayOrder <= 10)
  const specializedCategories = categories.filter(
    (cat) => cat.displayOrder > 10 && cat.displayOrder <= 20
  )
  const otherCategories = categories.filter((cat) => cat.displayOrder > 20)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Structured Data - CollectionPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Farm Categories',
            description: 'Browse farms by category across the UK',
            url: 'https://farmcompanion.co.uk/categories',
            numberOfItems: categories.length,
          }),
        }}
      />

      {/* Breadcrumbs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">Categories</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4">
              Farm Categories
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-6">
              Explore {categories.length} categories of farms, producers, and agricultural
              businesses across the UK
            </p>
            <Badge variant="default" size="lg">
              {categories.reduce((sum, cat) => sum + cat.farmCount, 0)} Total Farms
            </Badge>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Primary Categories */}
        {primaryCategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Popular Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {primaryCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        )}

        {/* Specialized Categories */}
        {specializedCategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Specialized & Seasonal
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {specializedCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        )}

        {/* Other Categories */}
        {otherCategories.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Products & Practices
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {otherCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// Category Card Component
function CategoryCard({ category }: { category: any }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-primary dark:hover:border-brand-primary"
    >
      {/* Icon */}
      {category.icon && (
        <div className="text-4xl md:text-5xl mb-3 transform transition-transform group-hover:scale-110">
          {category.icon}
        </div>
      )}

      {/* Category Name */}
      <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm md:text-base">
        {category.name}
      </h3>

      {/* Description */}
      {category.description && (
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
          {category.description}
        </p>
      )}

      {/* Farm Count Badge */}
      <Badge variant="outline" size="sm" className="text-xs">
        {category.farmCount} {category.farmCount === 1 ? 'Farm' : 'Farms'}
      </Badge>

      {/* Hover Arrow */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg
          className="w-5 h-5 text-brand-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
