'use client'

import React from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  hint?: string
  state?: 'default' | 'valid' | 'error'
  required?: boolean
  autoFilled?: boolean
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

/**
 * Form Field component with integrated validation feedback
 * Shows real-time validation state with visual indicators
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      hint,
      state = 'default',
      required = false,
      autoFilled = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const fieldId = id || props.name || label.toLowerCase().replace(/\s+/g, '-')
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`

    const inputClasses = cn(
      'w-full rounded-lg border px-4 py-3 bg-background-canvas text-text-body',
      'focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-all duration-200',
      'placeholder:text-text-muted',
      {
        'border-border-default': state === 'default',
        'border-green-500 bg-green-50/50 dark:bg-green-950/20 pr-10':
          state === 'valid',
        'border-red-500 bg-red-50/50 dark:bg-red-950/20 pr-10': state === 'error',
      },
      className
    )

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={fieldId}
          className="block text-caption font-medium text-text-heading"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {autoFilled && (
            <span className="ml-2 text-green-600 text-small font-normal">
              (auto-filled)
            </span>
          )}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            className={inputClasses}
            aria-invalid={state === 'error'}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            {...props}
          />

          {/* Validation indicator icon */}
          {state === 'valid' && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
          )}
          {state === 'error' && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
          )}
        </div>

        {/* Error message */}
        {error && state === 'error' && (
          <p
            id={errorId}
            className="text-caption text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {/* Hint text (only show when no error) */}
        {hint && !error && (
          <p id={hintId} className="text-small text-text-muted">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string | null
  hint?: string
  state?: 'default' | 'valid' | 'error'
  required?: boolean
}

/**
 * Form Textarea component with integrated validation feedback
 */
export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(
  (
    {
      label,
      error,
      hint,
      state = 'default',
      required = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const fieldId = id || props.name || label.toLowerCase().replace(/\s+/g, '-')
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`

    const textareaClasses = cn(
      'w-full rounded-lg border px-4 py-3 bg-background-canvas text-text-body',
      'focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-all duration-200',
      'placeholder:text-text-muted min-h-[100px] resize-vertical',
      {
        'border-border-default': state === 'default',
        'border-green-500 bg-green-50/50 dark:bg-green-950/20': state === 'valid',
        'border-red-500 bg-red-50/50 dark:bg-red-950/20': state === 'error',
      },
      className
    )

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={fieldId}
          className="block text-caption font-medium text-text-heading"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        <textarea
          ref={ref}
          id={fieldId}
          className={textareaClasses}
          aria-invalid={state === 'error'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />

        {/* Error message */}
        {error && state === 'error' && (
          <p
            id={errorId}
            className="text-caption text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {/* Hint text (only show when no error) */}
        {hint && !error && (
          <p id={hintId} className="text-small text-text-muted">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
