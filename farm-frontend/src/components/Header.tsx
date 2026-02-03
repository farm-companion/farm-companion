'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Menu, X, MapPin, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExploreMenu } from '@/components/navigation/ExploreMenu'

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useScrollBehaviour() {
  const [compact, setCompact] = useState(false)
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const desktop = window.innerWidth >= 768
      setCompact(y > 400)
      if (!desktop) {
        setVisible(y < lastY.current || y < 48)
      } else {
        setVisible(true)
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return { compact, visible }
}

function useLockBody(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}

/* ------------------------------------------------------------------ */
/*  Search Trigger (desktop pill)                                      */
/* ------------------------------------------------------------------ */

function SearchTrigger({ compact }: { compact: boolean }) {
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'))
  }, [])

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
      className={cn(
        'hidden md:flex items-center gap-3 rounded-full transition-all duration-200',
        'bg-[#F5F5F5] dark:bg-white/[0.06]',
        'hover:bg-[#EFEFEF] dark:hover:bg-white/[0.08]',
        'text-[#8C8C8C] dark:text-zinc-400',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5016] focus-visible:bg-white dark:focus-visible:bg-[#121214] focus-visible:shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
        compact ? 'h-10 min-w-[280px] lg:min-w-[320px] px-4' : 'h-11 min-w-[340px] lg:min-w-[440px] px-4',
      )}
      aria-label="Search farms, produce, or places"
    >
      <Search className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-left text-[15px]">
        Search farms, produce, or places...
      </span>
      <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[12px] text-[#CCCCCC] dark:text-zinc-500 font-mono">
        {isMac ? '\u2318' : 'Ctrl+'}K
      </kbd>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile Full-Screen Overlay                                         */
/* ------------------------------------------------------------------ */

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useLockBody(open)
  const panelRef = useRef<HTMLDivElement>(null)
  const lastActiveRef = useRef<HTMLElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )
      if (!nodes || nodes.length === 0) return
      const list = Array.from(nodes)
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !panelRef.current?.contains(active)) { e.preventDefault(); last.focus() }
      } else {
        if (active === last || !panelRef.current?.contains(active)) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    const main = document.querySelector('main')
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement
      main?.setAttribute('inert', '')
      panelRef.current?.focus()
    } else {
      main?.removeAttribute('inert')
      lastActiveRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  const navItems = [
    { href: '/map', label: 'Explore' },
    { href: '/seasonal', label: 'Seasonal' },
    { href: '/about', label: 'About' },
  ]

  const handleNearMe = () => {
    onClose()
    router.push('/map?nearby=true')
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-white dark:bg-[#0C0A09]" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
        className="relative flex flex-col h-full outline-none"
        style={{ animation: 'fadeIn 200ms ease-out' }}
      >
        {/* Close */}
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-200 dark:hover:bg-white/[0.08]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-6 pt-4">
          {/* Near Me CTA */}
          <button
            onClick={handleNearMe}
            className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-[#2D5016] text-white text-[15px] font-medium transition-colors hover:bg-[#1E3A10] active:bg-[#162D0C]"
          >
            <MapPin className="h-4 w-4" />
            Farms Near Me
          </button>

          {/* Nav links */}
          <nav aria-label="Mobile navigation" className="mt-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between py-4 border-b border-zinc-200 dark:border-white/[0.08] text-[18px] text-zinc-900 dark:text-zinc-50"
              >
                {item.label}
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              </Link>
            ))}
          </nav>

          {/* Farmer link */}
          <div className="mt-auto pb-8">
            <Link
              href="/add"
              onClick={onClose}
              className="text-[15px] text-zinc-500 dark:text-zinc-400"
            >
              Are you a farmer?{' '}
              <span className="text-[#2D5016] dark:text-emerald-400 font-medium">
                Add your farm &rarr;
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

export default function Header() {
  const { compact, visible } = useScrollBehaviour()
  const [menuOpen, setMenuOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setExploreOpen(false)
  }, [pathname])

  const handleNearMe = () => {
    router.push('/map?nearby=true')
  }

  const isActive = (href: string) => pathname === href || (pathname?.startsWith(href + '/') ?? false)

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 bg-white dark:bg-[#0C0A09] border-b border-[#E8E8E8] dark:border-white/[0.08] transition-all duration-200',
          !visible && '-translate-y-full',
          compact && 'shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
        )}
      >
        <div
          className={cn(
            'relative mx-auto max-w-7xl flex items-center justify-between transition-all duration-200',
            compact
              ? 'h-12 px-4 md:px-6 lg:px-12'
              : 'h-12 md:h-14 lg:h-16 px-4 md:px-6 lg:px-12',
          )}
        >
          {/* Left: Brand */}
          <Link
            href="/"
            className="text-[18px] font-medium tracking-[0.5px] text-[#1A1A1A] dark:text-zinc-50 shrink-0"
          >
            Farm Companion
          </Link>

          {/* Centre: Search (desktop only) */}
          <div className="hidden md:flex flex-1 justify-center mx-8 lg:mx-12">
            <SearchTrigger compact={compact} />
          </div>

          {/* Right: Nav + CTA (desktop) */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-8" aria-label="Primary">
              {/* Explore (mega-menu) */}
              <div className="relative">
                <button
                  onClick={() => setExploreOpen(!exploreOpen)}
                  className={cn(
                    'text-[15px] transition-colors',
                    isActive('/map') || isActive('/counties') || isActive('/best') || exploreOpen
                      ? 'text-[#1A1A1A] dark:text-zinc-50'
                      : 'text-[#5C5C5C] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-zinc-50',
                    (isActive('/map') || isActive('/counties') || isActive('/best')) && 'underline underline-offset-4',
                  )}
                  aria-expanded={exploreOpen}
                  aria-haspopup="true"
                >
                  Explore
                </button>
                {exploreOpen && (
                  <ExploreMenu onClose={() => setExploreOpen(false)} />
                )}
              </div>

              <Link
                href="/seasonal"
                className={cn(
                  'text-[15px] transition-colors',
                  isActive('/seasonal')
                    ? 'text-[#1A1A1A] dark:text-zinc-50 underline underline-offset-4'
                    : 'text-[#5C5C5C] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-zinc-50',
                )}
                aria-current={isActive('/seasonal') ? 'page' : undefined}
              >
                Seasonal
              </Link>

              <Link
                href="/about"
                className={cn(
                  'text-[15px] transition-colors',
                  isActive('/about')
                    ? 'text-[#1A1A1A] dark:text-zinc-50 underline underline-offset-4'
                    : 'text-[#5C5C5C] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-zinc-50',
                )}
                aria-current={isActive('/about') ? 'page' : undefined}
              >
                About
              </Link>
            </nav>

            {/* Near Me CTA */}
            <button
              onClick={handleNearMe}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#2D5016] text-white text-[15px] font-medium transition-all hover:bg-[#1E3A10] hover:-translate-y-px hover:shadow-md active:bg-[#162D0C] active:translate-y-0 shrink-0"
            >
              Near Me
              <MapPin className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right: Mobile controls */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="h-11 w-11 flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="h-11 w-11 flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
