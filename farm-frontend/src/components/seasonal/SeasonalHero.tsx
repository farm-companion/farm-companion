'use client'

import Image from 'next/image'
import type { MonthContent } from '@/data/seasonal-content'

interface SeasonalHeroProps {
  content: MonthContent
}

/**
 * Season-appropriate background colours per quarter.
 * Used as a tint overlay so the hero image adapts to the month.
 */
const SEASON_TINT: Record<number, string> = {
  1: 'from-[#1a2a3a]/80',   // deep winter blue
  2: 'from-[#1a2a3a]/75',
  3: 'from-[#1a3a2a]/70',   // early spring green
  4: 'from-[#1a3a2a]/65',
  5: 'from-[#2a3a1a]/60',   // late spring
  6: 'from-[#3a3a1a]/55',   // summer gold
  7: 'from-[#3a3a1a]/50',
  8: 'from-[#3a3a1a]/55',
  9: 'from-[#3a2a1a]/60',   // autumn amber
  10: 'from-[#3a2a1a]/65',
  11: 'from-[#2a2a3a]/70',  // late autumn
  12: 'from-[#1a2a3a]/75',  // winter
}

/**
 * Dynamic hero section for the seasonal page.
 * Background image with season-tinted overlay. Text content
 * changes per month with editorial copy.
 */
export function SeasonalHero({ content }: SeasonalHeroProps) {
  const tint = SEASON_TINT[content.month] || 'from-[#1a3a2a]/70'

  return (
    <section className="relative min-h-[400px] md:min-h-[480px] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/seasonal-header.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={80}
        />
        {/* Season-tinted gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${tint} via-black/40 to-black/60`} />
        {/* Bottom fade for content readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Text content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-semibold text-white mb-3 tracking-tight drop-shadow-lg">
          {content.name}
        </h1>

        <p className="text-xl md:text-2xl font-medium text-white/90 mb-6 leading-snug drop-shadow-md">
          {content.tagline}
        </p>

        <p className="text-base md:text-lg text-white/85 leading-[1.7] mb-6 max-w-[720px] drop-shadow-sm">
          {content.body}
        </p>

        <p className="text-sm font-medium text-white/60">
          {content.itemsInSeason} items in season &middot; {content.atPeak} at peak
        </p>
      </div>
    </section>
  )
}
