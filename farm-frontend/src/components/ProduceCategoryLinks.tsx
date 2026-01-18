'use client'

import Link from 'next/link'
import { Cherry, Store, Leaf, ShoppingBasket } from 'lucide-react'

interface ProduceCategoryLinksProps {
  produceSlug: string
  produceName: string
  /** Whether this produce is commonly available as PYO */
  isPYOCommon?: boolean
}

// Categories that work well with produce cross-links
const PRODUCE_CATEGORIES = [
  {
    name: 'Pick Your Own',
    slug: 'Pick Your Own',
    icon: Cherry,
    description: 'Pick fresh produce yourself'
  },
  {
    name: 'Farm Shop',
    slug: 'Farm Shop',
    icon: Store,
    description: 'Buy from farm shop counters'
  },
  {
    name: 'Organic',
    slug: 'Organic',
    icon: Leaf,
    description: 'Certified organic farms'
  },
  {
    name: 'Box Scheme',
    slug: 'Veg Box',
    icon: ShoppingBasket,
    description: 'Get it delivered weekly'
  },
]

export function ProduceCategoryLinks({ produceSlug, produceName, isPYOCommon = true }: ProduceCategoryLinksProps) {
  // Show PYO first if this produce is commonly PYO (e.g., strawberries, apples)
  const sortedCategories = isPYOCommon
    ? PRODUCE_CATEGORIES
    : PRODUCE_CATEGORIES.filter(c => c.slug !== 'Pick Your Own')

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-text-heading mb-4">
        Ways to Get {produceName}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sortedCategories.map((category) => {
          const Icon = category.icon
          return (
            <Link
              key={category.slug}
              href={`/map?produce=${produceSlug}&category=${encodeURIComponent(category.slug)}`}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border-default bg-background-canvas hover:border-brand-primary/30 hover:shadow-md transition-all duration-fast ease-gentle-spring text-center"
            >
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <span className="text-sm font-medium text-text-heading block">
                  {category.name}
                </span>
                <span className="text-xs text-text-muted">
                  {category.description}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
