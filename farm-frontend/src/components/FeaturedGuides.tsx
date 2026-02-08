import Link from 'next/link'
import Image from 'next/image'
import { bestLists } from '@/data/best-lists'
import { Badge } from './ui/Badge'
import { BookOpen, ArrowRight } from 'lucide-react'

/**
 * FeaturedGuides - Luxury Editorial Section
 *
 * LV-inspired design with full-bleed background image,
 * sophisticated gradient overlay, and elegant card styling.
 */
export function FeaturedGuides() {
  // Get featured guides only
  const featuredGuides = bestLists.filter((list) => list.featured).slice(0, 3)

  if (featuredGuides.length === 0) {
    return null
  }

  return (
    <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=70&auto=format"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          quality={25}
        />
        {/* Sophisticated multi-layer overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          {/* Vertical line accent */}
          <div className="w-px h-12 bg-white/40 mx-auto mb-8" aria-hidden="true" />

          <div className="inline-flex items-center justify-center w-16 h-16 border border-white/30 rounded-full mb-6">
            <BookOpen className="w-7 h-7 text-white/90" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 tracking-tight">
            Farm Shops We Keep Going Back To
          </h2>

          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Any directory can list addresses. We visit, we taste, we ask questions. These are the places that made us drive an extra twenty minutes, fill the boot, and tell everyone we know.
          </p>

          {/* Vertical line accent */}
          <div className="w-px h-12 bg-white/40 mx-auto mt-8" aria-hidden="true" />
        </div>

        {/* Featured Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12 md:mb-16">
          {featuredGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/best/${guide.slug}`}
              className="group relative bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden transition-all duration-500 hover:bg-white/15 hover:border-white/40 hover:-translate-y-1 active:scale-[0.98]"
            >
              {/* Card Content */}
              <div className="p-6 sm:p-8">
                {/* Badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 text-xs tracking-[0.1em] uppercase bg-white/20 text-white/90 rounded-full">
                    Editor&apos;s Choice
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-white mb-3 group-hover:text-white/90 transition-colors leading-tight">
                  {guide.title}
                </h3>

                {/* Intro */}
                <p className="text-sm text-white/60 line-clamp-3 mb-6 leading-relaxed">
                  {guide.intro}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>
                    {guide.faqs?.length || 0} {guide.faqs?.length === 1 ? 'FAQ' : 'FAQs'}
                  </span>
                  <span className="inline-flex items-center gap-2 text-white/80 font-medium group-hover:gap-3 transition-all">
                    Read Guide
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Subtle hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent" />
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href="/best"
            className="inline-flex items-center justify-center gap-3 h-14 px-8 bg-white text-slate-900 rounded-full text-sm tracking-[0.05em] font-medium transition-all duration-300 hover:bg-white/90 hover:shadow-lg hover:shadow-white/20 active:scale-[0.98]"
          >
            See All Recommendations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
