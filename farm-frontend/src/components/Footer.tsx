'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'

const helpLinks = [
  { href: '/contact', label: 'Contact Us' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy & Terms' },
]

const discoverLinks = [
  { href: '/map', label: 'Find Farms Near Me' },
  { href: '/seasonal', label: "What's in Season" },
  { href: '/counties', label: 'Browse by County' },
  { href: '/best', label: "Editor's Picks" },
]

const farmShopLinks = [
  { href: '/add', label: 'Add Your Listing' },
  { href: '/claim', label: 'Update Your Details' },
]

const bottomLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
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
    setSubscribeStatus('success')
    setEmail('')
  }

  return (
    <footer className="border-t border-border bg-background-secondary">

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-12">

        {/* Desktop: 4-column grid / Mobile: stacked */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">

          {/* Column 1: Help */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-6">
              Help
            </h3>
            <ul className="space-y-4">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground hover:opacity-70 transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Discover */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-6">
              Discover
            </h3>
            <ul className="space-y-4">
              {discoverLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground hover:opacity-70 transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: For Farm Shops */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-6">
              Farm Shops
            </h3>
            <ul className="space-y-4">
              {farmShopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground hover:opacity-70 transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Connect / Newsletter */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-6">
              Connect
            </h3>

            <p className="text-sm text-foreground leading-relaxed mb-6">
              <a
                href="mailto:hello@farmcompanion.co.uk"
                className="border-b border-foreground pb-px hover:opacity-70 transition-opacity"
              >
                Sign up
              </a>
              {' '}for seasonal picks and farm shop news. One email per month.
            </p>

            <form
              onSubmit={handleSubscribe}
              className="flex items-end gap-4 mb-6"
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
                placeholder="Your email"
                required
                className="flex-1 border-0 border-b border-border bg-transparent px-0 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-foreground focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300 flex-shrink-0"
              >
                Subscribe
              </button>
            </form>

            {subscribeStatus === 'success' && (
              <p className="text-xs text-foreground-muted mb-4">
                Thanks. You&apos;ll hear from us soon.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {[
                { label: 'Instagram', href: 'https://instagram.com/farmcompanion' },
                { label: 'Facebook', href: 'https://facebook.com/farmcompanion' },
                { label: 'X', href: 'https://x.com/farmcompanion' },
                { label: 'Bluesky', href: 'https://bsky.app/profile/farmcompanion.bsky.social' },
                { label: 'Telegram', href: 'https://t.me/farmcompanion' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${link.label}`}
                  className="text-xs tracking-[0.1em] uppercase text-foreground-muted hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-foreground-muted">
            {currentYear} Farm Companion Ltd.
          </p>

          <div className="flex items-center gap-6">
            {bottomLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs tracking-[0.1em] uppercase text-foreground-muted hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <span className="text-xs tracking-[0.1em] uppercase text-foreground-muted">
              Made in UK
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
