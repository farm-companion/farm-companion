'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Leaf, Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

/**
 * PuredgeOS Header 3.0 — mobile‑first, Awwwards‑grade
 *
 * Design doctrine
 * 1) Mobile first. One clean top bar. No decorative icons. No emojis.
 * 2) Sticky by default, not fixed — prevents overlap with hero and preserves flow.
 * 3) Safe motion. Subtle elevation + glass on scroll. Prefers‑reduced‑motion respected.
 * 4) Inversion by intent. Any section can opt‑in to an inverted header via data‑header‑invert.
 * 5) Accessible sheet menu. Focus return, escape to close, background scroll locked.
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
    <Link href="/" aria-label="Farm Companion — Home" className="group inline-flex items-center gap-3">
      <div
        className={cx(
          'flex h-10 w-10 items-center justify-center rounded-xl shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5',
          inverted ? 'bg-white shadow-white/20' : 'bg-gradient-to-br from-brand-primary to-brand-primary/80 shadow-brand-primary/30'
        )}
      >
        <Leaf className={cx('h-5 w-5', inverted ? 'text-neutral-900' : 'text-white')} />
      </div>
      <div className="leading-tight">
        <span className={cx(
          'block text-base font-semibold transition-colors',
          inverted ? 'text-white' : 'text-neutral-900 dark:text-white group-hover:text-brand-primary'
        )}>Farm Companion</span>
        <span className={cx(
          'hidden text-xs font-medium sm:block',
          inverted ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-400'
        )}>Real food, real places</span>
      </div>
    </Link>
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

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* backdrop - Premium blur */}
      <button
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity"
      />
      {/* sheet panel - Premium glassmorphism */}
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 h-[88vh] max-h-[720px] rounded-t-3xl bg-white/98 dark:bg-neutral-900/98 backdrop-blur-xl shadow-2xl outline-none motion-safe:animate-[sheetIn_.28s_cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ boxShadow: '0 -8px 32px -4px rgba(0, 0, 0, 0.15), 0 -4px 16px -2px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
        </div>

        {/* FLEX COLUMN + SCROLL AREA */}
        <div className="mx-auto flex h-full max-w-screen-sm flex-col px-5 pt-2 pb-8">
          {/* header row */}
          <div className="mb-4 flex items-center justify-between">
            <h2 id={labelledBy} className="text-lg font-semibold text-neutral-900 dark:text-white">Menu</h2>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all duration-150"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* scrollable content */}
          <div className="-mr-2 grow overflow-y-auto overscroll-contain pr-1">
            <nav aria-label="Mobile navigation" className="space-y-2">
              <Link href="/map" onClick={onClose}
                className="block rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4 text-neutral-900 dark:text-white transition-all duration-150 hover:translate-x-1 hover:border-brand-primary/30 hover:shadow-md active:translate-x-0.5">
                <span className="font-semibold">Farm Map</span>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Find farm shops near you</p>
              </Link>

              <Link href="/seasonal" onClick={onClose}
                className="block rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4 text-neutral-900 dark:text-white transition-all duration-150 hover:translate-x-1 hover:border-brand-primary/30 hover:shadow-md active:translate-x-0.5">
                <span className="font-semibold">What&apos;s in Season</span>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Fresh produce calendar</p>
              </Link>

              <Link href="/about" onClick={onClose}
                className="block rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4 text-neutral-900 dark:text-white transition-all duration-150 hover:translate-x-1 hover:border-brand-primary/30 hover:shadow-md active:translate-x-0.5">
                <span className="font-semibold">About</span>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Our story and mission</p>
              </Link>

              <Link href="/contact" onClick={onClose}
                className="block rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4 text-neutral-900 dark:text-white transition-all duration-150 hover:translate-x-1 hover:border-brand-primary/30 hover:shadow-md active:translate-x-0.5">
                <span className="font-semibold">Feedback</span>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Share your thoughts</p>
              </Link>

              <div className="mt-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">Theme</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Light or dark mode</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              <div className="mt-6">
                <Link href="/add" onClick={onClose}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white font-medium shadow-lg shadow-brand-primary/20 transition-all duration-150 hover:shadow-xl hover:shadow-brand-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[.99]">
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
        'sticky top-0 z-50 transition-all duration-300',
        hide ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      <div
        className={cx(
          'mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8',
          'h-16 sm:h-18',
          // Surface states - Premium glassmorphism
          scrolled
            ? inverted
              ? 'border-b border-white/10 bg-black/80 backdrop-blur-xl'
              : 'border-b border-neutral-200/50 dark:border-neutral-700/50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-sm'
            : inverted
              ? 'border-b border-transparent bg-black/30 backdrop-blur-lg'
              : 'border-b border-transparent bg-white/98 dark:bg-neutral-900/98 backdrop-blur-lg'
        )}
      >
        <Brand inverted={inverted} />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <Link className={cx(
            'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150',
            inverted ? 'text-white hover:bg-white/10' : 'text-neutral-700 dark:text-neutral-200 hover:text-brand-primary hover:bg-brand-primary/5'
          )} href="/map">
            Map
          </Link>
          <Link className={cx(
            'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150',
            inverted ? 'text-white hover:bg-white/10' : 'text-neutral-700 dark:text-neutral-200 hover:text-brand-primary hover:bg-brand-primary/5'
          )} href="/seasonal">
            Seasonal
          </Link>
          <Link className={cx(
            'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150',
            inverted ? 'text-white hover:bg-white/10' : 'text-neutral-700 dark:text-neutral-200 hover:text-brand-primary hover:bg-brand-primary/5'
          )} href="/about">
            About
          </Link>
          <Link className={cx(
            'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150',
            inverted ? 'text-white hover:bg-white/10' : 'text-neutral-700 dark:text-neutral-200 hover:text-brand-primary hover:bg-brand-primary/5'
          )} href="/contact">
            Feedback
          </Link>
          <Link
            href="/add"
            className={cx(
              'ml-2 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition-all duration-150',
              inverted
                ? 'bg-white text-neutral-900 shadow-lg shadow-white/20 hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-0.5 active:translate-y-0'
            )}
          >
            Add a Farm Shop
          </Link>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>

        <div className="md:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className={cx(
              'inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-150 active:scale-95',
              inverted
                ? 'border-white/30 text-white hover:bg-white/10'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-brand-primary/30'
            )}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} labelledBy={labelId} />
    </header>
  )
}