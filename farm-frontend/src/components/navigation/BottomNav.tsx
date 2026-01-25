'use client'

/**
 * BottomNav - Enhanced Mobile Bottom Navigation
 *
 * Thumb-friendly navigation with "Nearby" quick action.
 * Only visible on mobile/tablet (hidden on desktop lg+).
 *
 * Design System Compliance:
 * - Touch targets: 56px minimum (exceeds 48px standard)
 * - Spacing: 8px grid
 * - Animation: Subtle scale on tap, no continuous motion
 * - Safe areas: pb-safe-bottom for iPhone notch
 */

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Map, Calendar, Search, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const router = useRouter()

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Hide on add/claim pages (full-screen forms)
  if (pathname?.startsWith('/add') || pathname?.startsWith('/claim')) {
    return null
  }

  const handleNearbyClick = () => {
    // Navigate to map with nearby filter
    router.push('/map?nearby=true')
  }

  // Split nav items for center FAB placement
  const leftItems = NAV_ITEMS.slice(0, 2)
  const rightItems = NAV_ITEMS.slice(2)

  return (
    <>
      {/* Spacer to prevent content being hidden behind fixed bottom nav */}
      <div className="h-20 lg:hidden" aria-hidden="true" />

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        aria-label="Mobile bottom navigation"
      >
        {/* Background with blur */}
        <div className="absolute inset-0 border-t border-slate-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 dark:border-slate-800 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/90" />

        {/* Navigation items with center FAB */}
        <div className="relative mx-auto flex h-16 max-w-screen-xl items-center justify-around px-2 pb-safe-bottom">
          {/* Left nav items */}
          {leftItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname || '', item.matchPaths)}
            />
          ))}

          {/* Center "Nearby" FAB */}
          <div className="relative -mt-4">
            <button
              onClick={handleNearbyClick}
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full',
                'bg-primary-500 text-white shadow-lg',
                'transition-all duration-200',
                'hover:bg-primary-600 hover:shadow-xl hover:scale-105',
                'active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
              )}
              aria-label="Find nearby farms"
            >
              <Navigation className="h-6 w-6" />
            </button>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-primary-600 dark:text-primary-400 whitespace-nowrap">
              Nearby
            </span>
          </div>

          {/* Right nav items */}
          {rightItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname || '', item.matchPaths)}
            />
          ))}
        </div>
      </nav>
    </>
  )
}

/**
 * Individual nav link with active indicator.
 */
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        // Base styles - generous touch target
        'relative flex min-w-[60px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2',
        // Touch target size (56px)
        'min-h-[56px]',
        // Colors
        active
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
        // Tap feedback
        'active:scale-95 transition-all duration-150',
        // Hover effect
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        // Focus visible
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {/* Active indicator dot */}
      {active && (
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary-500" />
      )}

      {/* Icon */}
      <Icon
        className={cn(
          'h-5 w-5 transition-transform duration-150',
          active && 'scale-110'
        )}
        aria-hidden="true"
      />

      {/* Label */}
      <span
        className={cn(
          'text-[10px] font-medium transition-all',
          active && 'font-semibold'
        )}
      >
        {item.label}
      </span>
    </Link>
  )
}
