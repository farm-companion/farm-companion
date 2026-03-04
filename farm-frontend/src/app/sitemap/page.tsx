import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sitemap | Farm Companion',
  description:
    'Explore every corner of Farm Companion in one place. Quickly jump to farm shop maps, seasonal guides, counties, and help pages.',
}

const sections = [
  {
    heading: 'Explore farm shops',
    links: [
      { href: '/map', label: 'Find farms near me' },
      { href: '/shop', label: 'Browse all farm shops' },
      { href: '/best', label: "Editor’s picks" },
      { href: '/categories', label: 'Browse by category' },
      { href: '/counties', label: 'Browse by county' },
      { href: '/seasonal', label: "What’s in season" },
    ],
  },
  {
    heading: 'For farm shops',
    links: [
      { href: '/add', label: 'Add your listing' },
      { href: '/claim', label: 'Claim or update your details' },
      { href: '/contact', label: 'Contact the Farm Companion team' },
      { href: '/submission-success', label: 'Submission success page' },
    ],
  },
  {
    heading: 'About Farm Companion',
    links: [
      { href: '/', label: 'Homepage' },
      { href: '/about', label: 'About Farm Companion' },
      { href: '/terms', label: 'Terms of use' },
      { href: '/privacy', label: 'Privacy & cookies' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <main className="min-h-screen bg-background-canvas py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <header className="mb-12 md:mb-16 text-center">
          <p className="mb-4 text-xs font-accent uppercase tracking-[0.2em] text-foreground-muted">
            Site map
          </p>
          <h1 className="mb-4 text-3xl font-heading font-bold leading-tight text-text-heading md:text-4xl">
            Every corner of Farm Companion, in one place
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-text-body md:text-base">
            Use this page to quickly jump to key areas of the site. All links below point to
            permanent, human-friendly URLs optimised for browsing and search engines.
          </p>
        </header>

        <nav aria-label="Sitemap">
          <div className="grid gap-8 md:grid-cols-3">
            {sections.map(section => (
              <section
                key={section.heading}
                className="rounded-xl border border-border-subtle bg-background-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
              >
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                  {section.heading}
                </h2>
                <ul className="space-y-2">
                  {section.links.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex min-h-[36px] items-center text-sm text-text-body transition-colors hover:text-text-heading"
                      >
                        <span className="mr-2 h-px w-5 bg-border-subtle transition-all group-hover:w-7 group-hover:bg-border-strong" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </nav>
      </div>
    </main>
  )
}

