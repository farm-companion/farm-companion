import Image from 'next/image'
import Link from 'next/link'
import { bestLists } from '@/data/best-lists'

const FEATURED_HERO_IMAGES: Record<string, { src: string; alt: string }> = {
  'best-organic-farms-uk': {
    src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&q=80&auto=format&fit=crop',
    alt: 'Greenhouse rows with organic seedlings in afternoon light',
  },
  'top-pick-your-own-farms': {
    src: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1400&q=80&auto=format&fit=crop',
    alt: 'Golden sunlight filtering through strawberry fields',
  },
  'best-farm-shops-london': {
    src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=80&auto=format&fit=crop',
    alt: 'Artisan produce arranged in a farm shop',
  },
}

/**
 * FeaturedGuides — From the Journal (brief §5.5, all-light).
 * Pitti Press editorial spread: masthead, asymmetric 7/5 layout with one lead
 * story (image + headline) flanked by two supporting stories on hairline rules.
 * Sequence numerals in mono per DESIGN.md "Sequence Numerals"; one Vermilion
 * anchor word in the headline as the single stamp.
 */
export function FeaturedGuides() {
  const featuredGuides = bestLists.filter((list) => list.featured).slice(0, 3)
  if (featuredGuides.length === 0) return null

  const [lead, ...supporting] = featuredGuides
  const leadImage = FEATURED_HERO_IMAGES[lead.slug]

  return (
    <section className="bg-paper py-24 md:py-32" aria-labelledby="journal-heading">
      <div className="container mx-auto px-6">
        {/* Masthead */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted mb-7 flex items-center gap-3">
            <span aria-hidden className="inline-block w-10 h-px bg-ink-muted" />
            Farm Companion Journal
            <span aria-hidden className="text-ink-subtle">·</span>
            <span className="tabular-nums">No. 03 · Summer</span>
          </p>
          <h2
            id="journal-heading"
            className="font-clash text-4xl md:text-5xl lg:text-6xl font-semibold text-ink tracking-tight leading-[1.05] text-balance mb-7"
          >
            Worth planning <span className="text-[var(--brand)]">a day around.</span>
          </h2>
          <p className="font-body text-lg md:text-xl text-ink-muted leading-relaxed text-pretty max-w-[55ch]">
            We visit, we taste, we ask questions. Three guides we think are
            worth the drive this season.
          </p>
        </div>

        {/* Editorial spread: 7 / 5 split on desktop, stacked below lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 lg:gap-x-16 gap-y-16">
          {/* Lead story */}
          <article className="lg:col-span-7">
            <Link
              href={`/best/${lead.slug}`}
              className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
            >
              {leadImage && (
                <div className="relative aspect-[4/5] md:aspect-[3/2] overflow-hidden bg-surface-2 mb-8">
                  <Image
                    src={leadImage.src}
                    alt={leadImage.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
              )}
              <div className="flex items-baseline gap-5 mb-5">
                <span className="font-mono text-sm tabular-nums text-ink-muted shrink-0">
                  01
                </span>
                <span aria-hidden className="h-px flex-1 bg-border" />
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-subtle shrink-0">
                  Lead story
                </span>
              </div>
              <h3 className="font-clash text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-ink tracking-tight leading-[1.08] text-balance mb-4 decoration-[var(--brand)] decoration-2 underline-offset-[6px] group-hover:underline">
                {lead.title}
              </h3>
              <p className="font-body text-base md:text-lg text-ink-muted leading-relaxed text-pretty line-clamp-4 max-w-[58ch] mb-6">
                {lead.intro}
              </p>
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-accent">
                Read the guide
                <span
                  aria-hidden
                  className="transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          </article>

          {/* Supporting stories */}
          <div className="lg:col-span-5 flex flex-col">
            {supporting.map((guide, idx) => {
              const num = String(idx + 2).padStart(2, '0')
              return (
                <article
                  key={guide.slug}
                  className={idx === 0 ? '' : 'pt-10 mt-10 border-t border-border'}
                >
                  <Link
                    href={`/best/${guide.slug}`}
                    className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                  >
                    <div className="flex items-baseline gap-5 mb-4">
                      <span className="font-mono text-sm tabular-nums text-ink-muted shrink-0">
                        {num}
                      </span>
                      <span aria-hidden className="h-px flex-1 bg-border" />
                    </div>
                    <h3 className="font-clash text-2xl md:text-3xl font-semibold text-ink tracking-tight leading-[1.12] text-balance mb-3 decoration-[var(--brand)] decoration-2 underline-offset-[6px] group-hover:underline">
                      {guide.title}
                    </h3>
                    <p className="font-body text-base text-ink-muted leading-relaxed text-pretty line-clamp-3 mb-5">
                      {guide.intro}
                    </p>
                    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-accent">
                      Read on
                      <span
                        aria-hidden
                        className="transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                      >
                        &rarr;
                      </span>
                    </span>
                  </Link>
                </article>
              )
            })}
          </div>
        </div>

        {/* All guides CTA */}
        <div className="mt-20 md:mt-24 pt-10 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-subtle">
            More from the journal
          </p>
          <Link
            href="/best"
            className="group inline-flex items-center gap-3 font-mono text-sm uppercase tracking-[0.14em] text-accent transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:underline underline-offset-[6px] decoration-2 decoration-accent"
          >
            All guides
            <span
              aria-hidden
              className="transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            >
              &rarr;
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
