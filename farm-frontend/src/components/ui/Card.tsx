'use client'

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * God-Tier Card Component - Elegant Depth System
 *
 * Design principles:
 * - Subtle shadows that create depth without distraction
 * - Refined borders for clear visual boundaries
 * - Smooth hover transitions
 * - Multiple variants for different use cases
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'subtle';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      children,
      variant = 'default',
      interactive = false,
      padding = 'md',
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: [
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'shadow-card',
      ].join(' '),
      elevated: [
        'bg-white dark:bg-slate-900',
        'border border-slate-100 dark:border-slate-800',
        'shadow-lg',
      ].join(' '),
      outlined: [
        'bg-white dark:bg-slate-900',
        'border-2 border-slate-200 dark:border-slate-700',
      ].join(' '),
      glass: [
        'bg-white/80 dark:bg-slate-900/80',
        'backdrop-blur-xl',
        'border border-slate-200/60 dark:border-slate-700/60',
        'shadow-glass',
      ].join(' '),
      subtle: [
        'bg-slate-50 dark:bg-slate-800/50',
        'border border-slate-100 dark:border-slate-800',
      ].join(' '),
    };

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const interactiveClasses = interactive
      ? [
          'cursor-pointer transition-all duration-200 ease-out',
          'hover:shadow-card-hover hover:-translate-y-0.5',
          'hover:border-slate-300 dark:hover:border-slate-600',
          'active:shadow-card active:translate-y-0 active:scale-[0.995]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        ].join(' ')
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-shadow motion-reduce:transition-none',
          variantClasses[variant],
          paddingClasses[padding],
          interactiveClasses,
          className
        )}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Additional card subcomponents for structured layouts
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-[14px] text-slate-500 dark:text-slate-400', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
