/**
 * EditorialHero Component
 *
 * Full-bleed immersive hero with minimalist typography and scroll indicator.
 * Follows "Rule of One": single focal point (the title).
 */

'use client'

import Image from 'next/image'
import { ScrollIndicator } from './ScrollIndicator'

interface EditorialHeroProps {
  title: string
  subtitle?: string
  image: {
    src: string
    alt: string
  }
  scrollTarget?: string
}

export function EditorialHero({ title, subtitle, image, scrollTarget = '#content' }: EditorialHeroProps) {
  return (
    <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden bg-[#F9F9F9]">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Subtle gradient overlay - not heavy, just enough for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* Centered minimalist content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
        {/* Thin horizontal rule above title */}
        <div className="w-px h-16 bg-white/60 mb-8" aria-hidden="true" />

        {/* Title - Crimson Pro serif, elegant */}
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal text-white tracking-tight leading-[1.1] max-w-4xl">
          {title}
        </h1>

        {/* Subtitle - wide-tracked sans-serif */}
        {subtitle && (
          <p className="mt-6 text-sm md:text-base text-white/80 tracking-[0.15em] uppercase font-medium max-w-2xl">
            {subtitle}
          </p>
        )}

        {/* Thin horizontal rule below */}
        <div className="w-px h-16 bg-white/60 mt-8" aria-hidden="true" />
      </div>

      {/* Scroll indicator at bottom */}
      <ScrollIndicator targetId={scrollTarget} />
    </section>
  )
}
