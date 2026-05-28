'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search, Menu, X, MapPin, ChevronRight,
  Leaf, Award, Compass, LayoutGrid, ShoppingBag,
  Info, MessageCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useScrollBehaviour() {
  // Brief §4: the 1px rule bottom border appears only once scrolled past 8px.
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const desktop = window.innerWidth >= 768
      setScrolled(y > 8)
      setVisible(desktop ? true : y < lastY.current || y < 48)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return { scrolled, visible }
}

type HeroTone = 'light' | 'dark'

function useImmersiveHeroTone(pathname: string | null): HeroTone | null {
  // A page opts into a full-bleed hero by marking it
  // [data-immersive-hero="light|dark"]. While that hero sits behind the 72px
  // header the bar turns into a tone-matched frosted glass (so the artwork reads
  // through it), then solidifies to opaque paper once scrolled past it. The tone
  // selects text + frost colour: light artwork -> dark ink, dark artwork -> light.
  // Pages without the marker (every non-hero route) keep the solid header.
  const [tone, setTone] = useState<HeroTone | null>(null)

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('[data-immersive-hero]')
    if (!hero) return
    const heroTone: HeroTone = hero.dataset.immersiveHero === 'dark' ? 'dark' : 'light'
    const io = new IntersectionObserver(
      ([entry]) => setTone(entry.isIntersecting ? heroTone : null),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
    )
    io.observe(hero)
    return () => {
      io.disconnect()
      setTone(null)
    }
  }, [pathname])

  return tone
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

const openCommandPalette = () =>
  window.dispatchEvent(new CustomEvent('open-command-palette'))

/* Brief §4: Map / Seasonal / Journal / About. Journal has no content yet
 * (brief §15 open Q4), so it is omitted until it ships. "Explore" is dropped. */
const DESKTOP_NAV: { href: string; label: string }[] = [
  { href: '/map', label: 'Map' },
  { href: '/seasonal', label: 'Seasonal' },
  { href: '/about', label: 'About' },
]

/* ------------------------------------------------------------------ */
/*  Mobile Full-Screen Overlay                                         */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
}

interface NavSection {
  title: string | null
  items: NavItem[]
}

