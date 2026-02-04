'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Produce } from '@/data/produce'
import { getMonthContent } from '@/data/seasonal-content'
import { MonthBar } from './MonthBar'
import { SeasonalHero } from './SeasonalHero'
import { SeasonalStars } from './SeasonalStars'
import { SeasonalProduceGrid } from './SeasonalProduceGrid'
import { ComingSoon } from './ComingSoon'

interface SeasonalPageClientProps {
  allProduce: Produce[]
  currentMonth: number
}

/**
 * Client-side orchestrator for the seasonal page redesign.
 * Manages month selection state and renders all sections.
 */
export function SeasonalPageClient({ allProduce, currentMonth }: SeasonalPageClientProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const content = useMemo(() => getMonthContent(selectedMonth), [selectedMonth])

  // Produce in season for the selected month
  const produceInSeason = useMemo(
    () => allProduce.filter(p => p.monthsInSeason.includes(selectedMonth)),
    [allProduce, selectedMonth]
  )

  // Hero image: use the first star's produce image so the hero
  // always shows produce that is actually in season this month.
  const heroImageUrl = useMemo(() => {
    const firstStar = content.stars[0]
    if (!firstStar) return undefined
    const produce = allProduce.find(p => p.slug === firstStar.slug)
    return produce?.images?.[0]?.src
  }, [content.stars, allProduce])

  return (
    <>
      {/* Sticky month selector */}
      <MonthBar
        currentMonth={currentMonth}
        selectedMonth={selectedMonth}
        onMonthSelect={setSelectedMonth}
      />

      {/* Dynamic hero -- image changes per month */}
      <SeasonalHero content={content} heroImageUrl={heroImageUrl} />

      {/* Stars: Worth seeking out */}
      <SeasonalStars stars={content.stars} allProduce={allProduce} />

      {/* Full produce grid */}
      <SeasonalProduceGrid
        produce={produceInSeason}
        selectedMonth={selectedMonth}
      />

      {/* Coming next month */}
      <ComingSoon content={content.comingNext} allProduce={allProduce} />

      {/* CTA: Find a farm shop */}
      <section className="bg-[#2D5016] py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-[32px] font-medium text-white mb-8">
            Now find a farm shop that stocks it.
          </h2>
          <Link
            href="/map"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#2D5016] px-8 py-4 rounded-xl font-semibold hover:bg-[#F5F5F5] transition-colors duration-200"
          >
            Open the map
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>
    </>
  )
}
