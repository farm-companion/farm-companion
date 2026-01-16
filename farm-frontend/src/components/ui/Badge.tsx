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
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
          'border border-green-200 dark:border-green-800',
        ],
        warning: [
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
          'border border-yellow-200 dark:border-yellow-800',
        ],
        error: [
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
          'border border-red-200 dark:border-red-800',
        ],
        info: [
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
          'border border-blue-200 dark:border-blue-800',
        ],
        outline: [
          'bg-transparent text-text-body',
          'border border-border-default',
          'hover:bg-background-surface',
        ],
        verified: [
          'bg-serum/10 text-serum',
          'border border-serum/20',
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
