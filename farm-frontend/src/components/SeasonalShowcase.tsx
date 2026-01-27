'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, Sparkles, Flame, Leaf } from 'lucide-react'
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
 * SeasonalShowcase - Editorial magazine-style produce carousel
 * Design: High-end food photography with asymmetric layout
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

  if (seasonalItems.length === 0) return null

  const currentProduce = seasonalItems[currentIndex]
  const currentMonth = new Date().toLocaleString('en-GB', { month: 'long' })

  // Fallback image if produce has no images
  const imageUrl = currentProduce.images[0]?.src ||
    `https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1600&q=80`

  return (
    <section className={`relative py-16 md:py-24 bg-amber-50 dark:bg-[#050505] ${className}`}>
      {/* Section Header */}
      <div className="container mx-auto px-4 mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-8 bg-gradient-to-b from-primary-500 to-amber-600 dark:from-primary-400 dark:to-amber-500" />
          <span className="text-caption uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300 font-medium dark:font-normal">
            In Season
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-slate-900 dark:text-zinc-50 leading-tight font-bold dark:font-semibold">
          Fresh This {currentMonth}
        </h2>
      </div>

      {/* Showcase Container */}
      <div
        className="relative max-w-7xl mx-auto px-4"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="relative"
          >
            {/* Main Grid Layout */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Image Section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl"
              >
                <Image
                  src={imageUrl}
                  alt={currentProduce.images[0]?.alt || currentProduce.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority={currentIndex === 0}
                />

                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10" />

                {/* Season badge */}
                <div className="absolute top-6 left-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 dark:bg-[#121214] backdrop-blur-sm rounded-full shadow-lg dark:shadow-none dark:border dark:border-white/[0.08]">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                    <span className="text-caption font-medium dark:font-normal text-slate-900 dark:text-zinc-100">Peak Season</span>
                  </div>
                </div>
              </motion.div>

              {/* Content Section */}
              <div className="flex flex-col justify-center space-y-6">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <h3 className="text-5xl md:text-6xl lg:text-7xl font-serif text-slate-900 dark:text-zinc-50 leading-none mb-4 font-bold dark:font-semibold">
                    {currentProduce.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProduce.monthsInSeason.map((month, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1 text-small font-medium dark:font-normal text-slate-700 dark:text-zinc-300 bg-white/80 dark:bg-[#121214] dark:border dark:border-white/[0.06] rounded-full"
                      >
                        {new Date(2024, month - 1).toLocaleString('en-GB', { month: 'short' })}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Nutrition Card - Obsidian Surface with Specular Highlight */}
                {currentProduce.nutritionPer100g && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative p-6 bg-white/80 dark:bg-[#121214] backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.08] dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                      <span className="text-caption uppercase tracking-wider font-medium dark:font-normal text-slate-600 dark:text-zinc-400">
                        Nutrition Per 100g
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-2xl font-serif font-semibold dark:font-medium text-slate-900 dark:text-zinc-50">
                          {currentProduce.nutritionPer100g.kcal}
                        </div>
                        <div className="text-small text-slate-600 dark:text-zinc-400">Calories</div>
                      </div>
                      <div>
                        <div className="text-2xl font-serif font-semibold dark:font-medium text-slate-900 dark:text-zinc-50">
                          {currentProduce.nutritionPer100g.protein}g
                        </div>
                        <div className="text-small text-slate-600 dark:text-zinc-400">Protein</div>
                      </div>
                      <div>
                        <div className="text-2xl font-serif font-semibold dark:font-medium text-slate-900 dark:text-zinc-50">
                          {currentProduce.nutritionPer100g.fiber || 0}g
                        </div>
                        <div className="text-small text-slate-600 dark:text-zinc-400">Fiber</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tips */}
                {currentProduce.selectionTips && currentProduce.selectionTips.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-caption uppercase tracking-wider font-medium dark:font-normal text-slate-600 dark:text-zinc-400">
                        Selection Tips
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-zinc-200 leading-relaxed">
                      {currentProduce.selectionTips[0]}
                    </p>
                  </motion.div>
                )}

                {/* Recipe Chips */}
                {currentProduce.recipeChips && currentProduce.recipeChips.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                      <span className="text-caption uppercase tracking-wider font-medium dark:font-normal text-slate-600 dark:text-zinc-400">
                        Recipe Ideas
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentProduce.recipeChips.slice(0, 3).map((recipe, idx) => (
                        <a
                          key={idx}
                          href={recipe.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center px-4 py-2 bg-white dark:bg-[#121214] hover:bg-slate-900 dark:hover:bg-[#1E1E21] text-slate-900 dark:text-zinc-100 hover:text-white border border-slate-200 dark:border-white/[0.08] rounded-full transition-all duration-300 shadow-sm dark:shadow-none hover:shadow-md"
                        >
                          <span className="text-caption font-medium dark:font-normal">{recipe.title}</span>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* CTA - Kinetic Cyan glow in dark mode */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <Link
                    href={`/seasonal/${currentProduce.slug}`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-primary-500 text-white rounded-full font-medium dark:font-normal hover:bg-slate-800 dark:hover:bg-primary-400 transition-all duration-300 shadow-lg dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    Explore {currentProduce.name}
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Obsidian elevated with border luminance */}
        {seasonalItems.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              aria-label="Previous produce"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 w-14 h-14 bg-white dark:bg-[#1E1E21] hover:bg-slate-900 dark:hover:bg-[#2A2A2E] text-slate-900 dark:text-zinc-100 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg dark:shadow-none dark:border dark:border-white/[0.08] hover:shadow-xl hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              aria-label="Next produce"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 w-14 h-14 bg-white dark:bg-[#1E1E21] hover:bg-slate-900 dark:hover:bg-[#2A2A2E] text-slate-900 dark:text-zinc-100 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg dark:shadow-none dark:border dark:border-white/[0.08] hover:shadow-xl hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Progress Indicators */}
      {seasonalItems.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {seasonalItems.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1)
                setCurrentIndex(index)
              }}
              aria-label={`Go to ${seasonalItems[index].name}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-12 bg-amber-600 dark:bg-primary-400'
                  : 'w-8 bg-slate-300 dark:bg-white/[0.12] hover:bg-slate-400 dark:hover:bg-white/[0.20]'
              }`}
            />
          ))}
        </div>
      )}

      {/* View All Link */}
      <div className="text-center mt-12">
        <Link
          href="/seasonal"
          className="inline-flex items-center gap-2 text-slate-900 dark:text-zinc-100 hover:text-amber-700 dark:hover:text-primary-400 font-medium dark:font-normal transition-colors group"
        >
          <span className="border-b border-current">View all seasonal produce</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}
