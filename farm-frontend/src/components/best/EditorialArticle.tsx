/**
 * EditorialArticle Component
 *
 * Apple-level editorial design for farm guides.
 * Features investigative journalism style with olive/sage green accents.
 */

import { type FarmProfile } from '@/data/best-lists'

interface EditorialArticleProps {
  articleNumber?: number
  title: string
  persona?: string
  approach?: string
  seoKeywords?: string[]
  editorialIntro?: string
  farmProfiles?: FarmProfile[]
  className?: string
}

// Olive/sage green color from the design
const EDITORIAL_GREEN = '#6b7c3f'

export function EditorialArticle({
  articleNumber,
  title,
  persona,
  approach,
  seoKeywords,
  editorialIntro,
  farmProfiles,
  className = ''
}: EditorialArticleProps) {
  return (
    <article className={`max-w-4xl mx-auto ${className}`}>
      {/* Article Header */}
      <header className="mb-8">
        {articleNumber && (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
            Article {articleNumber}
          </p>
        )}

        {/* Title - Serif font for editorial feel */}
        <h1
          className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-3"
          style={{ color: EDITORIAL_GREEN }}
        >
          {title}
        </h1>

        {/* Persona & Approach */}
        {(persona || approach) && (
          <p className="text-sm text-slate-600 dark:text-slate-400 italic">
            {persona && <span>Persona: {persona}</span>}
            {persona && approach && <span className="mx-2">|</span>}
            {approach && <span>Approach: {approach}</span>}
          </p>
        )}
      </header>

      {/* SEO Keywords Box */}
      {seoKeywords && seoKeywords.length > 0 && (
        <div
          className="p-4 rounded-lg mb-10"
          style={{ backgroundColor: `${EDITORIAL_GREEN}15` }}
        >
          <p className="text-sm">
            <span
              className="font-semibold"
              style={{ color: EDITORIAL_GREEN }}
            >
              Target SEO Keywords:
            </span>{' '}
            <span className="text-slate-700 dark:text-slate-300">
              {seoKeywords.join(', ')}
            </span>
          </p>
        </div>
      )}

      {/* Editorial Introduction */}
      {editorialIntro && (
        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none mb-12">
          {editorialIntro.split('\n\n').map((paragraph, idx) => {
            // Check if paragraph is a heading (starts with ##)
            if (paragraph.startsWith('## ')) {
              const headingText = paragraph.replace('## ', '')
              return (
                <h2
                  key={idx}
                  className="text-xl md:text-2xl font-serif font-bold mt-10 mb-4"
                  style={{ color: EDITORIAL_GREEN }}
                >
                  {headingText}
                </h2>
              )
            }
            return (
              <p key={idx} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                {paragraph}
              </p>
            )
          })}
        </div>
      )}

      {/* Farm Profiles */}
      {farmProfiles && farmProfiles.length > 0 && (
        <div className="space-y-10">
          {farmProfiles.map((farm, idx) => (
            <FarmProfileCard key={idx} farm={farm} />
          ))}
        </div>
      )}
    </article>
  )
}

function FarmProfileCard({ farm }: { farm: FarmProfile }) {
  return (
    <section className="border-t border-slate-200 dark:border-slate-700 pt-8">
      {/* Farm Name & Location */}
      <h3
        className="text-xl md:text-2xl font-serif font-bold mb-4"
        style={{ color: EDITORIAL_GREEN }}
      >
        {farm.name}
        {farm.location && (
          <span className="font-normal text-slate-600 dark:text-slate-400">
            , {farm.location}
          </span>
        )}
      </h3>

      {/* Farm Description - Multi-paragraph support */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {farm.description.split('\n\n').map((paragraph, idx) => (
          <p
            key={idx}
            className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  )
}

export default EditorialArticle
