import Link from 'next/link'
import { getCachedTopCategories } from '@/lib/server-cache-categories'

interface CategoryGridProps {
  limit?: number
}

/**
 * Browse by what you're after — brief §5.4.
 * Replaces the SaaS-style tile grid with an editorial contents-page list:
 * left editorial intro (5/12), right vertical category list (7/12).
 */
export async function CategoryGrid({ limit = 8 }: CategoryGridProps) {
  const categories = await getCachedTopCategories(limit)

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="bg-paper py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left: editorial intro (5/12) */}
          <div className="lg:col-span-5">
            <h2 className="font-clash text-3xl md:text-4xl lg:text-5xl font-semibold text-ink tracking-tight leading-tight mb-6">
              Browse by what you&apos;re after.
            </h2>
            <p className="text-body md:text-lg italic text-ink-muted leading-relaxed max-w-prose">
              Whether you&apos;re after raw milk, hogget, forced rhubarb, or somewhere
              with a caf&eacute; where the children can run, browse by what matters.
            </p>
          </div>

          {/* Right: category list (7/12) */}
          <div className="lg:col-span-7">
            <ul className="border-t border-border">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="group flex h-16 items-center justify-between gap-4 border-b border-border px-4 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
                  >
                    <span className="font-clash text-lg md:text-xl font-semibold text-ink underline-offset-4 decoration-brand transition-colors group-hover:text-brand group-hover:underline">
                      {category.name}
                    </span>
                    <span className="shrink-0 text-caption tabular-nums text-ink-muted">
                      {category.farmCount.toLocaleString('en-GB')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                href="/categories"
                className="group inline-flex items-center gap-1.5 text-body font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:underline"
              >
                All categories
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
