'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'

const footerSections = [
  {
    title: 'Discover',
    links: [
      { href: '/map', label: 'Find Farms Near Me' },
      { href: '/seasonal', label: "What's in Season" },
      { href: '/counties', label: 'Browse by County' },
      { href: '/best', label: "Editor's Picks" },
      { href: '/about', label: 'About' },
      { href: '/privacy', label: 'Privacy & Terms' },
    ],
  },
  {
    title: 'For Farm Shops',
    links: [
      { href: '/add', label: 'Add Your Listing' },
      { href: '/claim', label: 'Update Your Details' },
      { href: '/contact', label: 'Contact Us' },
    ],
  },
]

const socialLinks = [
  {
    href: 'https://instagram.com/farmcompanion',
    label: 'Instagram',
    ariaLabel: 'Follow us on Instagram',
  },
  {
    href: 'https://facebook.com/farmcompanion',
    label: 'Facebook',
    ariaLabel: 'Follow us on Facebook',
  },
  {
    href: 'https://x.com/farmcompanion',
    label: 'X',
    ariaLabel: 'Follow us on X',
  },
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
    <footer className="border-t border-border bg-background-secondary">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Newsletter */}
        <div className="text-center mb-16">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-foreground tracking-tight">
            Stay in the Loop
          </h2>

          <p className="mt-4 text-foreground-muted text-sm mb-8">
            What&apos;s in season. What&apos;s worth the drive. One email per month.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex items-center max-w-sm mx-auto"
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
              className="flex-1 border-0 border-b bg-transparent px-0 py-3 text-foreground placeholder:text-foreground-muted/50 focus:border-foreground focus:outline-none focus:ring-0 border-border"
            />
            <button
              type="submit"
              className="ml-4 text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300 flex-shrink-0"
            >
              Subscribe
            </button>
          </form>

          {subscribeStatus === 'success' && (
            <p className="mt-4 text-sm text-foreground-muted">
              Thanks. You&apos;ll hear from us soon.
            </p>
          )}
        </div>

        {/* Link Sections */}
        <div className="space-y-12 mb-16">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3 border-t border-border pt-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-foreground hover:opacity-70 transition-opacity"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social */}
        <div className="text-center mb-16">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h3 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-6">
            Follow Us
          </h3>

          <div className="flex items-center justify-center gap-8">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.ariaLabel}
                className="text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-xs text-foreground-muted">
              {currentYear} Farm Companion Ltd. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <span className="text-xs tracking-[0.1em] uppercase text-foreground-muted">Open Source</span>
              <span className="w-4 h-px bg-border" aria-hidden="true" />
              <span className="text-xs tracking-[0.1em] uppercase text-foreground-muted">Made in UK</span>
            </div>
          </div>

          <div className="w-16 h-px bg-border mx-auto mt-8" aria-hidden="true" />
        </div>
      </div>
    </footer>
  )
}
