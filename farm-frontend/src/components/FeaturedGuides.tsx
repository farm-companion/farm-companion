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
    <section className="py-16 md:py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-brand-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-heading mb-4">
            Curated Farm Guides
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Expert recommendations and comprehensive guides to help you discover the best farms across the UK
          </p>
        </div>

        {/* Featured Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-10">
          {featuredGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/best/${guide.slug}`}
              className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-brand-primary dark:hover:border-brand-primary"
            >
              {/* Card Content */}
              <div className="p-6">
                {/* Badge */}
                <div className="mb-4">
                  <Badge variant="default" size="sm">
                    Editor&apos;s Choice
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 group-hover:text-brand-primary transition-colors">
                  {guide.title}
                </h3>

                {/* Intro */}
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                  {guide.intro}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {guide.faqs?.length || 0} {guide.faqs?.length === 1 ? 'FAQ' : 'FAQs'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-brand-primary font-medium group-hover:gap-2 transition-all">
                    Read Guide
                    <ArrowRight className="w-4 h-4" />
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg font-medium transition-all hover:border-brand-primary hover:shadow-md"
          >
            View All Guides
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
