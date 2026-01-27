'use client'

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Obsidian Card Component - Optical Balancing for Light/Dark Modes
 *
 * Design principles:
 * - Light Mode: Shadow depth for elevation (shadows work on white)
 * - Dark Mode: Border luminance + specular highlight (shadows invisible on black)
 * - Adaptive font weight: semibold in light, medium in dark (text "blooms" on dark)
 * - OLED optimized: Pure ink background allows pixels to turn off
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'subtle' | 'harvest' | 'harvest-elevated' | 'harvest-accent';
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
    // Obsidian Optical Balancing: Different elevation strategies per mode
    const variantClasses = {
      default: [
        // Light Mode: Zinc-warm surface with shadow depth
        'bg-white border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
        // Dark Mode: Obsidian surface with border luminance (no shadow)
        'dark:bg-[#121214] dark:border-white/[0.08] dark:shadow-none',
      ].join(' '),
      elevated: [
        // Light Mode: Higher shadow for more lift
        'bg-white border border-zinc-100 shadow-lg',
        // Dark Mode: Brighter border luminance
        'dark:bg-[#121214] dark:border-white/[0.10] dark:shadow-none',
      ].join(' '),
      outlined: [
        'bg-white border-2 border-zinc-200',
        'dark:bg-[#121214] dark:border-white/[0.12]',
      ].join(' '),
      glass: [
        'bg-white/80 backdrop-blur-xl border border-zinc-200/60 shadow-glass',
        'dark:bg-[#121214]/80 dark:border-white/[0.08]',
      ].join(' '),
      subtle: [
        'bg-zinc-50 border border-zinc-100',
        'dark:bg-[#0A0A0B] dark:border-white/[0.04]',
      ].join(' '),
      // Harvest Theme variants - use semantic CSS variables
      harvest: [
        'bg-[hsl(var(--card))] border border-[hsl(var(--border))]',
        'shadow-[0_4px_20px_hsl(var(--shadow-color)/var(--shadow-strength))]',
      ].join(' '),
      'harvest-elevated': [
        'bg-[hsl(var(--popover))] border border-[hsl(var(--border-strong))]',
        'shadow-[0_8px_30px_hsl(var(--shadow-color)/calc(var(--shadow-strength)*1.5))]',
        // Specular highlight for dark mode
        'dark:bg-gradient-to-b dark:from-[rgba(255,255,255,0.03)] dark:to-[hsl(var(--popover))]',
      ].join(' '),
      'harvest-accent': [
        'bg-[hsl(var(--card))] border-2 border-[hsl(var(--secondary))]',
        'shadow-[0_4px_20px_hsl(var(--shadow-color)/var(--shadow-strength))]',
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
          'cursor-pointer transition-all duration-300 ease-out',
          // Light Mode: Shadow increases on hover
          'hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1',
          'hover:border-zinc-300',
          // Dark Mode: Border brightens on hover (the "rim light" effect)
          'dark:hover:border-white/20 dark:hover:-translate-y-1',
          'active:translate-y-0 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-[#050505]',
        ].join(' ')
      : '';

    // The Specular Highlight: A pseudo-element gradient that simulates light reflection
    // This is the "Stripe/Linear secret" for premium dark mode cards
    const specularHighlight = [
      'relative overflow-hidden',
      // Dark mode specular highlight (2% white gradient from top)
      'before:absolute before:inset-0 before:pointer-events-none before:rounded-2xl',
      'before:bg-gradient-to-b before:from-transparent before:to-transparent',
      'dark:before:from-white/[0.02] dark:before:to-transparent',
    ].join(' ');

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all motion-reduce:transition-none',
          specularHighlight,
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

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  harvest?: boolean;
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, harvest = false, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-lg tracking-tight',
        // Adaptive font weight: semibold in light, medium in dark
        // Light text on dark backgrounds "blooms" (irradiance), so we thin it
        'font-semibold dark:font-medium',
        harvest
          ? 'text-[hsl(var(--foreground))]'
          : 'text-zinc-900 dark:text-zinc-50',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  harvest?: boolean;
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, harvest = false, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-[14px]',
        // Desaturated muted text for dark mode to prevent vibrancy fatigue
        harvest
          ? 'text-[hsl(var(--foreground-secondary))]'
          : 'text-zinc-600 dark:text-zinc-400',
        className
      )}
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
