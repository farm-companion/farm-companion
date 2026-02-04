'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'

/**
 * Footer -- Three-column layout with email capture banner.
 *
 * Structure:
 * 1. Email capture banner (brand green)
 * 2. Three-column main content (Brand | Discover | Farm Shops)
 * 3. Bottom bar (copyright + origin)
 */

// Instagram icon
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

// Facebook icon
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const discoverLinks = [
  { href: '/map', label: 'Find Farms Near Me' },
  { href: '/seasonal', label: "What's in Season" },
  { href: '/counties', label: 'Browse by County' },
  { href: '/best', label: "Editor's Picks" },
]

const aboutLinks = [
  { href: '/about', label: 'About' },
  { href: '/about', label: 'How We Choose' },
  { href: '/privacy', label: 'Privacy & Terms' },
]

const farmShopLinks = [
  { href: '/add', label: 'Add Your Listing' },
  { href: '/claim', label: 'Update Your Details' },
  { href: '/contact', label: 'Contact Us' },
]

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(2026)
  const [email, setEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return
    // Placeholder: wire to real endpoint later
    setSubscribeStatus('success')
    setEmail('')
  }

  return (
    <footer className="relative mt-16 border-t border-[#E8E8E8] dark:border-white/[0.08]">

      {/* ── Email Capture Banner ── */}
      <div className="bg-[#2D5016] dark:bg-[#1a3a0d]">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-12 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h3 className="text-[20px] font-medium text-white leading-snug">
                What&apos;s in season. What&apos;s worth the drive.
              </h3>
              <p className="text-[14px] text-white/80">
                One email per month. No spam. Unsubscribe anytime.
              </p>
            </div>
            <form
              onSubmit={handleSubscribe}
              className="flex w-full max-w-sm items-center gap-0"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (subscribeStatus !== 'idle') setSubscribeStatus('idle')
                }}
                placeholder="Your email address"
                required
                className="h-11 flex-1 rounded-l-lg border-0 bg-white px-4 text-[15px] text-[#1A1A1A] placeholder:text-[#8C8C8C] outline-none focus:ring-2 focus:ring-white/40"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-lg bg-white text-[#2D5016] transition-colors hover:bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <span className="text-xl leading-none" aria-hidden="true">&rarr;</span>
              </button>
            </form>
          </div>
          {subscribeStatus === 'success' && (
            <p className="mt-3 text-[14px] text-white/90">
              Thanks! You&apos;ll hear from us soon.
            </p>
          )}
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="bg-[#FFFDF9] dark:bg-[#050505]">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-12">

          {/* Desktop: three-column grid */}
          <div className="hidden md:grid md:grid-cols-3 md:gap-16">

            {/* Column 1: Brand */}
            <div className="space-y-4">
              <p className="text-[18px] font-medium text-[#1A1A1A] dark:text-zinc-50">
                Farm Companion
              </p>
              <p className="max-w-[220px] text-[15px] leading-relaxed text-[#5C5C5C] dark:text-zinc-400">
                The UK&apos;s independent guide to farm shops worth the visit.
              </p>
              <p className="text-[13px] text-[#8C8C8C] dark:text-zinc-500">
                1,247 farms verified<br />
                Updated weekly
              </p>
              <div className="w-10 border-t border-[#E0E0E0] dark:border-white/[0.08]" />
              <div className="flex items-center gap-4">
                <a
                  href="https://instagram.com/farmcompanion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8C8C8C] transition-colors hover:text-[#1A1A1A] dark:hover:text-zinc-50"
                  aria-label="Follow us on Instagram"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
                <a
                  href="https://facebook.com/farmcompanion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8C8C8C] transition-colors hover:text-[#1A1A1A] dark:hover:text-zinc-50"
                  aria-label="Follow us on Facebook"
                >
                  <FacebookIcon className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Column 2: Discover */}
            <div>
              <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-[1px] text-[#8C8C8C] dark:text-zinc-500">
                Discover
              </h4>
              <ul className="space-y-3">
                {discoverLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-[#5C5C5C] transition-colors hover:text-[#1A1A1A] dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-6 space-y-3">
                {aboutLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-[#5C5C5C] transition-colors hover:text-[#1A1A1A] dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: For Farm Shops */}
            <div>
              <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-[1px] text-[#8C8C8C] dark:text-zinc-500">
                Are You a Farm Shop?
              </h4>
              <ul className="space-y-3">
                {farmShopLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-[#5C5C5C] transition-colors hover:text-[#1A1A1A] dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile: stacked sections */}
          <div className="space-y-8 md:hidden">

            {/* Brand */}
            <div className="space-y-3">
              <p className="text-[18px] font-medium text-[#1A1A1A] dark:text-zinc-50">
                Farm Companion
              </p>
              <p className="text-[15px] leading-relaxed text-[#5C5C5C] dark:text-zinc-400">
                The UK&apos;s independent guide to farm shops worth the visit.
              </p>
              <p className="text-[13px] text-[#8C8C8C] dark:text-zinc-500">
                1,247 farms &middot; Updated weekly
              </p>
              <div className="flex items-center gap-4 pt-1">
                <a
                  href="https://instagram.com/farmcompanion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8C8C8C] transition-colors hover:text-[#1A1A1A] dark:hover:text-zinc-50"
                  aria-label="Follow us on Instagram"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
                <a
                  href="https://facebook.com/farmcompanion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8C8C8C] transition-colors hover:text-[#1A1A1A] dark:hover:text-zinc-50"
                  aria-label="Follow us on Facebook"
                >
                  <FacebookIcon className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="border-t border-[#E8E8E8] dark:border-white/[0.06]" />

            {/* Discover */}
            <div>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[1px] text-[#8C8C8C] dark:text-zinc-500">
                Discover
              </h4>
              <ul className="space-y-3">
                {discoverLinks.map((link) => (
                  <li key={link.label} className="min-h-[48px] flex items-center">
                    <Link
                      href={link.href}
                      className="text-[15px] text-[#5C5C5C] transition-colors hover:text-[#1A1A1A] dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {aboutLinks.map((link) => (
                  <li key={link.label} className="min-h-[48px] flex items-center">
                    <Link
                      href={link.href}
                      className="text-[15px] text-[#5C5C5C] transition-colors hover:text-[#1A1A1A] dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#E8E8E8] dark:border-white/[0.06]" />

            {/* For Farm Shops */}
            <div>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[1px] text-[#8C8C8C] dark:text-zinc-500">
                Are You a Farm Shop?
              </h4>
              <ul className="space-y-3">
                {farmShopLinks.map((link) => (
                  <li key={link.label} className="min-h-[48px] flex items-center">
                    <Link
                      href={link.href}
                      className="text-[15px] text-[#5C5C5C] transition-colors hover:text-[#1A1A1A] dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="border-t border-[#E8E8E8] dark:border-white/[0.06] bg-[#FAFAFA] dark:bg-[#030303]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 text-[13px] text-[#8C8C8C] dark:text-zinc-500 md:flex-row md:px-12">
            <p>&copy; {currentYear} Farm Companion</p>
            <p>Made in UK 🇬🇧</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
