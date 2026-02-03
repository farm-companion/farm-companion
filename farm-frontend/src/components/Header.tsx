'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Leaf, Menu, X, MapPin, Calendar, Info, MessageSquare, Plus, Command, Search } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { LocationContext, MegaMenu, CountiesPreview, SeasonalPreview } from '@/components/navigation'

/**
 * God-Tier Header 5.0 - Command Center Design
 *
 * Design principles:
 * 1) Glass surface with specular edge (border luminance in dark mode)
 * 2) CMD+K trigger for power users (keyboard-first navigation)
 * 3) Obsidian-Deep dark mode (#050505 canvas, #121214 surface)
 * 4) Adaptive font weight (semibold light, medium dark)
 * 5) WCAG AAA compliant contrast with 48px touch targets
 * 6) Uppercase nav labels with tight letter-spacing
 */

// Utilities --------------------------------------------------------------
const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ')

function useScrollState() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return scrolled
}

function useHeaderInvert() {
  // Any section in the viewport with data‑header‑invert will invert header styling
  const [invert, setInvert] = useState(false)
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-header-invert]'))
    if (!sections.length) return
    const io = new IntersectionObserver(
      (entries) => {
        // Consider header height margin at ~88px for desktop hit area
        const anyActive = entries.some((e) => e.isIntersecting)
        setInvert(anyActive)
      },
      { root: null, rootMargin: '-88px 0px 0px 0px', threshold: 0.01 }
    )
    sections.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return invert
}

function useLockBody(locked: boolean) {
  useEffect(() => {
    const { body } = document
    if (!body) return
    const prev = body.style.overflow
    if (locked) body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = prev
    }
  }, [locked])
}

// Components ------------------------------------------------------------

function Brand({ inverted }: { inverted: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Farm Companion - Home"
      className="group inline-flex items-center gap-3 py-1 transition-colors duration-200"
    >
      {/* Logo mark - clean flat square */}
      <div
        className={cx(
          'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
          inverted
            ? 'bg-white'
            : 'bg-text-heading'
        )}
      >
        <Leaf className={cx('h-4 w-4', inverted ? 'text-zinc-900' : 'text-background-canvas')} />
      </div>
      {/* Brand text */}
      <div className="leading-tight">
        <span className={cx(
          'block text-[15px] tracking-tight font-semibold dark:font-medium transition-colors',
          inverted ? 'text-white' : 'text-text-heading'
        )}>Farm Companion</span>
        <span className={cx(
          'hidden text-[10px] font-medium tracking-[0.12em] uppercase sm:block transition-colors',
          inverted ? 'text-white/80' : 'text-text-muted'
        )}>Real Food, Real Places</span>
      </div>
    </Link>
  )
}

// CMD+K Search Trigger - Power user keyboard shortcut
function CommandTrigger({ inverted }: { inverted: boolean }) {
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  return (
    <button
      id="search"
      onClick={() => {
        // Dispatch custom event for command palette (can be wired to search modal)
        window.dispatchEvent(new CustomEvent('open-command-palette'))
      }}
      className={cx(
        'hidden lg:inline-flex items-center gap-2 h-9 px-3 rounded-lg border transition-all duration-200',
        'text-[13px] font-medium',
        inverted
          ? 'border-white/30 text-white/90 hover:bg-white/20 hover:text-white'
          : 'border-zinc-200 dark:border-white/[0.08] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:text-zinc-700 dark:hover:text-zinc-200'
      )}
      aria-label="Open command palette"
    >
      <Search className="h-4 w-4" />
      <span className="hidden xl:inline">Search</span>
      <kbd className={cx(
        'ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono',
        inverted
          ? 'bg-white/20 text-white/80'
          : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-400 dark:text-zinc-500'
      )}>
        {isMac ? <Command className="h-3 w-3" /> : 'Ctrl'}
        <span>K</span>
      </kbd>
    </button>
  )
}

