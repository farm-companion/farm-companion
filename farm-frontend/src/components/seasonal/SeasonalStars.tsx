'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { StarItem } from '@/data/seasonal-content'
import type { Produce } from '@/data/produce'

interface SeasonalStarsProps {
  stars: StarItem[]
  allProduce: Produce[]
}

/**
 * "Worth seeking out" section. 3-4 highlighted produce items
 * that are exceptional this month with editorial hooks.
 */
export function SeasonalStars({ stars, allProduce }: SeasonalStarsProps) {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-[28px] font-medium text-[#1A1A1A] mb-10">
          Worth seeking out
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stars.slice(0, 3).map(star => {
            const produce = allProduce.find(p => p.slug === star.slug)
            const imageUrl = produce?.images?.[0]?.src
            const altText = produce?.images?.[0]?.alt || `Fresh ${star.name}`

            return (
              <div
                key={star.slug}
                className="bg-white border border-[#EDEDED] rounded-xl overflow-hidden group"
              >
                {/* Image */}
                <div className="relative h-[200px] bg-[#F5F5F5] overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={altText}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#8C8C8C]">
                      {star.name}
                    </div>
                  )}
                </div>

                {/* Text content */}
                <div className="p-5">
                  <h3 className="text-[22px] font-medium text-[#1A1A1A] mb-3">
                    {star.name}
                  </h3>

                  <p className="text-[15px] italic text-[#5C5C5C] mb-3 leading-relaxed">
                    &ldquo;{star.hook}&rdquo;
                  </p>

                  <p className="text-[13px] text-[#8C8C8C] mb-4">
                    {star.peakLabel}
                  </p>

                  <Link
                    href={`/map?q=${encodeURIComponent(star.name)}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#2D5016] hover:underline"
                  >
                    {star.ctaLabel}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
