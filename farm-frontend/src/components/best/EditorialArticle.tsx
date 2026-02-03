/**
 * EditorialArticle Component
 *
 * Luxury editorial design inspired by Louis Vuitton magazine layouts.
 * Features: narrow text columns, full-bleed images, pull quotes, drop caps.
 *
 * WCAG AA Compliant: Uses semantic color system for dark/light mode support.
 */

import Image from 'next/image'
import { type FarmProfile } from '@/data/best-lists'
import { type FarmShop, getImageUrl } from '@/types/farm'

interface EditorialImage {
  src: string
  alt: string
  caption?: string
}

interface EditorialArticleProps {
  articleNumber?: number
  title: string
  persona?: string
  approach?: string
  editorialIntro?: string
  farmProfiles?: FarmProfile[]
  farms?: FarmShop[] // Database farms with images
  heroImage?: EditorialImage
  category?: string
  className?: string
}

export function EditorialArticle({
  articleNumber,
  title,
  persona,
  approach,
  editorialIntro,
  farmProfiles,
  farms = [],
  heroImage,
  category,
  className = ''
}: EditorialArticleProps) {
  return (
    <article className={`bg-background-secondary ${className}`}>
      {/* Hero Image - Full bleed */}
      {heroImage && (
        <figure className="relative w-screen left-1/2 -translate-x-1/2 mb-16">
          <div className="relative h-[50vh] min-h-[400px] max-h-[600px]">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
          {heroImage.caption && (
            <figcaption className="max-w-2xl mx-auto px-6 mt-4 text-xs tracking-[0.1em] text-foreground-muted text-center">
              {heroImage.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Article Header - Centered, elegant */}
      <header className="max-w-2xl mx-auto px-6 mb-16 text-center">
        {/* Vertical line accent */}
        <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

        {articleNumber && (
          <p className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-6">
            Article {articleNumber}
          </p>
        )}

        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal leading-tight mb-6 text-foreground">
          {title}
        </h2>

        {(persona || approach) && (
          <p className="text-xs tracking-[0.15em] uppercase text-foreground-muted">
            {persona && <span>{persona}</span>}
            {persona && approach && <span className="mx-4 inline-block w-6 h-px bg-border align-middle" />}
            {approach && <span>{approach}</span>}
          </p>
        )}

        {/* Vertical line accent */}
        <div className="w-px h-12 bg-border mx-auto mt-8" aria-hidden="true" />
      </header>

      {/* Editorial Introduction - Narrow column with drop cap */}
      {editorialIntro && (
        <div className="max-w-2xl mx-auto px-6 mb-24">
          {editorialIntro.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('## ')) {
              const headingText = paragraph.replace('## ', '')
              return (
                <h3
                  key={idx}
                  className="font-serif text-2xl md:text-3xl font-normal mt-20 mb-8 text-foreground"
                >
                  {headingText}
                </h3>
              )
            }

            // First paragraph gets drop cap
            const isFirst = idx === 0 || editorialIntro.split('\n\n')[idx - 1]?.startsWith('## ')

            return (
              <p
                key={idx}
                className={`text-lg leading-[1.9] text-foreground mb-6 ${
                  isFirst ? 'first-letter:text-6xl first-letter:font-serif first-letter:float-left first-letter:mr-4 first-letter:mt-1 first-letter:text-foreground' : ''
                }`}
              >
                {paragraph}
              </p>
            )
          })}
        </div>
      )}

      {/* Farm Profiles - Alternating layout with images */}
      {farmProfiles && farmProfiles.length > 0 && (
        <div className="space-y-32">
          {farmProfiles.map((farm, idx) => (
            <FarmProfileSection
              key={idx}
              farm={farm}
              farms={farms}
              index={idx}
              showImage={idx % 2 === 0}
              category={category}
            />
          ))}
        </div>
      )}

      {/* Bottom accent */}
      <div className="max-w-2xl mx-auto px-6 pt-24">
        <div className="w-16 h-px bg-border mx-auto" aria-hidden="true" />
      </div>
    </article>
  )
}

interface FarmProfileSectionProps {
  farm: FarmProfile
  farms: FarmShop[]
  index: number
  showImage?: boolean
  category?: string
}

// Editorial fallback images - atmospheric farm and produce photography
// IMPORTANT: No images of people, pigs, or bacon
const FALLBACK_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=80&auto=format',
    alt: 'Greenhouse rows with organic seedlings in afternoon light'
  },
  {
    src: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1600&q=80&auto=format',
    alt: 'Golden hour light across farmland'
  },
  {
    src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=80&auto=format',
    alt: 'Fresh harvest arranged on rustic table'
  },
  {
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80&auto=format',
    alt: 'Rolling green hills and countryside landscape'
  },
  {
    src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80&auto=format',
    alt: 'Artisan produce display'
  },
  {
    src: 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=1600&q=80&auto=format',
    alt: 'Purple lavender fields stretching to the horizon'
  },
  {
    src: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&q=80&auto=format',
    alt: 'Early morning at the farmers market'
  },
  {
    src: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1600&q=80&auto=format',
    alt: 'Golden sunlight filtering through fields'
  }
]

