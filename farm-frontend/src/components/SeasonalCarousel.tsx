'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from './ui/Button'

interface SeasonalItem {
  id: string
  name: string
  slug: string
  month: string
  description: string
  imageUrl: string
  farmCount: number
}

interface SeasonalCarouselProps {
  className?: string
}

// Get current seasonal produce based on month
const getSeasonalProduce = (): SeasonalItem[] => {
  const currentMonth = new Date().getMonth() + 1 // 1-12

  const seasonalData: Record<number, SeasonalItem[]> = {
    1: [ // January
      {
        id: '1',
        name: 'Brussels Sprouts',
        slug: 'brussels-sprouts',
        month: 'January',
        description: 'Fresh winter vegetables perfect for roasting',
        imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
        farmCount: 24
      },
      {
        id: '2',
        name: 'Kale',
        slug: 'kale',
        month: 'January',
        description: 'Nutrient-rich leafy greens at their peak',
        imageUrl: 'https://images.unsplash.com/photo-1590777787021-3b0e8c137430?w=800&q=80',
        farmCount: 31
      },
      {
        id: '3',
        name: 'Parsnips',
        slug: 'parsnips',
        month: 'January',
        description: 'Sweet root vegetables ideal for winter soups',
        imageUrl: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800&q=80',
        farmCount: 18
      }
    ],
    6: [ // June
      {
        id: '1',
        name: 'Strawberries',
        slug: 'strawberries',
        month: 'June',
        description: 'Fresh summer berries perfect for picking',
        imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80',
        farmCount: 45
      },
      {
        id: '2',
        name: 'Asparagus',
        slug: 'asparagus',
        month: 'June',
        description: 'Tender spears at peak season',
        imageUrl: 'https://images.unsplash.com/photo-1565508324972-d9e898a59e1a?w=800&q=80',
        farmCount: 22
      },
      {
        id: '3',
        name: 'New Potatoes',
        slug: 'new-potatoes',
        month: 'June',
        description: 'Fresh early potatoes with tender skin',
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
        farmCount: 38
      }
    ]
  }

  // Fallback seasonal items if month not defined
  const defaultSeasonalItems: SeasonalItem[] = [
    {
      id: '1',
      name: 'Fresh Vegetables',
      slug: 'vegetables',
      month: 'Year-round',
      description: 'Locally grown seasonal produce',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
      farmCount: 156
    },
    {
      id: '2',
      name: 'Free Range Eggs',
      slug: 'eggs',
      month: 'Year-round',
      description: 'Fresh eggs from happy hens',
      imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80',
      farmCount: 89
    },
    {
      id: '3',
      name: 'Dairy Products',
      slug: 'dairy',
      month: 'Year-round',
      description: 'Fresh milk, cheese and butter',
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80',
      farmCount: 67
    }
  ]

  return seasonalData[currentMonth] || defaultSeasonalItems
}

/**
 * SeasonalCarousel component displays currently in-season produce
 * Features: horizontal scrolling, auto-play, pause on hover, swipe gestures
 */
export function SeasonalCarousel({ className = '' }: SeasonalCarouselProps) {
  const [seasonalItems, setSeasonalItems] = useState<SeasonalItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSeasonalItems(getSeasonalProduce())
  }, [])

  // Auto-play carousel
  useEffect(() => {
    if (!isHovering && seasonalItems.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % seasonalItems.length)
      }, 5000) // Change every 5 seconds
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isHovering, seasonalItems.length])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + seasonalItems.length) % seasonalItems.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % seasonalItems.length)
  }

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
  }

  if (seasonalItems.length === 0) {
    return null
  }

  return (
    <section className={`py-12 md:py-16 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-brand-accent" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              In Season Now
            </h2>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover what's fresh and available at local farms this month
          </p>
        </div>

        {/* Carousel Container */}
        <div
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Carousel */}
          <div className="relative overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="relative aspect-[16/9] md:aspect-[21/9] bg-gray-100 dark:bg-gray-800"
              >
                {/* Background Image */}
                <Image
                  src={seasonalItems[currentIndex].imageUrl}
                  alt={seasonalItems[currentIndex].name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  className="object-cover"
                  priority={currentIndex === 0}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="max-w-xl"
                  >
                    <span className="inline-block px-3 py-1 bg-brand-accent text-obsidian text-sm font-semibold rounded-full mb-4">
                      {seasonalItems[currentIndex].month}
                    </span>

                    <h3 className="text-3xl md:text-5xl font-bold text-white mb-4">
                      {seasonalItems[currentIndex].name}
                    </h3>

                    <p className="text-white/90 text-lg mb-2">
                      {seasonalItems[currentIndex].description}
                    </p>

                    <p className="text-white/70 text-sm mb-6">
                      Available at {seasonalItems[currentIndex].farmCount} farms
                    </p>

                    <Link href={`/seasonal/${seasonalItems[currentIndex].slug}`}>
                      <Button variant="primary" size="lg" className="shadow-premium-lg">
                        Find Farms
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            aria-label="Previous item"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-900 transition-all opacity-0 md:opacity-100 hover:scale-110 shadow-premium"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Next item"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-900 transition-all opacity-0 md:opacity-100 hover:scale-110 shadow-premium"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {seasonalItems.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-brand-primary'
                    : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* View All Seasonal Link */}
        <div className="text-center mt-10">
          <Link
            href="/seasonal"
            className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 font-medium transition-colors"
          >
            View all seasonal produce
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
