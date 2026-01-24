/**
 * Badge Component
 *
 * A versatile badge/tag component for displaying status, categories, and labels
 * Supports multiple variants, sizes, and optional icons
 */

'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { scaleIn } from '@/lib/animations'
import { X } from 'lucide-react'

/**
 * God-Tier Badge Variants - Premium Status Indicators
 *
 * Design principles:
 * - WCAG AAA compliant contrast for all variants
 * - Subtle borders and backgrounds
 * - Refined typography
 */
const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full font-semibold',
    'transition-all duration-200',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-slate-100 dark:bg-slate-800',
          'text-slate-700 dark:text-slate-200',
          'border border-slate-200 dark:border-slate-700',
        ],
        primary: [
          'bg-primary-100 dark:bg-primary-900/50',
          'text-primary-800 dark:text-primary-200',
          'border border-primary-200 dark:border-primary-800',
        ],
        secondary: [
          'bg-secondary-100 dark:bg-secondary-900/50',
          'text-secondary-800 dark:text-secondary-200',
          'border border-secondary-200 dark:border-secondary-800',
        ],
        success: [
          'bg-success-100 dark:bg-success-900/50',
          'text-success-800 dark:text-success-200',
          'border border-success-200 dark:border-success-800',
        ],
        warning: [
          'bg-warning-100 dark:bg-warning-900/50',
          'text-warning-800 dark:text-warning-200',
          'border border-warning-200 dark:border-warning-800',
        ],
        error: [
          'bg-error-100 dark:bg-error-900/50',
          'text-error-800 dark:text-error-200',
          'border border-error-200 dark:border-error-800',
        ],
        info: [
          'bg-info-100 dark:bg-info-900/50',
          'text-info-800 dark:text-info-200',
          'border border-info-200 dark:border-info-800',
        ],
        outline: [
          'bg-transparent',
          'text-slate-700 dark:text-slate-200',
          'border border-slate-300 dark:border-slate-600',
          'hover:bg-slate-50 dark:hover:bg-slate-800',
        ],
        verified: [
          'bg-primary-50 dark:bg-primary-900/30',
          'text-primary-700 dark:text-primary-300',
          'border border-primary-200 dark:border-primary-700',
        ],
        solid: [
          'bg-slate-900 dark:bg-slate-50',
          'text-white dark:text-slate-900',
          'border border-transparent',
        ],
      },
      size: {
        xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
        sm: 'px-2 py-0.5 text-[11px] gap-1',
        md: 'px-2.5 py-1 text-[12px] gap-1.5',
        lg: 'px-3 py-1.5 text-[13px] gap-2',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-sm active:scale-95',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Icon to display on the left side
   */
  leftIcon?: React.ReactNode
  /**
   * Icon to display on the right side
   */
  rightIcon?: React.ReactNode
  /**
   * Show a remove/close button
   */
  onRemove?: () => void
  /**
   * Apply animation on mount
   */
  animate?: boolean
  /**
   * Apply pulsing animation (for "new" or "live" badges)
   */
  pulse?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      leftIcon,
      rightIcon,
      onRemove,
      animate = false,
      pulse = false,
      children,
      ...props
    },
    ref
  ) => {
    const BadgeComponent = animate ? motion.span : 'span'
    const animationProps = animate
      ? {
          variants: scaleIn,
          initial: 'initial',
          animate: 'animate',
          exit: 'exit',
        }
      : {}

    return (
      <BadgeComponent
        ref={ref}
        className={cn(
          badgeVariants({ variant, size, interactive }),
          pulse && 'animate-pulse',
          className
        )}
        {...(animationProps as any)}
        {...(props as any)}
      >
        {leftIcon && (
          <span className="flex-shrink-0 inline-flex items-center">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="flex-shrink-0 inline-flex items-center">
            {rightIcon}
          </span>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className={cn(
              'flex-shrink-0 inline-flex items-center justify-center',
              'rounded-full hover:bg-black/10 dark:hover:bg-white/10',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              size === 'sm' && 'w-3 h-3',
              size === 'md' && 'w-4 h-4',
              size === 'lg' && 'w-5 h-5'
            )}
            aria-label="Remove badge"
          >
            <X className="w-full h-full" />
          </button>
        )}
      </BadgeComponent>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge, badgeVariants }
