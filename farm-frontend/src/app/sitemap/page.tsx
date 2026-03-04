import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Sitemap | Farm Companion',
  description:
    'Browse all pages on Farm Companion — the UK farm shop directory. Find farms by map, county, category, or season.',
  alternates: {
    canonical: `${SITE_URL}/sitemap`,
  },
  robots: {
    index: true,
    follow: true,
  },
}

const sitemapSections = [
  {
    title: 'Explore',
    persona: 'Weekend Explorer',
    description: 'Find your next farm shop trip',
    overlap: false,
    links: [
      { href: '/', label: 'Home' },
      { href: '/map', label: 'Interactive Map' },
      { href: '/shop', label: 'Farm Directory' },
      { href: '/compare', label: 'Compare Farms' },
    ],
  },
  {
    title: 'Seasonal Produce',
    persona: 'Seasonal Planner',
    description: 'Know what to buy and when',
    overlap: false,
    links: [
      { href: '/seasonal', label: "What's in Season" },
    ],
  },
  {
    title: 'Quality & Sourcing',
    persona: 'Home Chef + Conscious Shopper',
    description: 'Where quality-focused and sustainability-minded shoppers meet',
    overlap: true,
    links: [
      { href: '/categories', label: 'Browse by Category' },
      { href: '/best', label: "Editor's Picks" },
      { href: '/seasonal', label: 'Seasonal Guides' },
      { href: '/compare', label: 'Compare Farms' },
    ],
  },
  {
    title: 'Local Discovery',
    persona: 'Weekend Explorer + Local Champion',
    description: 'Where day-trippers and community advocates converge',
    overlap: true,
    links: [
      { href: '/counties', label: 'Browse by County' },
      { href: '/map', label: 'Find Near Me' },
      { href: '/shop', label: 'Farm Directory' },
    ],
  },
  {
    title: 'List Your Farm',
    persona: 'Farm Shop Owner',
    description: 'Get found by thousands of local food lovers',
    overlap: false,
    links: [
      { href: '/add', label: 'Add Your Listing' },
      { href: '/claim', label: 'Claim Your Shop' },
      { href: '/contact', label: 'Get in Touch' },
    ],
  },
  {
    title: 'About',
    persona: 'Newcomer',
    description: 'Learn about Farm Companion',
    overlap: false,
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
] as const

export default function SitemapPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-background">
      {/* Header */}
      <section className="bg-[#FDF8F3] dark:bg-background-secondary border-b border-border">
        <div className="mx-auto max-w-[960px] px-3 md:px-6 py-12 md:py-20">
          <h1 className="text-[32px] md:text-[48px] font-medium leading-[1.2] tracking-tight text-[#1A1A1A] dark:text-foreground">
            Sitemap
          </h1>
          <p className="mt-3 md:mt-4 text-[17px] md:text-[20px] leading-[1.5] text-[#5C5C5C] dark:text-foreground-muted max-w-[600px]">
            Every page on Farm Companion, organised by how people actually use the site.
          </p>
          <p className="mt-6 text-[13px] tracking-[0.05em] text-[#5C5C5C]/60 dark:text-foreground-muted/40">
            Built around 6 personas &middot; 2 shared journeys marked below
          </p>
        </div>
      </section>

      {/* Sitemap Grid */}
      <section className="mx-auto max-w-[960px] px-3 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {sitemapSections.map((section) => (
            <div
              key={section.title}
              className={`rounded-[12px] p-5 md:p-6 ${
                section.overlap
                  ? 'bg-[#2D5016]/[0.03] border-2 border-[#2D5016]/15 dark:bg-[#2D5016]/[0.06] dark:border-[#2D5016]/20'
                  : 'bg-[#FAFAF8] border border-border dark:bg-background-secondary dark:border-border'
              }`}
            >
              {/* Section header */}
              <div className="mb-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[18px] md:text-[20px] font-medium leading-[1.3] text-[#1A1A1A] dark:text-foreground">
                    {section.title}
                  </h2>
                  {section.overlap && (
                    <span className="shrink-0 mt-0.5 text-[11px] tracking-[0.05em] uppercase font-medium text-[#2D5016]/60 dark:text-[#6B9F4A] bg-[#2D5016]/[0.08] dark:bg-[#2D5016]/20 px-2 py-0.5 rounded-full">
                      Shared
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-[#5C5C5C]/70 dark:text-foreground-muted/50">
                  {section.persona}
                </p>
                <p className="mt-1 text-[14px] leading-[1.5] text-[#5C5C5C] dark:text-foreground-muted">
                  {section.description}
                </p>
              </div>

              {/* Links */}
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-[15px] text-[#1A1A1A] dark:text-foreground hover:text-[#2D5016] dark:hover:text-secondary transition-colors"
                    >
                      <span className="text-[#2D5016]/40 dark:text-secondary/40 group-hover:text-[#2D5016] dark:group-hover:text-secondary transition-colors" aria-hidden="true">&rarr;</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-10 md:mt-14 pt-8 border-t border-border">
          <h3 className="text-[14px] font-medium tracking-[0.05em] uppercase text-[#5C5C5C] dark:text-foreground-muted mb-4">
            How to read this sitemap
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-[640px]">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-4 h-4 rounded-[4px] border border-border bg-[#FAFAF8] dark:bg-background-secondary shrink-0" />
              <div>
                <p className="text-[14px] font-medium text-[#1A1A1A] dark:text-foreground">Single persona</p>
                <p className="text-[13px] text-[#5C5C5C] dark:text-foreground-muted">Pages that serve one core user type.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-4 h-4 rounded-[4px] border-2 border-[#2D5016]/15 bg-[#2D5016]/[0.03] dark:border-[#2D5016]/20 dark:bg-[#2D5016]/[0.06] shrink-0" />
              <div>
                <p className="text-[14px] font-medium text-[#1A1A1A] dark:text-foreground">Shared journey</p>
                <p className="text-[13px] text-[#5C5C5C] dark:text-foreground-muted">Where two personas overlap in their goals.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Persona Summary */}
        <div className="mt-10 md:mt-14 pt-8 border-t border-border">
          <h3 className="text-[14px] font-medium tracking-[0.05em] uppercase text-[#5C5C5C] dark:text-foreground-muted mb-6">
            The 6 personas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {[
              {
                name: 'Weekend Explorer',
                goal: 'Families looking for farm shop day trips and experiences.',
              },
              {
                name: 'Seasonal Planner',
                goal: 'Organised shoppers who plan around seasonal availability.',
              },
              {
                name: 'Home Chef',
                goal: 'Cooks seeking quality ingredients and specialty produce.',
                overlap: 'Overlaps with Conscious Shopper',
              },
              {
                name: 'Conscious Shopper',
                goal: 'Sustainability-minded buyers choosing local over supermarket.',
                overlap: 'Overlaps with Home Chef',
              },
              {
                name: 'Local Champion',
                goal: 'Community members who discover and share nearby farm shops.',
                overlap: 'Overlaps with Weekend Explorer',
              },
              {
                name: 'Farm Shop Owner',
                goal: 'Business owners managing their online presence.',
              },
            ].map((persona) => (
              <div key={persona.name}>
                <p className="text-[15px] font-medium text-[#1A1A1A] dark:text-foreground">
                  {persona.name}
                </p>
                <p className="mt-0.5 text-[14px] leading-[1.5] text-[#5C5C5C] dark:text-foreground-muted">
                  {persona.goal}
                </p>
                {'overlap' in persona && persona.overlap && (
                  <p className="mt-1 text-[12px] text-[#2D5016]/60 dark:text-[#6B9F4A]/60">
                    {persona.overlap}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
