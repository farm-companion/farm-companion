'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const footerSections = [
  {
    title: 'Explore',
    links: [
      { href: '/map', label: 'Farm Shop Map' },
      { href: '/seasonal', label: "What's in Season" },
      { href: '/counties', label: 'Browse by County' },
      { href: '/about', label: 'About Us' },
    ],
  },
  {
    title: 'For Farm Shops',
    links: [
      { href: '/add', label: 'Add Your Shop' },
      { href: '/claim', label: 'Claim Your Listing' },
      { href: '/contact', label: 'Leave Feedback' },
    ],
  },
  {
    title: 'Legal & Support',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      {
        href: 'https://github.com/farm-companion/farm-frontend/issues/new?title=Data%20fix%3A%20%5Bfarm%20name%5D%20(%5Bslug%5D)%20%E2%80%94%20%5Burl%5D&labels=data%2Creport&template=data_fix.yml',
        label: 'Report an Issue',
        external: true,
      },
    ],
  },
]

const socialLinks = [
  {
    href: 'https://x.com/farmcompanion',
    label: 'X',
    ariaLabel: 'Follow us on X',
  },
  {
    href: 'https://bsky.app/profile/farmcompanion.bsky.social',
    label: 'Bluesky',
    ariaLabel: 'Follow us on Bluesky',
  },
  {
    href: 'https://t.me/farmcompanion',
    label: 'Telegram',
    ariaLabel: 'Join our Telegram channel',
  },
]

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(2026)

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="border-t border-border bg-background-secondary">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Brand */}
        <div className="text-center mb-16">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-foreground tracking-tight">
            Farm Companion
          </h2>

          <p className="mt-4 text-foreground-muted text-sm">
            The UK&apos;s premium guide to real food, real people, and real places.
          </p>
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
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:opacity-70 transition-opacity"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-foreground hover:opacity-70 transition-opacity"
                      >
                        {link.label}
                      </Link>
                    )}
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
