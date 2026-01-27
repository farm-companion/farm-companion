'use client'

import { useCallback, useEffect, useState } from 'react'

interface SkipLinkTarget {
  id: string
  label: string
}

const DEFAULT_TARGETS: SkipLinkTarget[] = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'navigation', label: 'Skip to navigation' },
  { id: 'search', label: 'Skip to search' },
]

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onActivate?: () => void
}

/**
 * Individual skip link with smooth focus management.
 * Handles scrolling and focusing the target element properly.
 */
export function SkipLink({ href, children, className = '', onActivate }: SkipLinkProps) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    const target = document.getElementById(targetId)

    if (target) {
      // Scroll target into view with smooth behavior
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })

      // Make target focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1')
      }

      // Focus target after a brief delay to allow scroll to complete
      setTimeout(() => {
        target.focus({ preventScroll: true })
        onActivate?.()
      }, 100)
    }
  }, [href, onActivate])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const target = e.currentTarget
      target.click()
    }
  }, [])

  return (
    <a
      href={href}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`skip-link ${className}`.trim()}
    >
      {children}
    </a>
  )
}

/**
 * Enhanced skip links for keyboard navigation.
 *
 * Features:
 * - Smooth focus management when activating links
 * - Dynamic visibility based on target availability
 * - Proper tab order (no tabIndex hacks)
 * - WCAG 2.1 compliant skip navigation
 *
 * Usage: Place at the very beginning of the page body.
 * Targets must have corresponding IDs: main-content, navigation, search
 */
export function SkipLinks() {
  const [availableTargets, setAvailableTargets] = useState<SkipLinkTarget[]>([])
  const [isVisible, setIsVisible] = useState(false)

  // Check which targets exist in the DOM
  useEffect(() => {
    const checkTargets = () => {
      const available = DEFAULT_TARGETS.filter(
        target => document.getElementById(target.id) !== null
      )
      setAvailableTargets(available)
    }

    // Initial check
    checkTargets()

    // Re-check on route changes (for SPA navigation)
    const observer = new MutationObserver(() => {
      checkTargets()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  // Show skip links only when focused (keyboard users)
  const handleFocus = useCallback(() => setIsVisible(true), [])
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Only hide if focus leaves the skip links container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsVisible(false)
    }
  }, [])

  if (availableTargets.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Skip links"
      className="skip-links-container"
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-visible={isVisible}
    >
      {availableTargets.map((target) => (
        <SkipLink
          key={target.id}
          href={`#${target.id}`}
          onActivate={() => setIsVisible(false)}
        >
          {target.label}
        </SkipLink>
      ))}

      <style jsx>{`
        .skip-links-container {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
          pointer-events: none;
        }

        .skip-links-container[data-visible="true"] {
          pointer-events: auto;
        }

        .skip-links-container :global(.skip-link) {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 12px 16px;
          background: var(--color-primary, #00C2B2);
          color: white;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-100%);
          opacity: 0;
          transition: transform 0.2s ease, opacity 0.2s ease;
          pointer-events: none;
        }

        .skip-links-container :global(.skip-link:focus) {
          transform: translateY(0);
          opacity: 1;
          outline: 2px solid white;
          outline-offset: 2px;
          pointer-events: auto;
        }

        .skip-links-container :global(.skip-link:focus-visible) {
          transform: translateY(0);
          opacity: 1;
          outline: 2px solid white;
          outline-offset: 2px;
          pointer-events: auto;
        }

        .skip-links-container :global(.skip-link:hover) {
          background: var(--color-primary-dark, #00a89a);
        }

        .skip-links-container :global(.skip-link:active) {
          transform: translateY(0) scale(0.98);
        }

        /* Dark mode adjustments */
        :global(.dark) .skip-links-container :global(.skip-link) {
          background: #00C2B2;
          color: #0C0A09;
        }

        :global(.dark) .skip-links-container :global(.skip-link:focus) {
          outline-color: #00C2B2;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .skip-links-container :global(.skip-link) {
            transition: none;
          }
        }
      `}</style>
    </nav>
  )
}
