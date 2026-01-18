'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Map, Calendar, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * BottomNav - Mobile-first bottom navigation bar
 *
 * Thumb-friendly navigation in the bottom third of the screen
 * Only visible on mobile/tablet (hidden on desktop lg+)
 *
 * Design principles:
 * - 64px height (generous touch targets)
 * - Icons + labels for clarity
 * - Active state highlighting
 * - Safe area insets for iPhone notch
 * - Backdrop blur for modern feel
 */

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  matchPaths: string[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    matchPaths: ['/'],
  },
  {
    href: '/map',
    label: 'Map',
    icon: Map,
    matchPaths: ['/map'],
  },
  {
    href: '/seasonal',
    label: 'Seasonal',
    icon: Calendar,
    matchPaths: ['/seasonal'],
  },
  {
    href: '/shop',
    label: 'Browse',
    icon: Search,
    matchPaths: ['/shop', '/categories', '/counties', '/best'],
  },
]

function isActive(pathname: string, matchPaths: string[]): boolean {
  return matchPaths.some((path) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  })
}

export function BottomNav() {
  const pathname = usePathname()

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Hide on add/claim pages (full-screen forms)
  if (pathname?.startsWith('/add') || pathname?.startsWith('/claim')) {
    return null
  }

  return (
    <>
      {/* Spacer to prevent content being hidden behind fixed bottom nav */}
      <div className="h-16 lg:hidden" aria-hidden="true" />

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        aria-label="Mobile bottom navigation"
      >
        {/* Background with blur */}
        <div className="absolute inset-0 border-t border-gray-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 dark:border-gray-800 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/90" />

        {/* Navigation items */}
        <div className="relative mx-auto flex h-16 max-w-screen-xl items-center justify-around px-2 pb-safe-bottom">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname || '', item.matchPaths)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  // Base styles - generous touch target (56px)
                  'flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all',
                  // Touch target size
                  'min-h-[56px]',
                  // Active state
                  active
                    ? 'text-serum dark:text-serum'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                  // Tap feedback
                  'active:scale-95',
                  // Hover effect (for devices that support it)
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  // Focus visible
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serum focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {/* Icon */}
                <Icon
                  className={cn(
                    'h-6 w-6 transition-transform',
                    active && 'scale-110'
                  )}
                  aria-hidden="true"
                />

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium transition-all',
                    active && 'font-semibold'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
