'use client'

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * God-Tier TextField Component - Refined Interaction States
 *
 * Design principles:
 * - Clear visual hierarchy with proper label contrast
 * - Smooth focus transitions
 * - WCAG AAA compliant error states
 * - 44px minimum touch targets
 */

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  fullWidth?: boolean;
  variant?: 'default' | 'filled';
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      required,
      fullWidth = false,
      variant = 'default',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `error-${inputId}`;
    const helperId = `helper-${inputId}`;

    const hasError = !!error;
    const isDisabled = disabled;

    const baseInputClasses = [
      'block w-full rounded-xl px-4 py-3 text-[15px]',
      'text-slate-900 dark:text-slate-50',
      'placeholder:text-slate-400 dark:placeholder:text-slate-500',
      'transition-all duration-200 ease-out',
      'min-h-[48px]', // WCAG AAA touch target
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800',
      'motion-reduce:transition-none',
    ];

    const variantClasses = {
      default: [
        'bg-white dark:bg-slate-900',
        'border-2',
        hasError
          ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
          : 'border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-500/20 hover:border-slate-300 dark:hover:border-slate-600',
      ],
      filled: [
        'bg-slate-100 dark:bg-slate-800',
        'border-2 border-transparent',
        hasError
          ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
          : 'focus:border-primary-500 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-slate-900',
      ],
    };

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[14px] font-semibold text-slate-700 dark:text-slate-200"
          >
            {label}
            {required && (
              <span className="text-error-600 dark:text-error-400 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseInputClasses,
              variantClasses[variant],
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? errorId
                : helperText
                ? helperId
                : undefined
            }
            aria-required={required}
            disabled={isDisabled}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>

        {hasError && (
          <p
            id={errorId}
            className="flex items-center gap-1.5 text-[13px] font-medium text-error-700 dark:text-error-400"
            role="alert"
          >
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {helperText && !hasError && (
          <p id={helperId} className="text-[13px] text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export { TextField };
