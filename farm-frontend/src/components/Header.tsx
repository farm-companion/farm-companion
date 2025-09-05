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
          'flex h-9 w-9 items-center justify-center rounded-lg shadow-sm transition',
          inverted ? 'bg-white' : 'bg-gradient-to-br from-serum to-serum/80'
        )}
      >
        <Leaf className={cx('h-4 w-4', inverted ? 'text-black' : 'text-white')} />
      </div>
      <div className="leading-tight">
        <span className={cx('block text-base font-semibold', inverted ? 'text-white' : 'text-gray-900')}>Farm Companion</span>
        <span className={cx('hidden text-xs font-medium sm:block', inverted ? 'text-white/70' : 'text-gray-600')}>Real food, real places</span>
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
      {/* backdrop */}
      <button
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
      />
      {/* sheet panel */}
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 h-[88vh] max-h-[720px] rounded-t-2xl border border-white/10
                   bg-white shadow-2xl outline-none dark:bg-gray-900
                   motion-safe:animate-[sheetIn_.28s_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        {/* FLEX COLUMN + SCROLL AREA */}
        <div className="mx-auto flex h-full max-w-screen-sm flex-col px-5 pt-4 pb-8">
          {/* header row */}
          <div className="mb-4 flex items-center justify-between">
            <h2 id={labelledBy} className="text-base font-semibold text-gray-900 dark:text-white">Menu</h2>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200
                         text-gray-700 hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-gray-200
                         dark:hover:bg-gray-800"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* scrollable content */}
          <div className="-mr-2 grow overflow-y-auto overscroll-contain pr-1">
            <nav aria-label="Mobile navigation" className="space-y-2">
              <Link href="/map" onClick={onClose}
                className="block rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 transition
                           hover:translate-x-[2px] hover:shadow-sm active:translate-x-[1px]
                           dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                Farm Map
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Find farm shops near you</p>
              </Link>

              <Link href="/seasonal" onClick={onClose}
                className="block rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 transition
                           hover:translate-x-[2px] hover:shadow-sm active:translate-x-[1px]
                           dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                What's in Season
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Fresh produce calendar</p>
              </Link>

              <Link href="/about" onClick={onClose}
                className="block rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 transition
                           hover:translate-x-[2px] hover:shadow-sm active:translate-x-[1px]
                           dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                About
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Our story and mission</p>
              </Link>

              <Link href="/contact" onClick={onClose}
                className="block rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 transition
                           hover:translate-x-[2px] hover:shadow-sm active:translate-x-[1px]
                           dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                Feedback
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Share your thoughts</p>
              </Link>

              <div className="mt-6 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Light or dark mode</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              <div className="mt-6">
                <Link href="/add" onClick={onClose}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-gray-900
                             bg-gray-900 text-white transition hover:bg-black active:scale-[.99]
                             dark:border-white dark:bg-white dark:text-black">
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
          'h-14 sm:h-16',
          // Surface states
          scrolled
            ? inverted
              ? 'border-b border-white/10 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60'
              : 'border-b border-black/10 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        <Brand inverted={inverted} />

        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          <Link className="text-sm text-gray-700 transition hover:text-black dark:text-gray-200 dark:hover:text-white" href="/map">
            Map
          </Link>
          <Link className="text-sm text-gray-700 transition hover:text-black dark:text-gray-200 dark:hover:text-white" href="/seasonal">
            Seasonal
          </Link>
          <Link className="text-sm text-gray-700 transition hover:text-black dark:text-gray-200 dark:hover:text-white" href="/about">
            About
          </Link>
          <Link className="text-sm text-gray-700 transition hover:text-black dark:text-gray-200 dark:hover:text-white" href="/contact">
            Feedback
          </Link>
          <Link
            href="/add"
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-900 bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-black dark:border-white dark:bg-white dark:text-black"
          >
            Add a Farm Shop
          </Link>
          <ThemeToggle />
        </nav>

        <div className="lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className={cx(
              'inline-flex h-10 w-10 items-center justify-center rounded-md border text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:text-gray-200',
              inverted ? 'border-white/30' : 'border-gray-300'
            )}
            aria-label="Open menu"
          >
            <Menu className={'h-5 w-5'} />
          </button>
        </div>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} labelledBy={labelId} />
    </header>
  )
}