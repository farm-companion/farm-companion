'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Produce } from '@/data/produce'

interface EnrichedProduce extends Produce {
  isInSeason: boolean
  isPeakSeason: boolean
  isComingSoon: boolean
  primarySeason: 'spring' | 'summer' | 'autumn' | 'winter'
}

interface SeasonalGridProps {
  allProduce: EnrichedProduce[]
  currentMonth: number
  inSeasonNow: EnrichedProduce[]
  comingSoon: EnrichedProduce[]
}

const MONTHS = [
  { value: 0, label: 'All', short: 'All' },
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' },
]

const SEASON_COLORS = {
  spring: { bg: 'bg-[#A8E6CF]', text: 'text-[#1a3a2a]', border: 'border-[#A8E6CF]' },
  summer: { bg: 'bg-[#FFD93D]', text: 'text-[#1a3a2a]', border: 'border-[#FFD93D]' },
  autumn: { bg: 'bg-[#DD6B55]', text: 'text-white', border: 'border-[#DD6B55]' },
  winter: { bg: 'bg-[#6C7A89]', text: 'text-white', border: 'border-[#6C7A89]' },
}

export default function SeasonalGrid({
  allProduce,
  currentMonth,
  inSeasonNow,
  comingSoon,
}: SeasonalGridProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(0) // 0 = all months

  // Filter produce by selected month
  const filteredProduce = useMemo(() => {
    if (selectedMonth === 0) {
      return allProduce
    }
    return allProduce.filter(p => p.monthsInSeason.includes(selectedMonth))
  }, [allProduce, selectedMonth])

  // Calculate grid items with seasonal status for selected month
  const gridItems = useMemo(() => {
    return filteredProduce.map(produce => {
      const checkMonth = selectedMonth === 0 ? currentMonth : selectedMonth
      const isInSeasonForMonth = produce.monthsInSeason.includes(checkMonth)
      const isPeakForMonth = produce.peakMonths?.includes(checkMonth) || false

      return {
        ...produce,
        isInSeasonForMonth,
        isPeakForMonth,
      }
    })
  }, [filteredProduce, selectedMonth, currentMonth])

  // Group items by status
  const inSeasonItems = gridItems.filter(p => p.isInSeasonForMonth)
  const comingSoonItems = gridItems.filter(p => p.isComingSoon && !p.isInSeasonForMonth)
  const otherItems = gridItems.filter(p => !p.isInSeasonForMonth && !p.isComingSoon)

  return (
    <div className="space-y-12">
      {/* Month Selector */}
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-caption font-['IBM_Plex_Sans_Condensed'] uppercase tracking-wider text-[#2D3436]/60">
          Filter by Month
        </h3>
        <div className="flex flex-wrap justify-center gap-2 max-w-5xl mx-auto">
          {MONTHS.map(month => (
            <button
              key={month.value}
              onClick={() => setSelectedMonth(month.value)}
              className={`
                px-4 py-2 rounded-full font-['IBM_Plex_Sans_Condensed'] font-medium text-caption
                transition-all duration-300 hover:scale-105
                ${selectedMonth === month.value
                  ? 'bg-[#1a3a2a] text-white shadow-lg'
                  : 'bg-white text-[#2D3436] border border-[#2D3436]/20 hover:border-[#1a3a2a]/40'
                }
              `}
            >
              <span className="hidden sm:inline">{month.label}</span>
              <span className="sm:hidden">{month.short}</span>
            </button>
          ))}
        </div>
        <p className="text-caption text-[#2D3436]/60 font-['Manrope']">
          {selectedMonth === 0
            ? `Showing all ${gridItems.length} items`
            : `${gridItems.length} items available in ${MONTHS[selectedMonth].label}`
          }
        </p>
      </div>

      {/* In Season Now Section */}
      {inSeasonItems.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h3
              className="text-display md:text-display font-semibold leading-[1.15] tracking-[-0.02em] text-[#1a3a2a]"
              style={{ fontFamily: 'Clash Display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              {selectedMonth === 0 ? 'In Season Now' : `In Season - ${MONTHS[selectedMonth].label}`}
            </h3>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A8E6CF]/20 border border-[#A8E6CF]">
              <span className="w-2 h-2 rounded-full bg-[#A8E6CF]" />
              <span className="text-captionall font-['IBM_Plex_Sans_Condensed'] font-medium text-[#1a3a2a]">
                {inSeasonItems.length}
              </span>
            </span>
          </div>
          <ProduceGrid items={inSeasonItems} />
        </section>
      )}

      {/* Coming Soon Section */}
      {selectedMonth === 0 && comingSoonItems.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h3
              className="text-display md:text-display font-semibold leading-[1.15] tracking-[-0.02em] text-[#1a3a2a]"
              style={{ fontFamily: 'Clash Display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              Coming Soon
            </h3>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6C7A89]/20 border border-[#6C7A89]">
              <span className="text-captionall font-['IBM_Plex_Sans_Condensed'] font-medium text-[#2D3436]">
                {comingSoonItems.length}
              </span>
            </span>
          </div>
          <ProduceGrid items={comingSoonItems} />
        </section>
      )}

      {/* Other Items Section (when filtering by month) */}
      {selectedMonth !== 0 && otherItems.length === 0 && gridItems.length === 0 && (
        <div className="text-center py-16">
          <p className="text-heading text-[#2D3436]/60 font-['Manrope']">
            No produce in season during {MONTHS[selectedMonth].label}
          </p>
        </div>
      )}
    </div>
  )
}

interface ProduceGridProps {
  items: (EnrichedProduce & { isInSeasonForMonth?: boolean; isPeakForMonth?: boolean })[]
}

function ProduceGrid({ items }: ProduceGridProps) {
  return (
    <motion.div
      layout
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {items.map((produce, index) => (
          <ProduceCardItem
            key={produce.slug}
            produce={produce}
            index={index}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

interface ProduceCardItemProps {
  produce: EnrichedProduce & { isInSeasonForMonth?: boolean; isPeakForMonth?: boolean }
  index: number
}

function ProduceCardItem({ produce, index }: ProduceCardItemProps) {
  const seasonColors = SEASON_COLORS[produce.primarySeason]
  const imageUrl = produce.images?.[0]?.src || '/placeholder-produce.jpg'
  const altText = produce.images?.[0]?.alt || `Fresh ${produce.name}`

  // Format month range
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthRange = produce.monthsInSeason.length > 0
    ? `${monthNames[produce.monthsInSeason[0] - 1]} - ${monthNames[produce.monthsInSeason[produce.monthsInSeason.length - 1] - 1]}`
    : 'Year-round'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        layout: { duration: 0.3 }
      }}
    >
      <Link
        href={`/seasonal/${produce.slug}`}
        className="group block relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#FAF8F5]">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Seasonal Badge */}
          {produce.isInSeasonForMonth && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#A8E6CF]" />
              <span className="text-captionall font-['IBM_Plex_Sans_Condensed'] font-semibold text-[#1a3a2a]">
                IN SEASON
              </span>
            </div>
          )}

          {produce.isPeakForMonth && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFD93D] shadow-lg">
              <svg className="w-3 h-3 text-[#1a3a2a]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-captionall font-['IBM_Plex_Sans_Condensed'] font-semibold text-[#1a3a2a]">
                PEAK
              </span>
            </div>
          )}

          {produce.isComingSoon && !produce.isInSeasonForMonth && (
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-[#6C7A89] text-white shadow-lg">
              <span className="text-captionall font-['IBM_Plex_Sans_Condensed'] font-semibold">
                COMING SOON
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Season Color Accent */}
          <div className={`w-12 h-1 rounded-full ${seasonColors.bg} mb-3`} />

          {/* Produce Name */}
          <h4
            className="text-display font-semibold leading-tight tracking-[-0.02em] text-[#1a3a2a] mb-2 group-hover:text-[#2D3436] transition-colors"
            style={{ fontFamily: 'Clash Display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            {produce.name}
          </h4>

          {/* Month Range */}
          <p className="text-caption text-[#2D3436]/60 font-['IBM_Plex_Sans_Condensed'] uppercase tracking-wide mb-3">
            {monthRange}
          </p>

          {/* Selection Tips Preview */}
          {produce.selectionTips && produce.selectionTips.length > 0 && (
            <p className="text-caption text-[#2D3436]/70 font-['Manrope'] leading-relaxed line-clamp-2">
              {produce.selectionTips[0]}
            </p>
          )}

          {/* Nutrition Highlight (if available) */}
          {produce.nutritionPer100g && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#FAF8F5] text-captionall font-['IBM_Plex_Sans_Condensed'] text-[#2D3436]/70">
                {produce.nutritionPer100g.kcal} kcal
              </span>
              {produce.nutritionPer100g.protein > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#FAF8F5] text-captionall font-['IBM_Plex_Sans_Condensed'] text-[#2D3436]/70">
                  {produce.nutritionPer100g.protein}g protein
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover Arrow Indicator */}
        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-8 h-8 rounded-full bg-[#1a3a2a] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
