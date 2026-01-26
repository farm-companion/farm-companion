'use client'

import { useMemo } from 'react'
import { CheckCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormSection {
  id: string
  label: string
  required?: boolean
  isComplete: boolean
}

interface FormProgressProps {
  sections: FormSection[]
  className?: string
  variant?: 'horizontal' | 'vertical'
}

/**
 * Form Progress indicator showing completion status of form sections
 */
export function FormProgress({
  sections,
  className,
  variant = 'horizontal',
}: FormProgressProps) {
  const { completed, total, percentage } = useMemo(() => {
    const requiredSections = sections.filter((s) => s.required !== false)
    const completedSections = requiredSections.filter((s) => s.isComplete)
    const pct =
      requiredSections.length > 0
        ? Math.round((completedSections.length / requiredSections.length) * 100)
        : 0

    return {
      completed: completedSections.length,
      total: requiredSections.length,
      percentage: pct,
    }
  }, [sections])

  const isComplete = percentage === 100

  if (variant === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-caption font-medium text-text-heading">
            Form Progress
          </h3>
          <span
            className={cn(
              'text-caption font-semibold',
              isComplete ? 'text-green-600' : 'text-text-muted'
            )}
          >
            {completed}/{total} complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-background-canvas rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out rounded-full',
              isComplete ? 'bg-green-500' : 'bg-serum'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Section List */}
        <ul className="space-y-2">
          {sections.map((section) => (
            <li
              key={section.id}
              className="flex items-center gap-2 text-caption"
            >
              {section.isComplete ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-text-muted flex-shrink-0" />
              )}
              <span
                className={cn(
                  section.isComplete ? 'text-text-heading' : 'text-text-muted',
                  section.required === false && 'italic'
                )}
              >
                {section.label}
                {section.required === false && ' (optional)'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Horizontal variant (default)
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Progress Bar with Label */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-2 bg-background-canvas rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 ease-out rounded-full',
                isComplete ? 'bg-green-500' : 'bg-serum'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <span
          className={cn(
            'text-caption font-semibold whitespace-nowrap',
            isComplete ? 'text-green-600' : 'text-text-muted'
          )}
        >
          {percentage}%
        </span>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {sections.map((section, index) => (
          <div key={section.id} className="flex items-center gap-2">
            {/* Step Circle */}
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-small font-medium transition-colors',
                section.isComplete
                  ? 'bg-green-500 text-white'
                  : 'bg-background-canvas text-text-muted border border-border-default'
              )}
            >
              {section.isComplete ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>

            {/* Step Label (hidden on small screens) */}
            <span
              className={cn(
                'text-small hidden sm:inline whitespace-nowrap',
                section.isComplete ? 'text-text-heading' : 'text-text-muted'
              )}
            >
              {section.label}
            </span>

            {/* Connector Line */}
            {index < sections.length - 1 && (
              <div
                className={cn(
                  'hidden sm:block w-8 h-0.5 transition-colors',
                  sections[index + 1].isComplete
                    ? 'bg-green-500'
                    : 'bg-border-default'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Compact progress badge for inline use
 */
export function FormProgressBadge({
  completed,
  total,
  className,
}: {
  completed: number
  total: number
  className?: string
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = percentage === 100

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-caption font-medium',
        isComplete
          ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
          : 'bg-background-canvas text-text-muted',
        className
      )}
    >
      {isComplete ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Complete</span>
        </>
      ) : (
        <>
          <div className="w-16 h-1.5 bg-background-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-serum rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span>{percentage}%</span>
        </>
      )}
    </div>
  )
}
