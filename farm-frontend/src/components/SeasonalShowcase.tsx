'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { PRODUCE, type Produce } from '@/data/produce'

interface SeasonalShowcaseProps {
  className?: string
}

/**
 * Get current month's seasonal produce (1-12)
 */
function getSeasonalProduce(): Produce[] {
  const currentMonth = new Date().getMonth() + 1
  return PRODUCE.filter(p => p.monthsInSeason.includes(currentMonth))
}

/**
 * SeasonalShowcase - Editorial magazine-style seasonal produce carousel.
 * Luxury editorial design: serif typography, semantic colours, thin line accents,
 * generous whitespace, and minimal UI.
 */
export function SeasonalShowcase({ className = '' }: SeasonalShowcaseProps) {
  const [seasonalItems, setSeasonalItems] = useState<Produce[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [direction, setDirection] = useState(0)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const items = getSeasonalProduce()
    setSeasonalItems(items.length > 0 ? items : PRODUCE.slice(0, 6))
  }, [])

  // Auto-play carousel
  useEffect(() => {
    if (!isHovering && seasonalItems.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setDirection(1)
        setCurrentIndex(prev => (prev + 1) % seasonalItems.length)
      }, 6000)
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isHovering, seasonalItems.length])

  const handlePrevious = () => {
    setDirection(-1)
    setCurrentIndex(prev => (prev - 1 + seasonalItems.length) % seasonalItems.length)
  }

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex(prev => (prev + 1) % seasonalItems.length)
  }

  // Get current month name - client-side only to avoid hydration mismatch
  const [currentMonth, setCurrentMonth] = useState('January')

  useEffect(() => {
    setCurrentMonth(new Date().toLocaleString('en-GB', { month: 'long' }))
  }, [])

  if (seasonalItems.length === 0) return null

  const currentProduce = seasonalItems[currentIndex]

  // Fallback image if produce has no images
  const imageUrl = currentProduce.images[0]?.src ||
    `https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1600&q=80`

  // Determine season status label
  const currentMonthNum = new Date().getMonth() + 1
  const isPeak = currentProduce.peakMonths?.includes(currentMonthNum)
  const seasonLabel = isPeak ? 'Peak Season' : 'In Season'

  return (
    <section className={`py-16 md:py-24 bg-background-secondary ${className}`}>
      {/* Section Header - Editorial style */}
      <header className="max-w-2xl mx-auto px-6 mb-16 text-center">
        <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />
        <p className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-6">
          In Season
        </p>
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-foreground">
          Fresh This {currentMonth}
        </h2>
        <div className="w-px h-12 bg-border mx-auto mt-8" aria-hidden="true" />
      </header>

      {/* Showcase Container */}
      <div
        className="relative max-w-6xl mx-auto px-6"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Two-column layout */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Image - clean, no rounded corners */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="relative aspect-[4/3] overflow-hidden bg-background-secondary"
              >
                <Image
                  src={imageUrl}
                  alt={currentProduce.images[0]?.alt || currentProduce.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority={currentIndex === 0}
                />

                {/* Season badge - minimal editorial style */}
                <div className="absolute top-6 left-6">
                  <span className="inline-block px-4 py-2 text-xs tracking-[0.15em] uppercase bg-white/90 text-foreground backdrop-blur-sm">
                    {seasonLabel}
                  </span>
                </div>
              </motion.div>

              {/* Content - narrow, editorial */}
              <div className="space-y-8">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal leading-none text-foreground mb-6">
                    {currentProduce.name}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {currentProduce.monthsInSeason.map((month, idx) => (
                      <span
                        key={idx}
                        className={`text-xs tracking-[0.1em] uppercase ${
                          month === currentMonthNum
                            ? 'text-foreground font-medium'
                            : 'text-foreground-muted'
                        }`}
                      >
                        {new Date(2024, month - 1).toLocaleString('en-GB', { month: 'short' })}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Nutrition Card */}
                {currentProduce.nutritionPer100g && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="border-t border-b border-border py-6"
                  >
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground-muted mb-5">
                      Nutrition Per 100g
                    </p>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="font-serif text-2xl font-normal text-foreground">
                          {currentProduce.nutritionPer100g.kcal}
                        </div>
                        <div className="text-xs text-foreground-muted mt-1">Calories</div>
                      </div>
                      <div>
                        <div className="font-serif text-2xl font-normal text-foreground">
                          {currentProduce.nutritionPer100g.protein}g
                        </div>
                        <div className="text-xs text-foreground-muted mt-1">Protein</div>
                      </div>
                      <div>
                        <div className="font-serif text-2xl font-normal text-foreground">
                          {currentProduce.nutritionPer100g.fiber || 0}g
                        </div>
                        <div className="text-xs text-foreground-muted mt-1">Fibre</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Selection Tips */}
                {currentProduce.selectionTips && currentProduce.selectionTips.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground-muted mb-3">
                      Selection Tips
                    </p>
                    <p className="text-lg leading-[1.9] text-foreground">
                      {currentProduce.selectionTips[0]}
                    </p>
                  </motion.div>
                )}

                {/* Recipe Chips */}
                {currentProduce.recipeChips && currentProduce.recipeChips.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground-muted mb-3">
                      Recipe Ideas
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {currentProduce.recipeChips.slice(0, 3).map((recipe, idx) => (
                        <a
                          key={idx}
                          href={recipe.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-5 py-2 text-xs tracking-[0.1em] uppercase text-foreground border border-border hover:bg-foreground hover:text-background transition-colors duration-300"
                        >
                          {recipe.title}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* CTA - Editorial underline style */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Link
                    href={`/seasonal/${currentProduce.slug}`}
                    className="inline-flex items-center gap-3 text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
                  >
                    Explore {currentProduce.name}
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Minimal, like PillarCarousel */}
        {seasonalItems.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              aria-label="Previous produce"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-10 w-10 h-10 flex items-center justify-center text-foreground opacity-40 hover:opacity-100 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              onClick={handleNext}
              aria-label="Next produce"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-10 w-10 h-10 flex items-center justify-center text-foreground opacity-40 hover:opacity-100 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Progress Indicators - Thin bars */}
      {seasonalItems.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-16">
          {seasonalItems.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1)
                setCurrentIndex(index)
              }}
              aria-label={`Go to ${seasonalItems[index].name}`}
              className={`h-px transition-all duration-300 ${
                index === currentIndex
                  ? 'w-12 bg-foreground'
                  : 'w-8 bg-border hover:bg-foreground-muted'
              }`}
            />
          ))}
        </div>
      )}

      {/* View All Link - Editorial style */}
      <div className="text-center mt-12">
        <Link
          href="/seasonal"
          className="inline-block text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity"
        >
          View All Seasonal Produce
        </Link>
      </div>
    </section>
  )
}
