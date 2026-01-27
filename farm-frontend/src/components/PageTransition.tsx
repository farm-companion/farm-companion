'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

/**
 * Page transition variants
 * Subtle, professional fade with slight vertical movement
 */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.55, 0.06, 0.68, 0.19], // easeInQuad
    },
  },
}

/**
 * Reduced motion variants - instant transitions
 */
const reducedMotionVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
}

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

/**
 * Page Transition Component
 *
 * Provides smooth page-to-page transitions for Next.js App Router.
 * Respects prefers-reduced-motion for accessibility.
 *
 * Usage:
 * Wrap your page content or use in template.tsx:
 *
 * ```tsx
 * // In app/template.tsx
 * export default function Template({ children }) {
 *   return <PageTransition>{children}</PageTransition>
 * }
 * ```
 *
 * Or wrap specific content:
 *
 * ```tsx
 * <PageTransition>
 *   <MyPageContent />
 * </PageTransition>
 * ```
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const variants = prefersReducedMotion ? reducedMotionVariants : pageVariants

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Frozen router for handling exit animations
 * Preserves the outgoing route's content during exit animation
 */
export function FrozenRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [frozenChildren, setFrozenChildren] = useState(children)
  const [frozenPathname, setFrozenPathname] = useState(pathname)

  useEffect(() => {
    // Only update when pathname changes (after exit animation completes)
    if (pathname !== frozenPathname) {
      setFrozenChildren(children)
      setFrozenPathname(pathname)
    }
  }, [children, pathname, frozenPathname])

  return <>{frozenChildren}</>
}

export default PageTransition
