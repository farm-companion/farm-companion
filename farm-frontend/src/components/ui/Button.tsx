'use client'

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Pitti Press button variants — semantic tokens (auto light/dark), sharp corners, flat.
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center duration-200',
    'transition-[background-color,color,border-color,box-shadow,transform]',
    'rounded-[2px] text-[14px] tracking-tight font-semibold',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand',
    'focus-visible:ring-offset-paper',
    'disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed',
    'min-h-[44px]', // WCAG touch target
    'motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        // Primary: Vermilion — the shipped primary CTA (brief §6.1), flat
        primary: [
          'bg-brand text-brand-text',
          'hover:bg-brand-hover',
          'active:bg-brand-hover active:scale-[0.97]',
        ],
        // Kinetic + brand: legacy aliases, both resolve to the Vermilion CTA
        kinetic: [
          'bg-brand text-brand-text',
          'hover:bg-brand-hover',
          'active:bg-brand-hover active:scale-[0.97]',
        ],
        brand: [
          'bg-brand text-brand-text',
          'hover:bg-brand-hover',
          'active:bg-brand-hover active:scale-[0.97]',
        ],
        // Secondary: high-contrast bordered button — works on any surface
        secondary: [
          'bg-surface text-ink border border-ink',
          'hover:bg-ink hover:text-paper',
          'active:bg-ink active:text-paper active:scale-[0.97]',
        ],
        // Outline: lighter bordered variant
        outline: [
          'bg-transparent text-ink border border-border-strong',
          'hover:bg-surface-2 hover:border-ink',
          'active:bg-surface-2 active:scale-[0.97]',
        ],
        tertiary: [
          'bg-transparent text-ink',
          'hover:bg-surface-2',
          'active:bg-surface-2 active:scale-[0.97]',
        ],
        ghost: [
          'bg-transparent text-ink-muted',
          'hover:bg-surface-2 hover:text-ink',
          'active:bg-surface-2 active:scale-[0.97]',
        ],
        danger: [
          'bg-error-700 text-white shadow-sm',
          'hover:bg-error-800 hover:shadow-md',
          'active:bg-error-900 active:scale-[0.98]',
        ],
        success: [
          'bg-success-700 text-white shadow-sm',
          'hover:bg-success-800 hover:shadow-md',
          'active:bg-success-900 active:scale-[0.98]',
        ],
        // Harvest Theme: Uses CSS semantic variables for auto light/dark
        'harvest-primary': [
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
          'shadow-sm hover:bg-[hsl(var(--primary-hover))] hover:shadow-md',
          'active:scale-[0.97]',
          'font-semibold dark:font-medium',
        ],
        'harvest-leaf': [
          'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
          'shadow-sm hover:bg-[hsl(var(--secondary-hover))] hover:shadow-md',
          'active:scale-[0.97]',
          'font-semibold dark:font-medium',
        ],
        'harvest-soil': [
          'bg-[var(--harvest-soil-800)] text-[var(--harvest-soil-50)]',
          'dark:bg-[var(--harvest-soil-100)] dark:text-[var(--harvest-soil-900)]',
          'shadow-sm hover:shadow-md',
          'hover:bg-[var(--harvest-soil-700)] dark:hover:bg-[var(--harvest-soil-200)]',
          'active:scale-[0.97]',
          'font-semibold dark:font-medium',
        ],
        'harvest-outline': [
          'bg-transparent border-2 border-[hsl(var(--border-strong))]',
          'text-[hsl(var(--foreground))]',
          'hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--primary))]',
          'active:scale-[0.97]',
          'dark:border-[rgba(255,255,255,0.12)] dark:hover:border-[var(--harvest-kinetic-400)]',
        ],
        'harvest-ghost': [
          'bg-transparent text-[hsl(var(--foreground-secondary))]',
          'hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
          'active:scale-[0.97]',
        ],
      },
      size: {
        xs: 'h-8 px-3 text-[12px] min-h-[32px] rounded-[2px]',
        sm: 'h-9 px-4 text-[13px] min-h-[36px]',
        md: 'h-11 px-5',
        lg: 'h-12 px-6 text-[15px]',
        xl: 'h-14 px-8 text-[16px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const content = (
      <>
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && (
          <span className="mr-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </>
    );

    if (asChild) {
      return (
        <span
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {content}
        </span>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
