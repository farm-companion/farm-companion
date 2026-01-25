import Link from 'next/link'
import { bestLists } from '@/data/best-lists'
import { Badge } from './ui/Badge'
import { BookOpen, ArrowRight } from 'lucide-react'

export function FeaturedGuides() {
  // Get featured guides only
  const featuredGuides = bestLists.filter((list) => list.featured).slice(0, 3)

  if (featuredGuides.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-zinc-50 to-white dark:from-[#0A0A0B] dark:to-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header - Obsidian-Kinetic styling */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full mb-3 sm:mb-4">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold dark:font-semibold text-zinc-900 dark:text-zinc-50 mb-3 md:mb-4">
            Curated Farm Guides
          </h2>
          <p className="text-body sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto px-4">
            Expert recommendations and comprehensive guides to help you discover the best farms across the UK
          </p>
        </div>

        {/* Featured Guides Grid - Obsidian cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 md:mb-10">
          {featuredGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/best/${guide.slug}`}
              className="group relative bg-white dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-none hover:-translate-y-1 hover:border-cyan-500 dark:hover:border-white/[0.16] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            >
              {/* Card Content */}
              <div className="p-5 sm:p-6">
                {/* Badge */}
                <div className="mb-3 sm:mb-4">
                  <Badge variant="default" size="sm">
                    Editor&apos;s Choice
                  </Badge>
                </div>

                {/* Title - adaptive font weight */}
                <h3 className="text-lg sm:text-xl font-semibold dark:font-medium text-zinc-900 dark:text-zinc-50 mb-2 sm:mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-tight">
                  {guide.title}
                </h3>

                {/* Intro */}
                <p className="text-caption text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-3 sm:mb-4">
                  {guide.intro}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs sm:text-caption text-zinc-500 dark:text-zinc-400">
                  <span>
                    {guide.faqs?.length || 0} {guide.faqs?.length === 1 ? 'FAQ' : 'FAQs'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium group-hover:gap-2 transition-all">
                    Read Guide
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 dark:bg-cyan-400/5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            </Link>
          ))}
        </div>

        {/* View All Link - Obsidian button */}
        <div className="text-center">
          <Link
            href="/best"
            className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 bg-white dark:bg-[#121214] border-2 border-zinc-200 dark:border-white/[0.12] text-zinc-900 dark:text-zinc-50 rounded-lg text-caption sm:text-body font-semibold dark:font-medium transition-all hover:border-cyan-500 dark:hover:border-white/[0.20] hover:shadow-md dark:hover:shadow-none active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
          >
            View All Guides
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
