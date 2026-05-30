import Link from 'next/link'
import { getCachedTopCategories } from '@/lib/server-cache-categories'

interface CategoryGridProps {
  limit?: number
}

// Editorial taglines keyed by category slug. Untagged slugs render without a
// tagline (graceful fallback). Pitti Press voice: specific nouns over hype.
const CATEGORY_TAGLINES: Record<string, string> = {
  'farm-shops': 'Direct-from-farm produce, year round.',
  'meat-producers': 'Butchery, charcuterie, traceable cuts.',
  'vegetable-farms': "Beds, polytunnels, what's in the ground this month.",
  'fruit-farms': 'Orchards and soft fruit. The May to October beat.',
  'dairy-farms': 'Raw milk, hand-pulled cheese, butter the colour of straw.',
  'bakeries-flour-mills': 'Sourdough, stoneground flour, daily bakes.',
  'free-range-eggs': 'Yolks like a setting sun.',
  'farm-cafes': 'Lunch where your produce grew up.',
}

/**
 * Browse by what you're after — brief §5.4.
 * Pitti Press magazine contents page: left masthead (5/12, sticky on lg),
 * right index column (7/12) with a promoted lead category (text-3xl, "Most
 * popular" eyebrow, tagline) and numbered supporting rows. Sequence
 * numerals per DESIGN.md; one Vermilion anchor in the headline.
 */
export async function CategoryGrid({ limit = 8 }: CategoryGridProps) {
  const categories = await getCachedTopCategories(limit)
  if (categories.length === 0) return null

  const [lead, ...rest] = categories

  return (
    <section className="bg-paper py-24 md:py-32" aria-labelledby="index-heading">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-12 lg:gap-x-16">
          {/* Left: editorial masthead (5/12) — sticky on lg so the headline */}
          {/* stays anchored as the reader scans the index. */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted mb-7 flex items-center gap-3">
              <span aria-hidden className="inline-block w-10 h-px bg-ink-muted" />
              Index
              <span aria-hidden className="text-ink-subtle">·</span>
              <span className="tabular-nums">No. 04</span>
            </p>
            <h2
              id="index-heading"
              className="font-clash text-4xl md:text-5xl lg:text-6xl font-semibold text-ink tracking-tight leading-[1.05] text-balance mb-7"
            >
              Browse by{' '}
              <span className="text-brand">what you&apos;re after.</span>
            </h2>
            <p className="font-body text-lg italic text-ink-muted leading-relaxed text-pretty max-w-[42ch] mb-8">
              Whether you&apos;re after raw milk, hogget, forced rhubarb, or
              somewhere with a caf&eacute; where the children can run, browse
              by what matters.
            </p>
            <div className="hidden lg:block w-12 border-t border-border" />
          </div>

          {/* Right: category index (7/12) */}
          <div className="lg:col-span-7">
            {/* Lead category — promoted with bigger type + tagline */}
            <Link
              href={`/categories/${lead.slug}`}
              className="group block border-t-2 border-ink pt-8 pb-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
            >
              <div className="flex items-baseline gap-5 mb-5">
                <span className="font-mono text-sm tabular-nums text-ink-muted shrink-0">
                  01
                </span>
                <span aria-hidden className="h-px flex-1 bg-border" />
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-subtle shrink-0">
                  Most popular
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-6">
                <h3 className="font-clash text-3xl md:text-4xl font-semibold text-ink tracking-tight leading-[1.1] text-balance decoration-brand decoration-2 underline-offset-[6px] group-hover:underline">
                  {lead.name}
                </h3>
                <span className="font-mono text-base tabular-nums text-ink-muted shrink-0">
                  {lead.farmCount.toLocaleString('en-GB')}
                </span>
              </div>
              {CATEGORY_TAGLINES[lead.slug] && (
                <p className="font-body text-base md:text-lg text-ink-muted leading-relaxed mt-3 max-w-[55ch]">
                  {CATEGORY_TAGLINES[lead.slug]}
                </p>
              )}
            </Link>

            {/* Supporting categories — magazine index rows */}
            <ul>
              {rest.map((category, idx) => {
                const num = String(idx + 2).padStart(2, '0')
                const tagline = CATEGORY_TAGLINES[category.slug]
                return (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="group block border-t border-border py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                    >
                      <div className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4">
                        <span className="font-mono text-sm tabular-nums text-ink-muted">
                          {num}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-clash text-xl md:text-2xl font-semibold text-ink leading-tight decoration-brand decoration-2 underline-offset-[6px] group-hover:underline">
                            {category.name}
                          </h3>
                          {tagline && (
                            <p className="hidden md:block font-body text-sm text-ink-muted leading-snug mt-1.5 max-w-[50ch]">
                              {tagline}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-sm tabular-nums text-ink-muted self-baseline">
                          {category.farmCount.toLocaleString('en-GB')}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* All-categories CTA */}
            <div className="border-t border-border mt-2 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-subtle">
                Full directory
              </p>
              <Link
                href="/categories"
                className="group inline-flex items-center gap-3 font-mono text-sm uppercase tracking-[0.14em] text-accent transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:underline underline-offset-[6px] decoration-2 decoration-accent"
              >
                All categories
                <span
                  aria-hidden
                  className="transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                >
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
