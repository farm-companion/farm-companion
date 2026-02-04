'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Produce } from '@/data/produce'
import { getProduceHook, PRODUCE_FILTERS, type ProduceFilter } from '@/data/seasonal-content'
import { getProduceCategory } from '@/lib/seasonal-utils'
import { ProduceImage } from './ProduceImage'

interface SeasonalProduceGridProps {
  produce: Produce[]
  selectedMonth: number
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Full produce grid with simplified cards. Removes nutrition info,
 * percentages, and category labels. Adds editorial hooks and
 * a single dropdown filter.
 */
export function SeasonalProduceGrid({ produce, selectedMonth }: SeasonalProduceGridProps) {
  const [filter, setFilter] = useState<ProduceFilter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return produce
    if (filter === 'peak') return produce.filter(p => p.peakMonths?.includes(selectedMonth))
    return produce.filter(p => getProduceCategory(p.slug) === filter)
  }, [produce, filter, selectedMonth])

  return (
    <section className="bg-[#FDF8F3] py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header with filter */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-[28px] font-medium text-[#1A1A1A]">
            Everything in season
          </h2>

          <select
            value={filter}
            onChange={e => setFilter(e.target.value as ProduceFilter)}
            className="text-sm border border-[#EDEDED] rounded-lg px-3 py-2 bg-white text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
            aria-label="Filter produce"
          >
            {PRODUCE_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {filtered.map(item => (
              <ProduceCard
                key={item.slug}
                produce={item}
                selectedMonth={selectedMonth}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-[#8C8C8C] py-12">
            No produce matches this filter.
          </p>
        )}
      </div>
    </section>
  )
}

interface ProduceCardProps {
  produce: Produce
  selectedMonth: number
}

function ProduceCard({ produce, selectedMonth }: ProduceCardProps) {
  const isPeak = produce.peakMonths?.includes(selectedMonth) ?? false
  const hook = getProduceHook(produce.slug)

  // Format season range
  const seasonRange = produce.monthsInSeason.length > 0
    ? `${MONTH_SHORT[produce.monthsInSeason[0] - 1]} \u2013 ${MONTH_SHORT[produce.monthsInSeason[produce.monthsInSeason.length - 1] - 1]}`
    : 'Year-round'

  return (
    <Link
      href={`/seasonal/${produce.slug}`}
      className="group block bg-white border border-[#EDEDED] rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      {/* Image with blocklist-aware fallback */}
      <ProduceImage
        images={produce.images || []}
        name={produce.name}
        height="h-[140px]"
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />

      {/* Content */}
      <div className="p-3 md:p-4">
        {/* Name + Peak badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg font-medium text-[#1A1A1A] leading-tight">
            {produce.name}
          </h3>
          {isPeak && (
            <span className="flex-shrink-0 bg-[#2D5016] text-white text-[10px] font-semibold rounded px-1.5 py-0.5 uppercase tracking-wide">
              Peak
            </span>
          )}
        </div>

        {/* Hook */}
        {hook && (
          <p className="text-sm italic text-[#5C5C5C] leading-snug line-clamp-2 mb-2">
            &ldquo;{hook}&rdquo;
          </p>
        )}

        {/* Season range */}
        <p className="text-[13px] text-[#8C8C8C] mb-2">
          {seasonRange}
        </p>

        {/* CTA */}
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2D5016]">
          Find nearby
          <span aria-hidden="true">&rarr;</span>
        </span>
      </div>
    </Link>
  )
}
