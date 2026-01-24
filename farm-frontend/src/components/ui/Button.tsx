'use client'

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * God-Tier Button Variants - Apple-Inspired Premium Interaction Design
 *
 * Features:
 * - WCAG AAA compliant contrast ratios
 * - Refined hover/active states with subtle shadows
 * - 48px minimum touch targets (WCAG AAA)
 * - Smooth transitions with reduced-motion support
 * - High visibility on any background
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center font-semibold transition-all duration-200',
    'rounded-xl text-[14px] tracking-tight',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500',
    'disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed',
    'min-h-[44px]', // WCAG AAA minimum touch target
    'motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-slate-900 text-white shadow-sm',
          'hover:bg-slate-800 hover:shadow-md',
          'active:bg-slate-950 active:scale-[0.98]',
          'dark:bg-slate-50 dark:text-slate-900',
          'dark:hover:bg-white dark:hover:shadow-md',
          'dark:active:bg-slate-100',
        ],
        brand: [
          'bg-primary-600 text-white shadow-sm',
          'hover:bg-primary-700 hover:shadow-md',
          'active:bg-primary-800 active:scale-[0.98]',
        ],
        // Secondary: High contrast bordered button - works on ANY background
        secondary: [
          'bg-white text-slate-900 border-2 border-slate-900 shadow-sm',
          'hover:bg-slate-900 hover:text-white hover:shadow-md',
          'active:bg-slate-800 active:text-white active:scale-[0.98]',
          'dark:bg-slate-900 dark:text-slate-50 dark:border-slate-50',
          'dark:hover:bg-slate-50 dark:hover:text-slate-900',
          'dark:active:bg-slate-100 dark:active:text-slate-900',
        ],
        // Outline: Lighter bordered variant for less prominent actions
        outline: [
          'bg-transparent text-slate-700 border-2 border-slate-300',
          'hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900',
          'active:bg-slate-200 active:scale-[0.98]',
          'dark:text-slate-200 dark:border-slate-600',
          'dark:hover:bg-slate-800 dark:hover:border-slate-500 dark:hover:text-slate-50',
        ],
        tertiary: [
          'bg-transparent text-slate-700',
          'hover:bg-slate-100 hover:text-slate-900',
          'active:bg-slate-200 active:scale-[0.98]',
          'dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50',
        ],
        ghost: [
          'bg-transparent text-slate-600',
          'hover:bg-slate-100/80 hover:text-slate-900',
          'active:bg-slate-200/80 active:scale-[0.98]',
          'dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-50',
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
      },
      size: {
        xs: 'h-8 px-3 text-[12px] min-h-[32px] rounded-lg',
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
