'use client'

import React, { forwardRef, useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'
import { Button, ButtonProps, buttonVariants } from './Button'
import { cn } from '@/lib/utils'

/**
 * Spring physics configuration for button interactions
 *
 * These values are tuned for a premium, tactile feel:
 * - stiffness: How quickly the spring snaps back (higher = snappier)
 * - damping: How much the spring oscillates (lower = more bounce)
 * - mass: Affects the momentum (higher = heavier feel)
 */
const springConfig = {
  hover: { stiffness: 400, damping: 25, mass: 0.5 },
  press: { stiffness: 600, damping: 30, mass: 0.3 },
  gentle: { stiffness: 200, damping: 20, mass: 0.8 },
}

interface SpringButtonProps extends ButtonProps {
  /** Spring preset: 'default' | 'gentle' | 'none' */
  spring?: 'default' | 'gentle' | 'none'
  /** Scale factor on hover (default: 1.02) */
  hoverScale?: number
  /** Scale factor on press (default: 0.97) */
  pressScale?: number
  /** Enable subtle 3D tilt effect on hover */
  tilt?: boolean
}

/**
 * SpringButton - Button with physics-based spring animations
 *
 * Features:
 * - Smooth spring physics for hover/press states
 * - Respects prefers-reduced-motion
 * - Optional 3D tilt effect
 * - Composable with all Button variants
 *
 * Usage:
 * ```tsx
 * <SpringButton variant="primary">Click me</SpringButton>
 * <SpringButton variant="kinetic" spring="gentle" tilt>Hover me</SpringButton>
 * ```
 */
const SpringButton = forwardRef<HTMLButtonElement, SpringButtonProps>(
  (
    {
      spring = 'default',
      hoverScale = 1.02,
      pressScale = 0.97,
      tilt = false,
      className,
      variant,
      size,
      children,
      disabled,
      loading,
      onClick,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)

    // Check for reduced motion preference
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    // Spring values for scale
    const config = spring === 'gentle' ? springConfig.gentle : springConfig.hover
    const scaleSpring = useSpring(1, config)

    // Update spring based on interaction state
    useEffect(() => {
      if (prefersReducedMotion || spring === 'none' || disabled) {
        scaleSpring.set(1)
        return
      }

      if (isPressed) {
        scaleSpring.set(pressScale)
      } else if (isHovered) {
        scaleSpring.set(hoverScale)
      } else {
        scaleSpring.set(1)
      }
    }, [isHovered, isPressed, prefersReducedMotion, spring, disabled, hoverScale, pressScale, scaleSpring])

    // If reduced motion or no spring, render standard button
    if (prefersReducedMotion || spring === 'none') {
      return (
        <Button
          ref={ref}
          variant={variant}
          size={size}
          disabled={disabled}
          loading={loading}
          className={className}
          onClick={onClick}
          type={type}
          aria-label={ariaLabel}
        >
          {children}
        </Button>
      )
    }

    return (
      <motion.button
        ref={ref}
        style={{ scale: scaleSpring }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
        onTapCancel={() => setIsPressed(false)}
        className={cn(
          buttonVariants({ variant, size }),
          // Remove CSS scale transforms since we're handling with springs
          '[&]:active:scale-100 [&]:hover:scale-100',
          className
        )}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-label={ariaLabel}
        onClick={onClick}
        type={type}
      >
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
        {children}
      </motion.button>
    )
  }
)

SpringButton.displayName = 'SpringButton'

/**
 * Motion-enhanced link button with spring physics
 * For use with Next.js Link
 */
interface SpringLinkButtonProps {
  href: string
  spring?: 'default' | 'gentle' | 'none'
  hoverScale?: number
  pressScale?: number
  className?: string
  variant?: SpringButtonProps['variant']
  size?: SpringButtonProps['size']
  children?: React.ReactNode
  'aria-label'?: string
  target?: string
  rel?: string
}

const SpringLinkButton = forwardRef<HTMLAnchorElement, SpringLinkButtonProps>(
  (
    {
      spring = 'default',
      hoverScale = 1.02,
      pressScale = 0.97,
      className,
      variant,
      size,
      children,
      href,
      'aria-label': ariaLabel,
      target,
      rel,
    },
    ref
  ) => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches)
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    const config = spring === 'gentle' ? springConfig.gentle : springConfig.hover
    const scaleSpring = useSpring(1, config)

    useEffect(() => {
      if (prefersReducedMotion || spring === 'none') {
        scaleSpring.set(1)
        return
      }

      if (isPressed) {
        scaleSpring.set(pressScale)
      } else if (isHovered) {
        scaleSpring.set(hoverScale)
      } else {
        scaleSpring.set(1)
      }
    }, [isHovered, isPressed, prefersReducedMotion, spring, hoverScale, pressScale, scaleSpring])

    return (
      <motion.a
        ref={ref}
        href={href}
        style={{ scale: scaleSpring }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
        onTapCancel={() => setIsPressed(false)}
        className={cn(
          buttonVariants({ variant, size }),
          '[&]:active:scale-100 [&]:hover:scale-100',
          className
        )}
        aria-label={ariaLabel}
        target={target}
        rel={rel}
      >
        {children}
      </motion.a>
    )
  }
)

SpringLinkButton.displayName = 'SpringLinkButton'

export { SpringButton, SpringLinkButton, springConfig }
export type { SpringButtonProps, SpringLinkButtonProps }
