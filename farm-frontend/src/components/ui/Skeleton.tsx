/**
 * Skeleton Component
 *
 * Loading skeleton screens with shimmer animation
 * Provides visual feedback while content is loading
 */

'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const skeletonVariants = cva(
  [
    'animate-pulse',
    'bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700',
    'bg-[length:200%_100%]',
    'rounded',
  ],
  {
    variants: {
      variant: {
        text: 'h-4 w-full',
        heading: 'h-8 w-3/4',
        avatar: 'rounded-full',
        image: 'aspect-video w-full',
        card: 'h-32 w-full',
        button: 'h-10 w-24',
        circle: 'rounded-full',
        line: 'h-px w-full',
      },
    },
    defaultVariants: {
      variant: 'text',
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * Number of skeleton items to render (for lists)
   */
  count?: number
  /**
   * Enable shimmer animation (animated gradient)
   */
  shimmer?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, count = 1, shimmer = true, ...props }, ref) => {
    if (count > 1) {
      return (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              ref={index === 0 ? ref : undefined}
              className={cn(
                skeletonVariants({ variant }),
                shimmer && 'animate-shimmer',
                className
              )}
              {...props}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          skeletonVariants({ variant }),
          shimmer && 'animate-shimmer',
          className
        )}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

/**
 * Pre-built skeleton patterns for common use cases
 */

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={i === lines - 1 ? 'w-2/3' : undefined}
      />
    ))}
  </div>
)

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-3 p-4 border border-border-default rounded-lg', className)}>
    <Skeleton variant="image" />
    <Skeleton variant="heading" className="w-3/4" />
    <SkeletonText lines={2} />
    <div className="flex gap-2">
      <Skeleton variant="button" className="w-20" />
      <Skeleton variant="button" className="w-20" />
    </div>
  </div>
)

export const SkeletonFarmCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-3 p-4 border border-border-default rounded-lg', className)}>
    <Skeleton variant="image" className="aspect-[16/9]" />
    <div className="space-y-2">
      <Skeleton variant="heading" className="h-6 w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <div className="flex gap-2 mt-3">
        <Skeleton variant="circle" className="w-6 h-6" />
        <Skeleton variant="circle" className="w-6 h-6" />
        <Skeleton variant="circle" className="w-6 h-6" />
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton variant="button" className="flex-1" />
        <Skeleton variant="button" className="flex-1" />
      </div>
    </div>
  </div>
)

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border border-border-default rounded-lg">
        <Skeleton variant="image" className="w-24 h-24 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="heading" className="h-5 w-1/2" />
          <SkeletonText lines={2} />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    <div className="grid gap-4 p-4 border-b border-border-default" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" className="h-5 font-semibold" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4 p-4 border-b border-border-default" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" />
        ))}
      </div>
    ))}
  </div>
)

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => (
  <Skeleton
    variant="avatar"
    className={cn(
      size === 'sm' && 'w-8 h-8',
      size === 'md' && 'w-12 h-12',
      size === 'lg' && 'w-16 h-16',
      className
    )}
  />
)

export { Skeleton, skeletonVariants }