const MOBILE_NAV_SECTIONS: NavSection[] = [
  {
    title: null,
    items: [
      { href: '/map', label: 'Map', icon: MapPin },
      { href: '/shop', label: 'All Farm Shops', icon: ShoppingBag },
    ],
  },
  {
    title: 'Discover',
    items: [
      { href: '/seasonal', label: 'Seasonal Guide', icon: Leaf },
      { href: '/best', label: "Editor's Picks", icon: Award },
      { href: '/counties', label: 'Browse Counties', icon: Compass },
      { href: '/categories', label: 'Categories', icon: LayoutGrid },
    ],
  },
  {
    title: 'More',
    items: [
      { href: '/about', label: 'About', icon: Info },
      { href: '/contact', label: 'Contact', icon: MessageCircle },
    ],
  },
]

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useLockBody(open)
  const panelRef = useRef<HTMLDivElement>(null)
  const lastActiveRef = useRef<HTMLElement | null>(null)
  const router = useRouter()
  const pathname = usePathname()

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

  const handleNearMe = () => {
    onClose()
    router.push('/map?nearby=true')
  }

  const openSearch = () => {
    onClose()
    setTimeout(openCommandPalette, 150)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-paper" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
        className="relative flex flex-col h-full outline-none overflow-y-auto overscroll-contain"
        style={{ animation: 'fadeIn 200ms ease-out' }}
      >
        {/* Header: brand + close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <Link
            href="/"
            onClick={onClose}
            className="font-clash text-xl text-ink"
          >
            Farm Companion
          </Link>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-2 text-ink-muted transition-colors hover:text-ink"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search trigger (the one pill-shaped input signal, brief §4) */}
        <div className="px-5 pt-3">
          <button
            onClick={openSearch}
            className="w-full h-11 flex items-center gap-3 px-4 rounded-full border border-border bg-surface text-ink-muted text-[15px] transition-colors hover:text-ink"
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            Postcode, town, or farm name
          </button>
        </div>

        {/* Primary CTA — Vermilion (brief §4 primary: radius 0) */}
        <div className="px-5 pt-4">
          <button
            onClick={handleNearMe}
            className="w-full h-14 flex items-center justify-center gap-2 rounded-none bg-brand text-brand-text text-[15px] font-semibold transition-colors hover:bg-brand-hover"
          >
            <MapPin className="h-4 w-4" />
            Farms Near Me
          </button>
        </div>

        {/* Navigation sections */}
        <nav aria-label="Mobile navigation" className="flex-1 px-5 pt-6">
          {MOBILE_NAV_SECTIONS.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-5' : ''}>
              {section.title && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted mb-1.5 px-1">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3.5 py-3.5 border-b border-border group',
                      active && 'bg-surface-2 -mx-2 px-2 rounded-[2px] border-transparent'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={cn(
                      'h-9 w-9 flex items-center justify-center rounded-[2px] transition-colors',
                      active
                        ? 'bg-brand/10 text-brand'
                        : 'bg-surface-2 text-ink-muted group-hover:text-ink'
                    )}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className={cn(
                      'flex-1 text-[16px]',
                      active ? 'text-brand font-medium' : 'text-ink'
                    )}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[11px] font-medium border border-accent text-accent rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-ink-muted" />
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

      </div>
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

export default function Header() {
  const { scrolled, visible } = useScrollBehaviour()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const tone = useImmersiveHeroTone(pathname)
  const onHero = tone !== null
  const onDark = tone === 'dark'

  const isActive = (href: string) => pathname === href || (pathname?.startsWith(href + '/') ?? false)

  // Tone-aware foreground: warm cream-white (#F4F1EA) over dark heroes, ink otherwise.
  const wordmarkColor = onDark ? 'text-[#F4F1EA]' : 'text-ink'
  const linkIdle = onDark
    ? 'text-[#F4F1EA]/75 hover:text-[#F4F1EA] hover:underline'
    : 'text-ink-muted hover:text-ink hover:underline'
  const linkActive = onDark ? 'text-[#F4F1EA] underline' : 'text-brand underline'
  const iconBtn = onDark
    ? 'text-[#F4F1EA]/90 hover:text-[#F4F1EA] hover:bg-white/10'
    : 'text-ink-muted hover:text-ink hover:bg-surface-2'

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
          !visible && '-translate-y-full',
          // Over a hero: tone-matched frosted glass (vibrancy = blur + saturate),
          // no hard edge. Off-hero: opaque paper, rule border once scrolled.
          tone === 'light' && 'bg-[#F2EBDA]/70 backdrop-blur-md backdrop-saturate-150 border-b border-transparent',
          tone === 'dark' && 'bg-[#15120D]/25 backdrop-blur-md backdrop-saturate-150 border-b border-transparent',
          !onHero && (scrolled ? 'bg-paper border-b border-border' : 'bg-paper border-b border-transparent'),
        )}
      >
        <div className="relative mx-auto max-w-[1320px] flex items-center justify-between h-[72px] px-4 md:px-6 lg:px-12">
          {/* Left: wordmark (set as text in the display face, brief §4) */}
          <Link
            href="/"
            className={cn('font-clash text-2xl tracking-tight shrink-0 transition-colors', wordmarkColor)}
          >
            Farm Companion
          </Link>

          {/* Right: nav links + search (desktop) */}
          <div className="hidden md:flex items-center gap-9">
            <nav className="flex items-center gap-9" aria-label="Primary">
              {DESKTOP_NAV.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'text-[15px] font-medium uppercase tracking-[0.04em] underline-offset-[6px] decoration-1 transition-colors',
                      active ? linkActive : linkIdle,
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <button
              onClick={openCommandPalette}
              className={cn('h-10 w-10 flex items-center justify-center rounded-full transition-colors', iconBtn)}
              aria-label="Search farms, produce, or places"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Right: mobile controls */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={openCommandPalette}
              className={cn('h-11 w-11 flex items-center justify-center rounded-full transition-colors', iconBtn)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className={cn('h-11 w-11 flex items-center justify-center rounded-full transition-colors', iconBtn)}
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
