import Link from 'next/link'
import { bestLists } from '@/data/best-lists'

/**
 * FeaturedGuides — From the Journal (brief §5.5, all-light).
 * Editorial guide cards on paper: caption overline, Clash title, excerpt,
 * "Read on →". No dark photo backdrop, no glass cards, no FAQ counts.
 */
export function FeaturedGuides() {
  const featuredGuides = bestLists.filter((list) => list.featured).slice(0, 3)

  if (featuredGuides.length === 0) {
    return null
  }

  return (
    <section className="bg-paper py-24 md:py-32">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-caption uppercase tracking-[0.18em] text-ink-muted mb-4">
            From the journal
          </p>
          <h2 className="font-clash text-3xl md:text-4xl lg:text-5xl font-semibold text-ink tracking-tight leading-tight mb-5">
            Worth planning a day around.
          </h2>
          <p className="text-body md:text-lg text-ink-muted leading-relaxed">
            We visit, we taste, we ask questions. Guides to the farm shops and
            seasons we think are worth the drive.
          </p>
        </div>

        {/* Guide grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-12">
          {featuredGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/best/${guide.slug}`}
              className="group flex flex-col border-t border-border pt-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <span className="text-caption uppercase tracking-[0.16em] text-ink-muted mb-4">
                Guide
              </span>
              <h3 className="font-clash text-xl md:text-2xl font-semibold text-ink leading-tight mb-3 underline-offset-4 decoration-brand transition-colors group-hover:text-brand group-hover:underline">
                {guide.title}
              </h3>
              <p className="text-body text-ink-muted leading-relaxed line-clamp-3 mb-5">
                {guide.intro}
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 text-body font-medium text-brand">
                Read on
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </span>
            </Link>
          ))}
        </div>

        {/* All guides link */}
        <Link
          href="/best"
          className="group inline-flex items-center gap-1.5 text-body font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:underline"
        >
          All guides
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            &rarr;
          </span>
        </Link>
      </div>
    </section>
  )
}
