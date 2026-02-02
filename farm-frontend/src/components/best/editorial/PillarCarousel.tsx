/**
 * PillarCarousel Component
 *
 * Horizontal carousel with square aspect-ratio images and hidden scrollbars.
 * For footer navigation to other guides.
 *
 * WCAG AA Compliant: Uses semantic color system for dark/light mode support.
 */

'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface PillarItem {
  href: string
  title: string
  image: {
    src: string
    alt: string
  }
}

interface PillarCarouselProps {
  items: PillarItem[]
  title?: string
  className?: string
}

export function PillarCarousel({ items, title, className = '' }: PillarCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.offsetWidth * 0.6
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <section className={`py-16 md:py-24 bg-card ${className}`}>
      {/* Header with title and navigation */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="flex items-center justify-between">
          {title && (
            <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted">
              {title}
            </h2>
          )}

          {/* Navigation arrows */}
          <div className="flex gap-4">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 flex items-center justify-center text-foreground opacity-40 hover:opacity-100 transition-opacity"
              aria-label="Scroll left"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 flex items-center justify-center text-foreground opacity-40 hover:opacity-100 transition-opacity"
              aria-label="Scroll right"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable carousel - hidden scrollbar */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto px-6 pb-4 scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {items.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className="group flex-shrink-0 w-64 md:w-72"
          >
            {/* Square image container */}
            <div className="relative aspect-square overflow-hidden bg-background-secondary mb-4">
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="288px"
              />
            </div>

            {/* Title */}
            <h3 className="text-sm tracking-[0.05em] text-foreground group-hover:opacity-70 transition-opacity duration-300 line-clamp-2">
              {item.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  )
}
