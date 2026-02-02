/**
 * EditorialArticle Component
 *
 * Luxury editorial design inspired by Louis Vuitton magazine layouts.
 * Uses Paper White (#F9F9F9) and Deep Charcoal (#1A1A1A) palette.
 * Features: narrow text columns, full-bleed images, pull quotes, drop caps.
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
  seoKeywords?: string[]
  editorialIntro?: string
  farmProfiles?: FarmProfile[]
  farms?: FarmShop[] // Database farms with images
  heroImage?: EditorialImage
  className?: string
}

// Luxury editorial color palette
const COLORS = {
  paperWhite: '#F9F9F9',
  deepCharcoal: '#1A1A1A',
  warmGray: '#6B6B6B',
  divider: '#E5E5E5',
}

export function EditorialArticle({
  articleNumber,
  title,
  persona,
  approach,
  seoKeywords,
  editorialIntro,
  farmProfiles,
  farms = [],
  heroImage,
  className = ''
}: EditorialArticleProps) {
  return (
    <article className={`bg-[#F9F9F9] ${className}`}>
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
            <figcaption className="max-w-2xl mx-auto px-6 mt-4 text-xs tracking-[0.1em] text-[#6B6B6B] text-center">
              {heroImage.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Article Header - Centered, elegant */}
      <header className="max-w-2xl mx-auto px-6 mb-16 text-center">
        {/* Vertical line accent */}
        <div className="w-px h-12 bg-[#E5E5E5] mx-auto mb-8" aria-hidden="true" />

        {articleNumber && (
          <p className="text-xs tracking-[0.2em] uppercase text-[#6B6B6B] mb-6">
            Article {articleNumber}
          </p>
        )}

        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal leading-tight mb-6 text-[#1A1A1A]">
          {title}
        </h2>

        {(persona || approach) && (
          <p className="text-xs tracking-[0.15em] uppercase text-[#6B6B6B]">
            {persona && <span>{persona}</span>}
            {persona && approach && <span className="mx-4 inline-block w-6 h-px bg-[#E5E5E5] align-middle" />}
            {approach && <span>{approach}</span>}
          </p>
        )}

        {/* Vertical line accent */}
        <div className="w-px h-12 bg-[#E5E5E5] mx-auto mt-8" aria-hidden="true" />
      </header>

      {/* SEO Keywords - Subtle inline */}
      {seoKeywords && seoKeywords.length > 0 && (
        <div className="max-w-2xl mx-auto px-6 mb-16">
          <div className="border-l-2 border-[#E5E5E5] pl-6">
            <p className="text-xs tracking-[0.1em] uppercase text-[#6B6B6B]">
              <span className="font-medium">Keywords</span>
            </p>
            <p className="text-xs tracking-wide text-[#6B6B6B] mt-2">
              {seoKeywords.join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Editorial Introduction - Narrow column with drop cap */}
      {editorialIntro && (
        <div className="max-w-2xl mx-auto px-6 mb-24">
          {editorialIntro.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('## ')) {
              const headingText = paragraph.replace('## ', '')
              return (
                <h3
                  key={idx}
                  className="font-serif text-2xl md:text-3xl font-normal mt-20 mb-8 text-[#1A1A1A]"
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
                className={`text-lg leading-[1.9] text-[#1A1A1A] mb-6 ${
                  isFirst ? 'first-letter:text-6xl first-letter:font-serif first-letter:float-left first-letter:mr-4 first-letter:mt-1 first-letter:text-[#1A1A1A]' : ''
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
            />
          ))}
        </div>
      )}

      {/* Bottom accent */}
      <div className="max-w-2xl mx-auto px-6 pt-24">
        <div className="w-16 h-px bg-[#E5E5E5] mx-auto" aria-hidden="true" />
      </div>
    </article>
  )
}

interface FarmProfileSectionProps {
  farm: FarmProfile
  farms: FarmShop[]
  index: number
  showImage?: boolean
}

// Fallback produce images from blob storage
const FALLBACK_IMAGES = [
  {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/1/main.webp',
    alt: 'Fresh vine-ripened British tomatoes'
  },
  {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/1/main.webp',
    alt: 'Fresh British kale leaves'
  },
  {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/carrots/1/main.webp',
    alt: 'Fresh orange British carrots with green tops'
  },
  {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/1/main.webp',
    alt: 'Fresh British asparagus spears'
  },
  {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/1/main.webp',
    alt: 'Fresh British strawberries with morning dew'
  },
  {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/1/main.webp',
    alt: 'Fresh British apples in autumn orchard'
  },
  {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broad-beans/1/main.webp',
    alt: 'Fresh broad beans in pods'
  },
  {
    src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/spinach/1/main.webp',
    alt: 'Fresh dark green spinach leaves'
  }
]

function FarmProfileSection({ farm, farms, index, showImage }: FarmProfileSectionProps) {
  // Try to find matching farm from database by slug
  const matchedFarm = farm.slug ? farms.find(f => f.slug === farm.slug) : undefined

  // Get farm image URL if available
  const farmImageUrl = matchedFarm?.images?.[0] ? getImageUrl(matchedFarm.images[0]) : undefined

  // Use farm image if available, otherwise fall back to produce images
  const imageData = farmImageUrl
    ? { src: farmImageUrl, alt: `${farm.name} farm` }
    : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]

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
          <figcaption className="max-w-2xl mx-auto px-6 mt-6 text-xs tracking-[0.1em] text-[#6B6B6B] text-center">
            {imageData.alt}
          </figcaption>
        </figure>
      )}

      {/* Farm content - narrow column */}
      <div className="max-w-2xl mx-auto px-6">
        {/* Farm Name & Location */}
        <header className="mb-10">
          <h3 className="font-serif text-2xl md:text-3xl font-normal mb-3 text-[#1A1A1A]">
            {farm.name}
          </h3>
          {farm.location && (
            <p className="text-xs tracking-[0.15em] uppercase text-[#6B6B6B]">
              {farm.location}
            </p>
          )}
        </header>

        {/* Farm Description */}
        <div className="space-y-6">
          {farm.description.split('\n\n').map((paragraph, pIdx) => (
            <p
              key={pIdx}
              className="text-lg leading-[1.9] text-[#1A1A1A]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Pull quote for alternate profiles */}
        {index % 2 === 1 && farm.description.length > 300 && (
          <blockquote className="my-16 py-10 border-t border-b border-[#E5E5E5]">
            <p className="text-xl md:text-2xl font-serif italic text-center text-[#1A1A1A] leading-relaxed">
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
