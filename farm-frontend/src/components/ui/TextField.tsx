'use client'

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  fullWidth?: boolean;
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

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-xl border bg-white dark:bg-neutral-900 px-4 py-3',
              'text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-neutral-800',
              'transition-all duration-150',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              hasError
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-brand-primary/30',
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
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
              {rightIcon}
            </div>
          )}
        </div>

        {hasError && (
          <p
            id={errorId}
            className="text-sm text-red-500 flex items-center gap-1"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !hasError && (
          <p id={helperId} className="text-sm text-neutral-500 dark:text-neutral-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export { TextField };
