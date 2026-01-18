'use client'

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      children,
      variant = 'default',
      interactive = false,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
      elevated: 'bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200/50 dark:border-neutral-700/50',
      outlined: 'bg-white/50 dark:bg-neutral-900/50 border-2 border-neutral-200 dark:border-neutral-700',
    };

    const interactiveClasses = interactive
      ? 'cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:border-brand-primary/30'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl p-6',
          variantClasses[variant],
          interactiveClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
