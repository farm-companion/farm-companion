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
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-brand-primary/10 rounded-full mb-3 sm:mb-4">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-brand-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-text-heading mb-3 md:mb-4">
            Curated Farm Guides
          </h2>
          <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto px-4">
            Expert recommendations and comprehensive guides to help you discover the best farms across the UK
          </p>
        </div>

        {/* Featured Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 md:mb-10">
          {featuredGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/best/${guide.slug}`}
              className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-brand-primary dark:hover:border-brand-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              {/* Card Content */}
              <div className="p-5 sm:p-6">
                {/* Badge */}
                <div className="mb-3 sm:mb-4">
                  <Badge variant="default" size="sm">
                    Editor&apos;s Choice
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3 group-hover:text-brand-primary transition-colors leading-tight">
                  {guide.title}
                </h3>

                {/* Intro */}
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-3 sm:mb-4">
                  {guide.intro}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500">
                  <span>
                    {guide.faqs?.length || 0} {guide.faqs?.length === 1 ? 'FAQ' : 'FAQs'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-brand-primary font-medium group-hover:gap-2 transition-all">
                    Read Guide
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href="/best"
            className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg text-sm sm:text-base font-medium transition-all hover:border-brand-primary hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            View All Guides
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
