'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion'

const discoverLinks = [
  { href: '/map', label: 'Find Farms Near Me' },
  { href: '/seasonal', label: "What's in Season" },
  { href: '/counties', label: 'Browse by County' },
  { href: '/best', label: "Editor's Picks" },
]

const aboutLinks = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy & Terms' },
  { href: '/data-attributions', label: 'Data & attributions' },
]

const farmShopLinks = [
  { href: '/claim', label: 'Update Your Details' },
  { href: '/contact', label: 'Contact Us' },
]


export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return
    setSubscribeStatus('success')
    setEmail('')
  }

  return (
    <footer className="mt-16 border-t border-border">

      {/* Email Capture Banner — calm warm band; Vermilion only on the button
        * (brief §5.5: Vermilion is rare, never a full-bleed field). */}
      <div className="bg-surface-2 border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-12">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-clash text-2xl text-ink leading-snug">
                What&apos;s in season. What&apos;s worth the drive.
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
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
                className="h-11 flex-1 rounded-none border border-border bg-surface px-4 text-[15px] text-ink placeholder:text-ink-muted outline-none focus:border-ink focus:ring-1 focus:ring-ink"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none bg-brand text-brand-text transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <span className="text-xl leading-none" aria-hidden="true">&rarr;</span>
              </button>
            </form>
          </div>
          {subscribeStatus === 'success' && (
            <p className="mt-3 text-sm text-ink-muted">
              Thanks! You&apos;ll hear from us soon.
            </p>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-surface-2">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-12">

          {/* Desktop: 3-column grid */}
          <div className="hidden md:grid md:grid-cols-3 md:gap-16">

            {/* Column 1: Brand */}
            <div className="space-y-4">
              <p className="text-lg font-medium text-foreground">
                Farm Companion
              </p>
              <p className="max-w-[220px] text-[15px] leading-relaxed text-foreground-muted">
                The UK&apos;s independent guide to farm shops worth the visit.
              </p>
              <p className="text-[13px] text-foreground-muted/70">
                Updated weekly
              </p>
              <div className="w-10 border-t border-border" />
              <div className="flex items-center gap-5">
                {[
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

            {/* Column 2: Discover */}
            <div>
              <h4 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-5">
                Discover
              </h4>
              <ul className="space-y-3">
                {discoverLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-foreground-muted hover:text-foreground transition-colors"
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
                      className="text-[15px] text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: For Farm Shops */}
            <div>
              <h4 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-5">
                Are You a Farm Shop?
              </h4>
              <ul className="space-y-3">
                {farmShopLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile: brand always visible, link groups collapsible */}
          <div className="md:hidden">
            <div className="space-y-3 pb-6">
              <p className="text-lg font-medium text-foreground">
                Farm Companion
              </p>
              <p className="text-[15px] leading-relaxed text-foreground-muted">
                The UK&apos;s independent guide to farm shops worth the visit.
              </p>
              <p className="text-[13px] text-foreground-muted/70">
                Updated weekly
              </p>
              <div className="flex items-center gap-5 pt-1">
                {[
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

            <Accordion type="multiple">
              <AccordionItem value="discover" className="border-b border-border">
                <AccordionTrigger
                  size="sm"
                  className="text-xs tracking-[0.2em] uppercase text-foreground-muted hover:no-underline"
                >
                  Discover
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1">
                    {discoverLinks.map((link) => (
                      <li key={link.label} className="min-h-[44px] flex items-center">
                        <Link
                          href={link.href}
                          className="text-[15px] text-foreground-muted hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                    {aboutLinks.map((link) => (
                      <li key={link.label} className="min-h-[44px] flex items-center">
                        <Link
                          href={link.href}
                          className="text-[15px] text-foreground-muted hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="farm-shops" className="border-b border-border">
                <AccordionTrigger
                  size="sm"
                  className="text-xs tracking-[0.2em] uppercase text-foreground-muted hover:no-underline"
                >
                  Are You a Farm Shop?
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1">
                    {farmShopLinks.map((link) => (
                      <li key={link.label} className="min-h-[44px] flex items-center">
                        <Link
                          href={link.href}
                          className="text-[15px] text-foreground-muted hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border bg-surface-2">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 text-[13px] text-foreground-muted md:flex-row md:px-12">
            <p>&copy; {currentYear} Farm Companion</p>
            <div className="flex items-center gap-4">
              <Link href="/site-map" className="hover:text-foreground transition-colors">Sitemap</Link>
              <span>Made in UK</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