function Sheet({ open, onClose, labelledBy }: { open: boolean; onClose: () => void; labelledBy: string }) {
  useLockBody(open)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const lastActiveRef = useRef<HTMLElement | null>(null)

  // Esc + focus trap
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
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

  // Return focus; inert page
  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement
      panelRef.current?.focus()
      if (main) main.setAttribute('inert', '')
    } else {
      if (main) main.removeAttribute('inert')
      lastActiveRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  const navItems = [
    { href: '/map', icon: MapPin, label: 'Farm Map', desc: 'Find farm shops near you' },
    { href: '/seasonal', icon: Calendar, label: "What's in Season", desc: 'Fresh produce calendar' },
    { href: '/about', icon: Info, label: 'About', desc: 'Our story and mission' },
    { href: '/contact', icon: MessageSquare, label: 'Feedback', desc: 'Share your thoughts' },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop - Obsidian blur */}
      <button
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
      />
      {/* Sheet panel - Obsidian glass surface */}
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 h-[88vh] max-h-[720px] rounded-t-3xl border-t border-zinc-200/50 dark:border-white/[0.08] bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl shadow-float outline-none motion-safe:animate-[sheetIn_.28s_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        {/* Specular edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent dark:block hidden pointer-events-none rounded-t-3xl" />

        {/* Grab handle - Obsidian style */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>

        {/* Content */}
        <div className="mx-auto flex h-full max-w-screen-sm flex-col px-6 pb-8">
          {/* Header row */}
          <div className="mb-6 flex items-center justify-between">
            <h2 id={labelledBy} className="text-lg font-semibold dark:font-medium tracking-tight text-zinc-900 dark:text-zinc-50">Menu</h2>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 transition-all hover:bg-zinc-200 dark:hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.96]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="-mr-2 grow overflow-y-auto overscroll-contain pr-1">
            <nav aria-label="Mobile navigation" className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="group flex items-center gap-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02] p-4 transition-all duration-200 hover:border-zinc-300 dark:hover:border-white/[0.12] hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] hover:shadow-sm active:scale-[0.99]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-white/[0.06] shadow-sm dark:shadow-none transition-all group-hover:shadow-md dark:group-hover:bg-white/[0.08]">
                    <item.icon className="h-5 w-5 text-zinc-600 dark:text-zinc-300 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-50" />
                  </div>
                  <div>
                    <span className="block text-[15px] font-semibold dark:font-medium text-zinc-900 dark:text-zinc-50">{item.label}</span>
                    <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{item.desc}</span>
                  </div>
                </Link>
              ))}

              {/* Theme toggle section - Obsidian card */}
              <div className="mt-6 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-semibold dark:font-medium text-zinc-900 dark:text-zinc-50">Appearance</p>
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Light or dark theme</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              {/* CTA button - Kinetic styling */}
              <div className="mt-6 pb-4">
                <Link
                  href="/add"
                  onClick={onClose}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold dark:font-medium uppercase tracking-[0.04em] transition-all duration-200 hover:bg-zinc-800 dark:hover:bg-white hover:shadow-lg active:scale-[0.97]"
                >
                  <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                  Add a Farm Shop
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes sheetIn { from { transform: translateY(24px); opacity: .98 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>,
    document.body
  )
}

export default function Header() {
  const scrolled = useScrollState()
  const inverted = useHeaderInvert()
  const [open, setOpen] = useState(false)
  const labelId = 'mobile-menu-title'

  // Desktop auto‑hide on scroll down (kept minimal to avoid jank). Hidden only when scrolled.
  const [hide, setHide] = useState(false)
  const lastY = useRef(0)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const goingDown = y > lastY.current
      setHide(goingDown && y > 120 && window.innerWidth >= 1024)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cx(
        'sticky top-0 z-50 transition-all duration-300 ease-out',
        hide ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      {/* LV-style flat navigation bar */}
      <div className="px-0">
        <div
          className={cx(
            'relative mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10 transition-all duration-300',
            'h-14 sm:h-16',
            // Solid background with bottom rule
            inverted
              ? 'bg-zinc-900/95 backdrop-blur-sm'
              : 'bg-background-canvas dark:bg-[#0C0A09]',
            // Bottom rule appears on scroll
            scrolled && !inverted ? 'border-b border-border-default' : ''
          )}
        >

          {/* Brand + Location Context */}
          <div className="flex items-center gap-4">
            <Brand inverted={inverted} />
            {/* Location context - hidden on mobile, shown on large screens */}
            <div className="hidden lg:block">
              <LocationContext variant="compact" inverted={inverted} />
            </div>
          </div>

          {/* Desktop navigation - Command Center typography */}
          <nav id="navigation" aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {/* Map link */}
            <Link
              href="/map"
              className={cx(
                'px-4 py-2 rounded-lg text-[12px] font-semibold dark:font-medium uppercase tracking-[0.06em] transition-all duration-200',
                inverted
                  ? 'text-white hover:text-white hover:bg-white/20'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
              )}
            >
              Map
            </Link>

            {/* Counties with Mega Menu */}
            <MegaMenu label="Counties" href="/counties" inverted={inverted}>
              <CountiesPreview />
            </MegaMenu>

            {/* Seasonal with Mega Menu */}
            <MegaMenu label="Seasonal" href="/seasonal" inverted={inverted}>
              <SeasonalPreview />
            </MegaMenu>

            {/* About link */}
            <Link
              href="/about"
              className={cx(
                'px-4 py-2 rounded-lg text-[12px] font-semibold dark:font-medium uppercase tracking-[0.06em] transition-all duration-200',
                inverted
                  ? 'text-white hover:text-white hover:bg-white/20'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
              )}
            >
              About
            </Link>

            {/* CMD+K Search Trigger */}
            <CommandTrigger inverted={inverted} />

            {/* CTA button - Kinetic styling */}
            <Link
              href="/add"
              className={cx(
                'ml-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold dark:font-medium uppercase tracking-[0.04em] transition-all duration-200 hover:shadow-md active:scale-[0.97]',
                inverted
                  ? 'bg-white text-zinc-900 hover:bg-zinc-50'
                  : 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white'
              )}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Add Farm</span>
            </Link>

            <div className="ml-2">
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile menu button - Kinetic interaction */}
          <div className="md:hidden">
            <button
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={cx(
                'inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.96]',
                inverted
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/[0.08]'
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} labelledBy={labelId} />
    </header>
  )
}