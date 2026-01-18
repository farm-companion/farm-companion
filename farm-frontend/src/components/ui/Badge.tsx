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

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full font-medium',
    'transition-all duration-200',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-background-surface text-text-body',
          'border border-border-default',
        ],
        primary: [
          'bg-brand-primary text-white',
          'hover:bg-brand-primary/90',
        ],
        secondary: [
          'bg-solar text-midnight',
          'hover:bg-solar/90',
        ],
        success: [
          'bg-success-light text-success-dark dark:bg-success-dark dark:text-success-light',
          'border border-success',
        ],
        warning: [
          'bg-warning-light text-warning-dark dark:bg-warning-dark dark:text-warning-light',
          'border border-warning',
        ],
        error: [
          'bg-error-light text-error-dark dark:bg-error-dark dark:text-error-light',
          'border border-error',
        ],
        info: [
          'bg-info-light text-info-dark dark:bg-info-dark dark:text-info-light',
          'border border-info',
        ],
        outline: [
          'bg-transparent text-text-body',
          'border border-border-default',
          'hover:bg-background-surface',
        ],
        verified: [
          'bg-brand-primary/10 text-brand-primary',
          'border border-brand-primary/20',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-sm gap-1.5',
        lg: 'px-3 py-1.5 text-base gap-2',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md active:scale-95',
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
