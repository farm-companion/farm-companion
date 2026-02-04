'use client'

import type { ComingNextContent } from '@/data/seasonal-content'
import type { Produce } from '@/data/produce'
import { ProduceImage } from './ProduceImage'

interface ComingSoonProps {
  content: ComingNextContent
  allProduce: Produce[]
}

/**
 * "Coming next month" teaser section. Builds anticipation
 * with a short description and small preview cards.
 */
export function ComingSoon({ content, allProduce }: ComingSoonProps) {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-[28px] font-medium text-[#1A1A1A] mb-4">
          Coming next month
        </h2>

        <p className="text-base text-[#3D3D3D] leading-relaxed mb-8 max-w-2xl">
          {content.body}
        </p>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {content.previews.map(preview => {
            const produce = allProduce.find(p => p.slug === preview.slug)
            const images = produce?.images || []

            return (
              <div
                key={`${preview.slug}-${preview.month}`}
                className="flex-shrink-0 w-[140px] md:w-[160px]"
              >
                <div className="relative rounded-lg overflow-hidden mb-2">
                  <div className="grayscale opacity-80">
                    <ProduceImage
                      images={images}
                      name={preview.name}
                      height="h-[100px]"
                      sizes="160px"
                    />
                  </div>
                  {/* Month overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 z-10">
                    <span className="text-xs text-white font-medium">
                      {preview.month}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {preview.name}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
