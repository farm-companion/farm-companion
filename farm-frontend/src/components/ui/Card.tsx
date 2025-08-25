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
      default: 'bg-background-surface border border-border-default',
      elevated: 'bg-background-canvas shadow-lg border border-border-default',
      outlined: 'bg-background-canvas border-2 border-border-default',
    };

    const interactiveClasses = interactive
      ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg p-6',
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
