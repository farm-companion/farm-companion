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
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header - Obsidian-Kinetic styling */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold dark:font-semibold text-zinc-900 dark:text-zinc-50 mb-3 md:mb-4">
            Browse by Category
          </h2>
          <p className="text-body sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto px-4">
            Discover local farms, producers, and agricultural businesses across the UK
          </p>
        </div>

        {/* Category Grid - Obsidian cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categories.map((category: any) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative bg-white dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-4 sm:p-5 md:p-6 min-h-[120px] sm:min-h-[140px] transition-all duration-300 hover:shadow-lg dark:hover:shadow-none hover:-translate-y-1 hover:border-cyan-500 dark:hover:border-white/[0.16] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            >
              {/* Icon */}
              {category.icon && (
                <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 transform transition-transform group-hover:scale-110">
                  {category.icon}
                </div>
              )}

              {/* Category Name - adaptive font weight */}
              <h3 className="font-semibold dark:font-medium text-zinc-900 dark:text-zinc-50 mb-1 sm:mb-2 text-caption leading-tight">
                {category.name}
              </h3>

              {/* Farm Count Badge */}
              <Badge variant="outline" size="sm" className="text-small">
                {category.farmCount} {category.farmCount === 1 ? 'Farm' : 'Farms'}
              </Badge>

              {/* Hover Arrow (hidden on touch devices) */}
              <div className="hidden sm:block absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="text-center mt-8 md:mt-10">
          <Link
            href="/categories"
            className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 bg-brand-primary text-white rounded-lg text-caption font-medium transition-all hover:bg-brand-primary/90 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            View All Categories
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
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
