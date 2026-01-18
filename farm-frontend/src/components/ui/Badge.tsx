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
    'transition-all duration-150',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
          'border border-neutral-200 dark:border-neutral-700',
        ],
        primary: [
          'bg-brand-primary/10 text-brand-primary',
          'border border-brand-primary/20',
        ],
        secondary: [
          'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900',
        ],
        success: [
          'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
          'border border-green-100 dark:border-green-800/50',
        ],
        warning: [
          'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
          'border border-amber-100 dark:border-amber-800/50',
        ],
        error: [
          'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
          'border border-red-100 dark:border-red-800/50',
        ],
        info: [
          'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
          'border border-blue-100 dark:border-blue-800/50',
        ],
        outline: [
          'bg-transparent text-neutral-700 dark:text-neutral-300',
          'border border-neutral-200 dark:border-neutral-700',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
        ],
        verified: [
          'bg-brand-primary/10 text-brand-primary',
          'border border-brand-primary/20',
        ],
      },
      size: {
        sm: 'px-2.5 py-0.5 text-xs gap-1',
        md: 'px-3 py-1 text-sm gap-1.5',
        lg: 'px-4 py-1.5 text-base gap-2',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
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
