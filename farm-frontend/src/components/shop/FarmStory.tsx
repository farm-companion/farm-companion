'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Quote } from 'lucide-react'

interface FarmStoryProps {
  /** Farm description/story text */
  description?: string
  /** Maximum characters before truncation */
  maxLength?: number
  /** Farm name for the header */
  farmName?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Split text into paragraphs
 */
function formatDescription(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
}

/**
 * FarmStory Component
 *
 * Rich text display for farm descriptions with:
 * - Paragraph formatting
 * - Expandable content for long stories
 * - Quote highlighting for standout phrases
 * - Pleasant typography
 */
export function FarmStory({
  description,
  maxLength = 300,
  farmName,
  className = '',
}: FarmStoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!description || description.trim().length === 0) {
    return null
  }

  const paragraphs = formatDescription(description)
  const fullText = paragraphs.join(' ')
  const needsTruncation = fullText.length > maxLength
  const displayText = isExpanded ? fullText : fullText.slice(0, maxLength)

  // Check if description starts with a quote-like pattern
  const startsWithQuote = /^["']|^We |^Our |^Since |^For over/.test(description.trim())

  return (
    <div className={`bg-white dark:bg-[#121214] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-body font-semibold dark:font-medium text-slate-900 dark:text-zinc-50">
            {farmName ? `About ${farmName}` : 'Our Story'}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Quote decoration for story-like openings */}
        {startsWithQuote && (
          <Quote className="w-8 h-8 text-amber-200 dark:text-amber-800 mb-2 -ml-1" />
        )}

        {/* Text content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {isExpanded ? (
            paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-caption text-slate-700 dark:text-zinc-300 leading-relaxed mb-3 last:mb-0"
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-caption text-slate-700 dark:text-zinc-300 leading-relaxed">
              {displayText}
              {needsTruncation && !isExpanded && '...'}
            </p>
          )}
        </div>

        {/* Expand/Collapse */}
        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              mt-4 flex items-center gap-1.5
              text-caption font-medium dark:font-normal
              text-primary-600 dark:text-primary-400
              hover:text-primary-700 dark:hover:text-primary-300
              transition-colors
            "
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Read more
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Compact story excerpt for cards
 */
export function FarmStoryExcerpt({
  description,
  maxLength = 100,
  className = '',
}: Omit<FarmStoryProps, 'farmName'>) {
  if (!description || description.trim().length === 0) {
    return null
  }

  const text = description.trim()
  const excerpt = text.length > maxLength ? text.slice(0, maxLength) + '...' : text

  return (
    <p className={`text-small text-slate-600 dark:text-zinc-400 leading-relaxed ${className}`}>
      {excerpt}
    </p>
  )
}

/**
 * Inline description with icon
 */
export function FarmDescription({
  description,
  className = '',
}: Pick<FarmStoryProps, 'description' | 'className'>) {
  if (!description || description.trim().length === 0) {
    return null
  }

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <BookOpen className="w-4 h-4 text-slate-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" />
      <p className="text-caption text-slate-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
        {description}
      </p>
    </div>
  )
}
