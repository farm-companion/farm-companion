/**
 * EditorialArticle Component
 *
 * Luxury editorial design inspired by Louis Vuitton magazine layouts.
 * Features: narrow text columns, full-bleed images, pull quotes, drop caps.
 */

import Image from 'next/image'
import { type FarmProfile } from '@/data/best-lists'

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
  heroImage?: EditorialImage
  className?: string
}

// Olive/sage green accent color
const ACCENT_COLOR = '#5d6d3f'

export function EditorialArticle({
  articleNumber,
  title,
  persona,
  approach,
  seoKeywords,
  editorialIntro,
  farmProfiles,
  heroImage,
  className = ''
}: EditorialArticleProps) {
  return (
    <article className={className}>
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
            />
          </div>
          {heroImage.caption && (
            <figcaption className="max-w-2xl mx-auto px-6 mt-4 text-sm text-slate-500 dark:text-slate-400 italic">
              {heroImage.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Article Header - Centered, elegant */}
      <header className="max-w-2xl mx-auto px-6 mb-16 text-center">
        {articleNumber && (
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 mb-6">
            Article {articleNumber}
          </p>
        )}

        <h2
          className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal leading-tight mb-6"
          style={{ color: ACCENT_COLOR }}
        >
          {title}
        </h2>

        {(persona || approach) && (
          <p className="text-sm tracking-wide text-slate-500 dark:text-slate-400">
            {persona && <span className="italic">{persona}</span>}
            {persona && approach && <span className="mx-3 text-slate-300">|</span>}
            {approach && <span className="italic">{approach}</span>}
          </p>
        )}
      </header>

      {/* SEO Keywords - Subtle inline */}
      {seoKeywords && seoKeywords.length > 0 && (
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-xs tracking-wide text-slate-400 dark:text-slate-500 border-l-2 pl-4" style={{ borderColor: ACCENT_COLOR }}>
            <span className="font-medium uppercase">Keywords:</span>{' '}
            {seoKeywords.join(' · ')}
          </p>
        </div>
      )}

      {/* Editorial Introduction - Narrow column with drop cap */}
      {editorialIntro && (
        <div className="max-w-2xl mx-auto px-6 mb-20">
          {editorialIntro.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('## ')) {
              const headingText = paragraph.replace('## ', '')
              return (
                <h3
                  key={idx}
                  className="font-serif text-2xl md:text-3xl font-normal mt-16 mb-8"
                  style={{ color: ACCENT_COLOR }}
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
                className={`text-lg leading-[1.8] text-slate-700 dark:text-slate-300 mb-6 ${
                  isFirst ? 'first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1' : ''
                }`}
                style={isFirst ? { ['--tw-first-letter-color' as string]: ACCENT_COLOR } : {}}
              >
                {paragraph}
              </p>
            )
          })}
        </div>
      )}

      {/* Farm Profiles - Alternating layout with images */}
      {farmProfiles && farmProfiles.length > 0 && (
        <div className="space-y-24">
          {farmProfiles.map((farm, idx) => (
            <FarmProfileSection
              key={idx}
              farm={farm}
              index={idx}
              showImage={idx % 2 === 0} // Show image every 2nd profile for richer visuals
            />
          ))}
        </div>
      )}
    </article>
  )
}

interface FarmProfileSectionProps {
  farm: FarmProfile
  index: number
  showImage?: boolean
}

// Curated organic produce images from blob storage
const ORGANIC_IMAGES = [
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

function FarmProfileSection({ farm, index, showImage }: FarmProfileSectionProps) {
  // Get image based on index (cycles through available images)
  const imageData = ORGANIC_IMAGES[index % ORGANIC_IMAGES.length]

  return (
    <section>
      {/* Full-bleed image for select profiles */}
      {showImage && imageData && (
        <figure className="relative w-screen left-1/2 -translate-x-1/2 mb-12">
          <div className="relative h-[40vh] min-h-[300px] max-h-[500px]">
            <Image
              src={imageData.src}
              alt={imageData.alt}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <figcaption className="max-w-2xl mx-auto px-6 mt-4 text-sm text-slate-500 dark:text-slate-400 italic text-center">
            {imageData.alt}
          </figcaption>
        </figure>
      )}

      {/* Farm content - narrow column */}
      <div className="max-w-2xl mx-auto px-6">
        {/* Farm Name & Location */}
        <header className="mb-8">
          <h3
            className="font-serif text-2xl md:text-3xl font-normal mb-2"
            style={{ color: ACCENT_COLOR }}
          >
            {farm.name}
          </h3>
          {farm.location && (
            <p className="text-sm tracking-wide text-slate-500 dark:text-slate-400 uppercase">
              {farm.location}
            </p>
          )}
        </header>

        {/* Farm Description */}
        <div className="space-y-6">
          {farm.description.split('\n\n').map((paragraph, pIdx) => (
            <p
              key={pIdx}
              className="text-lg leading-[1.8] text-slate-700 dark:text-slate-300"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Pull quote from first paragraph if long enough */}
        {index % 2 === 1 && farm.description.length > 300 && (
          <blockquote
            className="my-12 py-8 border-y text-xl md:text-2xl font-serif italic text-center"
            style={{ borderColor: `${ACCENT_COLOR}30`, color: ACCENT_COLOR }}
          >
            "{extractPullQuote(farm.description)}"
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
