'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Heart } from 'lucide-react'

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
          <h3 className="font-heading font-bold text-text-heading">Farm Companion</h3>
          <p className="text-sm text-text-muted">
            The UK&apos;s premium guide to real food, real people, and real places.
          </p>
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
                    <ul className="space-y-2 text-sm">
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
            <h3 className="font-heading font-bold text-text-heading">Farm Companion</h3>
            <p className="text-sm text-text-muted">
              The UK&apos;s premium guide to real food, real people, and real places.
            </p>
          </div>

          {/* Desktop sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="font-semibold text-text-heading">{section.title}</h3>
              <ul className="space-y-2 text-sm">
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
          <div className="flex flex-col items-center justify-between space-y-4 text-sm text-text-muted md:flex-row md:space-y-0">
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
