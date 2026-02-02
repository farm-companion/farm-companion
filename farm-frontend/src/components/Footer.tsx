'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Leaf, MapPin } from 'lucide-react'

/**
 * God-Tier Footer 5.0 - Data Foundation Design
 *
 * Design principles:
 * 1) High-density instrument panel aesthetic (not a consumer toy)
 * 2) Live system status with animated pulse indicator
 * 3) Tabular figures for coordinates (no jitter on updates)
 * 4) 6-column grid with semantic grouping
 * 5) Obsidian-Deep dark mode (#050505 canvas, #121214 surface)
 * 6) Adaptive font weight and border luminance
 */

// Custom X (formerly Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

// Custom Bluesky icon component
const BlueskyIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.22-.257.439-.323.605-.139.345-.17.633-.139.804.033.18.124.345.249.46.111.1.252.15.398.142.19-.01.38-.06.552-.148 1.143-.59 1.882-1.835 2.049-3.13.059-.456.042-.915-.05-1.364.144.018.288.034.433.047 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8z"/>
  </svg>
)

// Custom Telegram icon component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

// Live System Status Indicator with pulse animation
function SystemStatus() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    // Check online status
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      {/* Animated pulse indicator */}
      <span className="relative flex h-2.5 w-2.5">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${online ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      </span>
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
        {online ? 'All Systems Online' : 'Offline Mode'}
      </span>
    </div>
  )
}

// Version display with tabular figures
function VersionDisplay() {
  const version = '2026.1.4'
  const status = 'Stable'

  return (
    <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
      <span className="font-medium uppercase tracking-[0.08em]">Version</span>
      <span className="font-mono tabular-nums">{version}</span>
      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
        {status}
      </span>
    </div>
  )
}

// Coordinate display with tabular figures (instrument panel aesthetic)
function CoordinateDisplay() {
  // UK center coordinates
  const lat = '54.0000'
  const lon = '-2.0000'

  return (
    <div className="hidden lg:flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
      <MapPin className="h-3.5 w-3.5" />
      <div className="flex items-center gap-2 font-mono tabular-nums">
        <span>{lat}N</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <span>{lon}W</span>
      </div>
    </div>
  )
}

interface FooterSection {
  title: string
  links: Array<{
    href: string
    label: string
    external?: boolean
  }>
}

const footerSections: FooterSection[] = [
  {
    title: 'Explore',
    links: [
      { href: '/map', label: 'Farm Shop Map' },
      { href: '/seasonal', label: "What's in Season" },
      { href: '/counties', label: 'Browse by County' },
      { href: '/about', label: 'About Us' }
    ]
  },
  {
    title: 'For Farm Shops',
    links: [
      { href: '/add', label: 'Add Your Shop' },
      { href: '/claim', label: 'Claim Your Listing' },
      { href: '/contact', label: 'Leave Feedback' }
    ]
  },
  {
    title: 'Legal & Support',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { 
        href: 'https://github.com/farm-companion/farm-frontend/issues/new?title=Data%20fix%3A%20%5Bfarm%20name%5D%20(%5Bslug%5D)%20%E2%80%94%20%5Burl%5D&labels=data%2Creport&template=data_fix.yml',
        label: 'Report an Issue',
        external: true
      }
    ]
  }
]

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(2026) // Default for SSR
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle)
    } else {
      newExpanded.add(sectionTitle)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <footer className="relative mt-16 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#050505]">
      {/* Specular edge highlight (dark mode only) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent dark:block hidden pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Mobile: Brand section (always visible) */}
        <div className="mb-8 space-y-4 md:hidden">
          <h3 className="font-semibold dark:font-medium text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50">
              <Leaf className="h-4 w-4 text-white dark:text-zinc-900" />
            </div>
            Farm Companion
          </h3>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-400">
            The UK&apos;s premium guide to real food, real people, and real places.
          </p>
          {/* System Status - Mobile */}
          <SystemStatus />
          {/* Social Media Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/farmcompanion"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              aria-label="Follow us on X"
            >
              <XIcon className="h-5 w-5" />
            </a>
            <a
              href="https://bsky.app/profile/farmcompanion.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              aria-label="Follow us on Bluesky"
            >
              <BlueskyIcon className="h-5 w-5" />
            </a>
            <a
              href="https://t.me/farmcompanion"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              aria-label="Join our Telegram channel"
            >
              <TelegramIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Mobile: Collapsible sections - Obsidian styling */}
        <div className="space-y-4 md:hidden">
          {footerSections.map((section) => {
            const isExpanded = expandedSections.has(section.title)
            return (
              <div key={section.title} className="border-b border-zinc-200 dark:border-white/[0.06] pb-4">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between py-2 text-left"
                  aria-expanded={isExpanded}
                  aria-controls={`footer-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <h3 className="text-[12px] font-semibold dark:font-medium uppercase tracking-[0.08em] text-zinc-900 dark:text-zinc-50">{section.title}</h3>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-zinc-400" />
                  )}
                </button>

                {isExpanded && (
                  <div
                    id={`footer-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="mt-2 animate-fade-in-up"
                  >
                    <ul className="space-y-2 text-[13px]">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          {link.external ? (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                            >
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Desktop: Data Foundation 6-column grid (hidden on mobile) */}
        <div className="hidden md:grid md:grid-cols-6 gap-8">
          {/* Brand section - spans 2 columns */}
          <div className="col-span-2 space-y-4">
            <h3 className="font-semibold dark:font-medium text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50">
                <Leaf className="h-4 w-4 text-white dark:text-zinc-900" />
              </div>
              Farm Companion
            </h3>
            <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The UK&apos;s premium guide to real food, real people, and real places.
            </p>
            {/* System Status */}
            <SystemStatus />
            {/* Social Media Icons */}
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://x.com/farmcompanion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                aria-label="Follow us on X"
              >
                <XIcon className="h-5 w-5" />
              </a>
              <a
                href="https://bsky.app/profile/farmcompanion.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                aria-label="Follow us on Bluesky"
              >
                <BlueskyIcon className="h-5 w-5" />
              </a>
              <a
                href="https://t.me/farmcompanion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                aria-label="Join our Telegram channel"
              >
                <TelegramIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Desktop sections - High-density link columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-[11px] font-semibold dark:font-medium uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">{section.title}</h3>
              <ul className="space-y-2.5 text-[13px]">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Instrument Panel Column - Version & Coordinates */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold dark:font-medium uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">System</h3>
            <div className="space-y-3">
              <VersionDisplay />
              <CoordinateDisplay />
            </div>
          </div>
        </div>

        {/* Bottom section - Instrument panel footer */}
        <div className="mt-10 border-t border-zinc-200 dark:border-white/[0.06] pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Copyright with tabular year */}
            <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
              <span className="font-mono tabular-nums">{currentYear}</span>
              <span className="ml-1">Farm Companion Ltd. All rights reserved.</span>
            </div>

            {/* Mobile: Version display */}
            <div className="md:hidden">
              <VersionDisplay />
            </div>

            {/* Right side - Meta info */}
            <div className="flex items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500">
              <span className="uppercase tracking-[0.08em]">Open Source</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span className="uppercase tracking-[0.08em]">Made in UK</span>
              <CoordinateDisplay />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
