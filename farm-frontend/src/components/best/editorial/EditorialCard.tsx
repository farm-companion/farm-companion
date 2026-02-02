/**
 * EditorialCard Component
 *
 * High-fashion article card with minimalist interactions.
 * No shadows. Image scaling (1.05x) and text opacity shifts on hover.
 *
 * WCAG AA Compliant: Uses semantic color system for dark/light mode support.
 */

import Image from 'next/image'
import Link from 'next/link'

interface EditorialCardProps {
  href: string
  title: string
  excerpt: string
  image?: {
    src: string
    alt: string
  }
  meta?: {
    date?: string
    category?: string
  }
  variant?: 'featured' | 'standard'
}

export function EditorialCard({
  href,
  title,
  excerpt,
  image,
  meta,
  variant = 'standard',
}: EditorialCardProps) {
  const isFeatured = variant === 'featured'

  return (
    <Link href={href} className="group block">
      <article className={`${isFeatured ? 'space-y-6' : 'space-y-4'}`}>
        {/* Image container with scale animation */}
        {image && (
          <div className="relative overflow-hidden bg-background-secondary aspect-[4/3]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes={isFeatured ? '(max-width: 768px) 100vw, 60vw' : '(max-width: 768px) 100vw, 40vw'}
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-3">
          {/* Meta line - category and date */}
          {meta && (meta.category || meta.date) && (
            <div className="flex items-center gap-3 text-xs tracking-[0.15em] uppercase text-foreground-muted">
              {meta.category && <span>{meta.category}</span>}
              {meta.category && meta.date && (
                <span className="w-4 h-px bg-border" aria-hidden="true" />
              )}
              {meta.date && <span>{meta.date}</span>}
            </div>
          )}

          {/* Title - serif, with opacity transition */}
          <h3
            className={`
              font-serif text-foreground leading-tight
              transition-opacity duration-300 group-hover:opacity-70
              ${isFeatured ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl md:text-2xl'}
            `}
          >
            {title}
          </h3>

          {/* Excerpt - with opacity transition */}
          <p
            className={`
              text-foreground-muted leading-relaxed
              transition-opacity duration-300 group-hover:opacity-70
              ${isFeatured ? 'text-base md:text-lg' : 'text-sm md:text-base'}
              line-clamp-3
            `}
          >
            {excerpt}
          </p>

          {/* Read more indicator - subtle */}
          <div className="pt-2">
            <span className="text-xs tracking-[0.15em] uppercase text-foreground opacity-60 group-hover:opacity-100 transition-opacity duration-300">
              Read Article
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
