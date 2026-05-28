'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { HeroVideoBackground } from './HeroVideoBackground'
import { getCurrentMonth, getMonthName, getProduceInSeason } from '@/lib/seasonal-utils'

interface AnimatedHeroProps {
  countyCount: number
  videoSrc?: string
  videoPoster?: string
}

/**
 * Homepage hero — brief §5.2 (Pitti Press, all-light).
 * Full-bleed illustration with a contained, left-aligned --paper overlay so
 * copy never floats on the illustration's busiest section. One search field,
 * no second CTA, no floating month pill.
 */
export function AnimatedHero({ countyCount, videoSrc, videoPoster }: AnimatedHeroProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  // Deterministic and pure, so compute once on render (no effect, no
  // hydration mismatch beyond the negligible month-boundary case).
  const [{ monthName, produceLine }] = useState(() => {
    const month = getCurrentMonth()
    const top = getProduceInSeason(month).slice(0, 3).map((p) => p.name.toLowerCase())
    const line = top.length > 0 ? top.join(', ') : 'fresh seasonal produce'
    return {
      monthName: getMonthName(month),
      produceLine: line.charAt(0).toUpperCase() + line.slice(1),
    }
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    router.push(trimmed ? `/map?q=${encodeURIComponent(trimmed)}` : '/map')
  }

  return (
    <section
      data-immersive-hero="light"
      className="relative overflow-hidden bg-paper h-[65vh] min-h-[460px] md:h-[78vh] md:max-h-[820px]"
    >
      <HeroVideoBackground
        videoSrc={videoSrc}
        videoPoster={videoPoster}
        imageSrc="/images/pitti/hero-homepage-dev-seed50920962-v2.webp"
        imageAlt="Pitti Press illustration of the UK countryside in midsummer, rolling fields with dry-stone walls, a red tractor, cottages, and a low red sun"
        className="absolute inset-0"
      />

      <h1 className="sr-only">Farm Companion — Find UK Farm Shops</h1>

      {/* Contained bottom-left overlay (max 580px, translucent paper) */}
      <div className="relative h-full flex items-end">
        <div className="w-full max-w-[580px] m-5 md:m-10 p-6 md:p-8 bg-[#F2EBDA]/92 backdrop-blur-sm border border-border shadow-sm">
          <p
            className="text-caption uppercase tracking-[0.18em] text-ink-muted mb-3"
            suppressHydrationWarning
          >
            {monthName ? `${monthName} · ` : ''}What&apos;s in season now
          </p>

          <h2 className="font-clash text-4xl md:text-5xl lg:text-6xl font-semibold text-ink tracking-tight leading-[1.05] mb-4">
            Farm shops worth the detour.
          </h2>

          <p className="text-body md:text-lg text-ink-muted leading-relaxed mb-6" suppressHydrationWarning>
            {produceLine}. Across {countyCount} counties of Britain.
          </p>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-subtle pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Postcode, town, or farm name"
              aria-label="Search farm shops by postcode, town, or farm name"
              className="w-full h-14 pl-12 pr-28 rounded-full bg-paper border border-ink/20 text-ink placeholder:text-ink-subtle outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center h-10 px-5 rounded-full bg-brand text-brand-text text-sm font-semibold transition-colors hover:bg-brand-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Illustration credit, bottom-right (brief §5.2) */}
      <p className="absolute bottom-3 right-4 text-[11px] tracking-wide text-paper/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] pointer-events-none">
        Illustration · Pitti Press for Farm Companion
      </p>
    </section>
  )
}
