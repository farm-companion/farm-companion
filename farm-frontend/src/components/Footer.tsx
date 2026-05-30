'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion'
import { getCurrentMonth, getMonthName } from '@/lib/seasonal-utils'

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
  const currentMonthName = getMonthName(getCurrentMonth())
  const [email, setEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return
    setSubscribeStatus('success')
    setEmail('')
  }

  return (
    <footer className="bg-ink text-paper">

      {/* Newsletter band — drenched close, display headline, Vermilion accent. */}
      <div className="border-b border-[#F2EBDA]/10">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20 md:px-12">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-16">
            <div>
              <h2
                className="font-clash text-paper font-semibold tracking-[-0.02em] leading-[1.02] text-[clamp(2.25rem,5vw,4rem)]"
                style={{ textWrap: 'balance' } as React.CSSProperties}
              >
                What&apos;s in season.<br />
                What&apos;s worth the drive.
              </h2>
              <p className="mt-5 max-w-[44ch] text-[15px] md:text-base leading-relaxed text-[#F2EBDA]/70">
                One email a month. Real farms, current season, no fluff. Unsubscribe anytime.
              </p>
            </div>

            <form
              onSubmit={handleSubscribe}
              className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
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
                placeholder="your@email.com"
                required
                className="h-12 flex-1 border-0 bg-paper px-5 text-[15px] text-ink placeholder:text-ink-subtle outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              />
              <button
                type="submit"
                className="group inline-flex h-12 items-center justify-center gap-2 bg-brand px-6 text-[15px] font-semibold text-brand-text transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Get the note
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </form>
          </div>
          {subscribeStatus === 'success' && (
            <p className="mt-6 text-sm text-[#F2EBDA]/80">
              Thanks. The next note lands at the top of {currentMonthName}.
            </p>
          )}
        </div>
      </div>

      {/* Main footer body — same drenched band, magazine-style columns. */}
      <div>
        <div className="mx-auto max-w-6xl px-6 py-14 md:px-12 md:py-16">

          {/* Desktop: 3-column grid */}
          <div className="hidden md:grid md:grid-cols-3 md:gap-16">

            {/* Column 1: Brand */}
            <div className="space-y-5">
              <p className="font-clash text-2xl md:text-3xl font-semibold tracking-[-0.01em] text-paper">
                Farm Companion
              </p>
              <p className="max-w-[28ch] text-[15px] leading-relaxed text-[#F2EBDA]/75">
                The UK&apos;s independent guide to farm shops worth the visit.
              </p>
              <p className="text-[13px] text-[#F2EBDA]/55">
                Updated weekly &middot; <span className="text-brand font-medium">{currentMonthName} edition</span>
              </p>
              <div className="w-12 border-t border-[#F2EBDA]/20" />
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
                    className="text-xs tracking-[0.12em] uppercase text-[#F2EBDA]/55 hover:text-paper transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Discover */}
            <div>
              <h3 className="font-clash text-lg font-semibold text-paper mb-5">
                Discover
              </h3>
              <ul className="space-y-3">
                {discoverLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-[#F2EBDA]/75 hover:text-paper transition-colors"
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
                      className="text-[15px] text-[#F2EBDA]/60 hover:text-paper transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: For Farm Shops */}
            <div>
              <h3 className="font-clash text-lg font-semibold text-paper mb-5">
                Are you a farm shop?
              </h3>
              <ul className="space-y-3">
                {farmShopLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-[#F2EBDA]/75 hover:text-paper transition-colors"
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
            <div className="space-y-4 pb-8">
              <p className="font-clash text-2xl font-semibold tracking-[-0.01em] text-paper">
                Farm Companion
              </p>
              <p className="text-[15px] leading-relaxed text-[#F2EBDA]/75">
                The UK&apos;s independent guide to farm shops worth the visit.
              </p>
              <p className="text-[13px] text-[#F2EBDA]/55">
                Updated weekly &middot; <span className="text-brand font-medium">{currentMonthName} edition</span>
              </p>
              <div className="flex items-center gap-5 pt-2">
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
                    className="text-xs tracking-[0.12em] uppercase text-[#F2EBDA]/55 hover:text-paper transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <Accordion type="multiple">
              <AccordionItem value="discover" className="border-b border-[#F2EBDA]/15">
                <AccordionTrigger
                  size="sm"
                  className="font-clash text-base font-semibold text-paper hover:no-underline"
                >
                  Discover
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1">
                    {discoverLinks.map((link) => (
                      <li key={link.label} className="min-h-[44px] flex items-center">
                        <Link
                          href={link.href}
                          className="text-[15px] text-[#F2EBDA]/75 hover:text-paper transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                    {aboutLinks.map((link) => (
                      <li key={link.label} className="min-h-[44px] flex items-center">
                        <Link
                          href={link.href}
                          className="text-[15px] text-[#F2EBDA]/60 hover:text-paper transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="farm-shops" className="border-b border-[#F2EBDA]/15">
                <AccordionTrigger
                  size="sm"
                  className="font-clash text-base font-semibold text-paper hover:no-underline"
                >
                  Are you a farm shop?
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1">
                    {farmShopLinks.map((link) => (
                      <li key={link.label} className="min-h-[44px] flex items-center">
                        <Link
                          href={link.href}
                          className="text-[15px] text-[#F2EBDA]/75 hover:text-paper transition-colors"
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
        <div className="border-t border-[#F2EBDA]/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-[13px] text-[#F2EBDA]/50 md:flex-row md:px-12">
            <p>&copy; {currentYear} Farm Companion</p>
            <div className="flex items-center gap-4">
              <Link href="/site-map" className="hover:text-paper transition-colors">Sitemap</Link>
              <span>Made in UK</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
