'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Heart, Leaf } from 'lucide-react'

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
  const currentYear = new Date().getFullYear()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

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
    <footer className="mt-16 border-t border-border-default bg-background-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Mobile: Brand section (always visible) */}
        <div className="mb-8 space-y-4 md:hidden">
          <h3 className="font-heading font-bold text-text-heading flex items-center gap-2">
            <Leaf className="h-5 w-5 text-serum" />
            Farm Companion
          </h3>
          <p className="text-caption text-text-muted">
            The UK&apos;s premium guide to real food, real people, and real places.
          </p>
          {/* Social Media Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/farmcompanion"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-heading transition-colors"
              aria-label="Follow us on X"
            >
              <XIcon className="h-5 w-5" />
            </a>
            <a
              href="https://bsky.app/profile/farmcompanion.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-heading transition-colors"
              aria-label="Follow us on Bluesky"
            >
              <BlueskyIcon className="h-5 w-5" />
            </a>
            <a
              href="https://t.me/farmcompanion"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-heading transition-colors"
              aria-label="Join our Telegram channel"
            >
              <TelegramIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Mobile: Collapsible sections */}
        <div className="space-y-4 md:hidden">
          {footerSections.map((section) => {
            const isExpanded = expandedSections.has(section.title)
            return (
              <div key={section.title} className="border-b border-border-default pb-4">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between py-2 text-left"
                  aria-expanded={isExpanded}
                  aria-controls={`footer-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <h3 className="font-semibold text-text-heading">{section.title}</h3>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-text-muted" />
                  )}
                </button>
                
                {isExpanded && (
                  <div 
                    id={`footer-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="mt-2 animate-fade-in-up"
                  >
                    <ul className="space-y-2 text-caption">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          {link.external ? (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text-body hover:text-text-heading transition-colors"
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              className="text-text-body hover:text-text-heading transition-colors"
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

        {/* Desktop: Grid layout (hidden on mobile) */}
        <div className="hidden grid-cols-1 gap-8 md:grid md:grid-cols-4">
          {/* Brand section */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-text-heading flex items-center gap-2">
              <Leaf className="h-5 w-5 text-serum" />
              Farm Companion
            </h3>
            <p className="text-caption text-text-muted">
              The UK&apos;s premium guide to real food, real people, and real places.
            </p>
            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/farmcompanion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-heading transition-colors"
                aria-label="Follow us on X"
              >
                <XIcon className="h-5 w-5" />
              </a>
              <a
                href="https://bsky.app/profile/farmcompanion.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-heading transition-colors"
                aria-label="Follow us on Bluesky"
              >
                <BlueskyIcon className="h-5 w-5" />
              </a>
              <a
                href="https://t.me/farmcompanion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-heading transition-colors"
                aria-label="Join our Telegram channel"
              >
                <TelegramIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Desktop sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="font-semibold text-text-heading">{section.title}</h3>
              <ul className="space-y-2 text-caption">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-body hover:text-text-heading transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-text-body hover:text-text-heading transition-colors"
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

        {/* Bottom section */}
        <div className="mt-8 border-t border-border-default pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 text-caption text-text-muted md:flex-row md:space-y-0">
            <div>
              © {currentYear} Farm Companion. All rights reserved.
            </div>
            <div className="flex flex-col items-center space-y-2 md:flex-row md:space-x-6 md:space-y-0">
              <span className="flex items-center gap-1">
                Made with <Heart className="h-4 w-4 text-text-muted" /> for local food
              </span>
              <span className="hidden md:inline">•</span>
              <span>Open source</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
