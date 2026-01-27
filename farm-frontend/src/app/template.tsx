'use client'

import { PageTransition } from '@/components/PageTransition'

/**
 * Root Template for Page Transitions
 *
 * In Next.js App Router, template.tsx creates a new instance for each navigation,
 * making it perfect for page transitions. Unlike layout.tsx which persists,
 * template.tsx remounts on every route change.
 *
 * This provides smooth fade transitions between pages while respecting
 * prefers-reduced-motion for accessibility.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition>
      {children}
    </PageTransition>
  )
}