// Ice cream specific images for dairy and ice cream farm articles
const ICE_CREAM_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=1600&q=80&auto=format',
    alt: 'Artisan ice cream scoops in a waffle cone'
  },
  {
    src: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=1600&q=80&auto=format',
    alt: 'Rainbow ice cream cone against a blue sky'
  },
  {
    src: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=1600&q=80&auto=format',
    alt: 'Colourful gelato scoops in a display'
  },
  {
    src: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=1600&q=80&auto=format',
    alt: 'Creamy ice cream cone on a summer day'
  },
  {
    src: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=1600&q=80&auto=format',
    alt: 'Fresh strawberry ice cream with berries'
  },
  {
    src: 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=1600&q=80&auto=format',
    alt: 'Rich chocolate ice cream in a bowl'
  },
  {
    src: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=1600&q=80&auto=format',
    alt: 'Gelato display case with rows of flavours'
  },
  {
    src: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=1600&q=80&auto=format',
    alt: 'Hand-scooped ice cream cone with sprinkles'
  }
]

// Select the right image set based on article category
const CATEGORY_IMAGES: Record<string, typeof FALLBACK_IMAGES> = {
  'ice-cream-farms': ICE_CREAM_IMAGES,
}

function FarmProfileSection({ farm, farms, index, showImage, category }: FarmProfileSectionProps) {
  // Try to find matching farm from database by slug
  const matchedFarm = farm.slug ? farms.find(f => f.slug === farm.slug) : undefined

  // Get farm image URL if available
  const farmImageUrl = matchedFarm?.images?.[0] ? getImageUrl(matchedFarm.images[0]) : undefined

  // Pick category-specific images when available, otherwise generic fallbacks
  const images = (category && CATEGORY_IMAGES[category]) || FALLBACK_IMAGES

  // Use farm image if available, otherwise fall back to category or generic images
  const imageData = farmImageUrl
    ? { src: farmImageUrl, alt: `${farm.name} farm` }
    : images[index % images.length]

  return (
    <section>
      {/* Full-bleed image for select profiles */}
      {showImage && imageData && (
        <figure className="relative w-screen left-1/2 -translate-x-1/2 mb-12">
          <div className="relative h-[50vh] min-h-[350px] max-h-[550px] overflow-hidden">
            <Image
              src={imageData.src}
              alt={imageData.alt}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <figcaption className="max-w-2xl mx-auto px-6 mt-6 text-xs tracking-[0.1em] text-foreground-muted text-center">
            {imageData.alt}
          </figcaption>
        </figure>
      )}

      {/* Farm content - narrow column */}
      <div className="max-w-2xl mx-auto px-6">
        {/* Farm Name & Location */}
        <header className="mb-10">
          <h3 className="font-serif text-2xl md:text-3xl font-normal mb-3 text-foreground">
            {farm.name}
          </h3>
          {farm.location && (
            <p className="text-xs tracking-[0.15em] uppercase text-foreground-muted">
              {farm.location}
            </p>
          )}
        </header>

        {/* Farm Description */}
        <div className="space-y-6">
          {farm.description.split('\n\n').map((paragraph, pIdx) => (
            <p
              key={pIdx}
              className="text-lg leading-[1.9] text-foreground"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Pull quote for alternate profiles */}
        {index % 2 === 1 && farm.description.length > 300 && (
          <blockquote className="my-16 py-10 border-t border-b border-border">
            <p className="text-xl md:text-2xl font-serif italic text-center text-foreground leading-relaxed">
              &ldquo;{extractPullQuote(farm.description)}&rdquo;
            </p>
          </blockquote>
        )}
      </div>
    </section>
  )
}

// Extract a meaningful sentence for pull quote
function extractPullQuote(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 40 && s.trim().length < 150)
  return sentences[0]?.trim() || text.slice(0, 100).trim()
}

export default EditorialArticle
