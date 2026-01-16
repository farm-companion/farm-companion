import Link from 'next/link'
import { getCachedTopCategories } from '@/lib/server-cache-categories'
import { Badge } from './ui/Badge'

interface CategoryGridProps {
  limit?: number
  featured?: boolean
}

export async function CategoryGrid({ limit = 12, featured = false }: CategoryGridProps) {
  // Fetch top categories by farm count
  const categories = await getCachedTopCategories(limit)

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Browse by Category
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover local farms, producers, and agricultural businesses across the UK
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Categories Link */}
        <div className="text-center mt-10">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg font-medium transition-all hover:bg-brand-primary/90 hover:shadow-md"
          >
            View All Categories
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
      </div>
    </section>
  )
}
