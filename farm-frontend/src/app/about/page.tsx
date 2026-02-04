/**
 * About Page - God-Tier Redesign
 *
 * 5-section narrative arc: Hero, Problem, How It Works, Trust, CTA.
 * Optional collapsed FAQ at the bottom.
 * WCAG AA compliant with semantic color system for dark/light mode.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About Farm Companion | UK Farm Shops Directory',
  description:
    'We built the farm shop guide we wished existed. 1,247 farms across every county, no sponsored rankings, no clutter. Learn how Farm Companion helps you find farm shops worth the drive.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'About Farm Companion | UK Farm Shops Directory',
    description:
      'We built the farm shop guide we wished existed. 1,247 farms, every county, no sponsored rankings.',
    url: `${SITE_URL}/about`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/about.jpg`,
        width: 1200,
        height: 630,
        alt: 'About Farm Companion - UK farm shops directory',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Farm Companion | UK Farm Shops Directory',
    description:
      'We built the farm shop guide we wished existed. 1,247 farms, every county, no sponsored rankings.',
    images: [`${SITE_URL}/about.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

const stats = [
  { number: '1,247', label: 'farms listed' },
  { number: '121', label: 'counties covered' },
  { number: '847', label: 'owner-confirmed' },
  { number: 'Weekly', label: 'updates' },
] as const

const verificationLevels = [
  {
    icon: '\u25CF',
    label: 'Owner-confirmed',
    description: 'The owner reviewed and approved the details.',
  },
  {
    icon: '\u25CB',
    label: 'Publicly verified',
    description: 'Cross-checked against two or more reputable sources.',
  },
  {
    icon: '\u25D0',
    label: 'Under review',
    description: 'Basic info available while we confirm the rest.',
  },
] as const

const faqItems = [
  {
    question: 'Is Farm Companion free?',
    answer:
      "Yes. Browsing is free. Adding a listing is free. We'll never charge you to search.",
  },
  {
    question: 'How do I add my farm shop?',
    answer:
      "Use the \"Add Your Listing\" link in the footer. You'll need your address, opening hours, and what you sell. Verification usually takes 2-3 days.",
  },
  {
    question: 'How do you make money?',
    answer:
      "Light advertising (only after consent) and optional premium listings for farms that want extra visibility. We don't sell data or take commissions on sales.",
  },
] as const

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* ─── Section 1: Hero ─── */}
      <section
        className="bg-[#FDF8F3] dark:bg-background-secondary"
        aria-labelledby="hero-heading"
      >
        <div className="mx-auto max-w-3xl px-3 md:px-6 py-10 md:py-16 text-center">
          <h1
            id="hero-heading"
            className="text-[32px] md:text-[48px] font-medium leading-[1.2] tracking-tight text-[#1A1A1A] dark:text-foreground"
          >
            We built the farm shop guide
            <br className="hidden sm:block" />
            {' '}we wished existed.
          </h1>

          <p className="mt-4 md:mt-6 text-[17px] md:text-[20px] font-normal leading-[1.5] text-[#5C5C5C] dark:text-foreground-muted">
            1,247 farms. Every county. No sponsored rankings. No clutter.
            <br className="hidden sm:block" />
            {' '}Just the good ones.
          </p>
        </div>
      </section>

      {/* ─── Section 2: The Problem ─── */}
      <section
        className="bg-white dark:bg-background"
        aria-labelledby="problem-heading"
      >
        <div className="mx-auto max-w-[680px] px-3 md:px-6 py-8 md:py-10">
          <h2
            id="problem-heading"
            className="text-[24px] md:text-[32px] font-medium leading-[1.3] text-[#1A1A1A] dark:text-foreground mb-4 md:mb-6"
          >
            Finding a farm shop shouldn&apos;t be this hard.
          </h2>

          <div className="space-y-4 md:space-y-6 text-[16px] md:text-[18px] font-normal leading-[1.7] text-[#3D3D3D] dark:text-foreground-secondary">
            <p>
              You search &ldquo;farm shops near me&rdquo; and get a mix of
              garden centres, farm attractions, and places that closed three
              years ago. The big directories bury independent farms under
              sponsored listings. Google reviews tell you the parking is easy,
              not whether the beef is worth the drive.
            </p>

            <p>
              We got tired of it. So we started mapping them ourselves.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Section 3: How It Works ─── */}
      <section
        className="bg-[#FDF8F3] dark:bg-background-secondary"
        aria-labelledby="approach-heading"
      >
        <div className="mx-auto max-w-[720px] px-3 md:px-6 py-8 md:py-10">
          <h2
            id="approach-heading"
            className="text-[24px] md:text-[32px] font-medium leading-[1.3] text-[#1A1A1A] dark:text-foreground mb-4 md:mb-8"
          >
            How it works
          </h2>

          <div className="space-y-3 md:space-y-3">
            {/* Card 1: Verification */}
            <div className="bg-white dark:bg-card rounded-[12px] p-3 md:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none dark:border dark:border-border">
              <h3 className="text-[20px] md:text-[24px] font-medium leading-[1.3] text-[#1A1A1A] dark:text-foreground mb-2 md:mb-3">
                We verify every listing.
              </h3>
              <p className="text-[16px] md:text-[17px] font-normal leading-[1.7] text-[#3D3D3D] dark:text-foreground-secondary">
                Not scraped from a database. We check opening hours, confirm
                they&apos;re actually selling farm produce, and mark anything we
                can&apos;t verify. 847 farms are owner-confirmed. The rest are
                cross-checked against at least two public sources.
              </p>
            </div>

            {/* Card 2: Rankings */}
            <div className="bg-white dark:bg-card rounded-[12px] p-3 md:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none dark:border dark:border-border">
              <h3 className="text-[20px] md:text-[24px] font-medium leading-[1.3] text-[#1A1A1A] dark:text-foreground mb-2 md:mb-3">
                We don&apos;t take money for rankings.
              </h3>
              <p className="text-[16px] md:text-[17px] font-normal leading-[1.7] text-[#3D3D3D] dark:text-foreground-secondary">
                Your position on the map is based on your location, not your
                advertising budget. Premium listings get a small badge.
                That&apos;s it. The best butcher in your county won&apos;t be
                buried because they didn&apos;t pay for promotion.
              </p>
            </div>

            {/* Card 3: Seasonal */}
            <div className="bg-white dark:bg-card rounded-[12px] p-3 md:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none dark:border dark:border-border">
              <h3 className="text-[20px] md:text-[24px] font-medium leading-[1.3] text-[#1A1A1A] dark:text-foreground mb-2 md:mb-3">
                We show you what&apos;s in season.
              </h3>
              <p className="text-[16px] md:text-[17px] font-normal leading-[1.7] text-[#3D3D3D] dark:text-foreground-secondary">
                February means forced rhubarb from Yorkshire, purple sprouting
                broccoli, and the last of the blood oranges. We tell you
                what&apos;s worth seeking out right now -- and which farms have
                it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Trust / The Numbers ─── */}
      <section
        className="bg-white dark:bg-background"
        aria-labelledby="trust-heading"
      >
        <div className="mx-auto max-w-[720px] px-3 md:px-6 py-8 md:py-10">
          <h2
            id="trust-heading"
            className="text-[24px] md:text-[32px] font-medium leading-[1.3] text-[#1A1A1A] dark:text-foreground mb-6 md:mb-8"
          >
            The numbers
          </h2>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[36px] md:text-[48px] font-semibold leading-[1.1] text-[#2D5016] dark:text-secondary">
                  {stat.number}
                </div>
                <div className="text-[14px] md:text-[15px] font-normal text-[#5C5C5C] dark:text-foreground-muted mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <hr className="border-border mb-6 md:mb-8" />

          {/* Verification explainer */}
          <h3 className="text-[18px] md:text-[20px] font-medium text-[#1A1A1A] dark:text-foreground mb-4 md:mb-6">
            How we verify listings
          </h3>

          <ul className="space-y-3 md:space-y-4" role="list">
            {verificationLevels.map((level) => (
              <li key={level.label} className="flex items-start gap-3">
                <span
                  className="text-[18px] leading-[1.5] text-[#1A1A1A] dark:text-foreground select-none flex-shrink-0 mt-px"
                  aria-hidden="true"
                >
                  {level.icon}
                </span>
                <div>
                  <span className="text-[15px] md:text-[16px] font-medium text-[#1A1A1A] dark:text-foreground">
                    {level.label}
                  </span>
                  <span className="text-[15px] md:text-[16px] font-normal text-[#5C5C5C] dark:text-foreground-muted">
                    {' '}&mdash; {level.description}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[14px] md:text-[15px] font-normal text-[#5C5C5C] dark:text-foreground-muted">
            See something wrong? Every listing has a &ldquo;Suggest an
            edit&rdquo; link.
          </p>
        </div>
      </section>

      {/* ─── Section 5: CTA ─── */}
      <section
        className="bg-[#2D5016] dark:bg-[#1a3a0a]"
        aria-labelledby="cta-heading"
      >
        <div className="mx-auto max-w-3xl px-3 md:px-6 py-8 md:py-10 text-center">
          <h2
            id="cta-heading"
            className="text-[28px] md:text-[36px] font-medium leading-[1.2] text-white mb-6 md:mb-8"
          >
            Find a farm shop worth the drive.
          </h2>

          <Link
            href="/map"
            className="inline-block bg-white text-[#2D5016] text-[16px] font-medium px-4 py-2 rounded-md hover:bg-[#F5F5F5] transition-colors duration-base w-full sm:w-auto"
          >
            Open the map &rarr;
          </Link>

          <p className="mt-4 md:mt-6">
            <Link
              href="/seasonal"
              className="text-[15px] md:text-[16px] font-normal text-white/80 hover:text-white hover:underline transition-colors duration-base"
            >
              or browse what&apos;s in season this month
            </Link>
          </p>
        </div>
      </section>

      {/* ─── Optional: FAQ (collapsed) ─── */}
      <section
        className="bg-white dark:bg-background"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-[680px] px-3 md:px-6 py-8 md:py-10">
          <h2
            id="faq-heading"
            className="text-[24px] md:text-[32px] font-medium leading-[1.3] text-[#1A1A1A] dark:text-foreground mb-4 md:mb-6"
          >
            Questions
          </h2>

          <div className="space-y-2">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group border border-border rounded-md"
              >
                <summary className="flex items-center justify-between cursor-pointer px-3 md:px-4 py-3 text-[15px] md:text-[16px] font-medium text-[#1A1A1A] dark:text-foreground select-none list-none [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span
                    className="ml-3 text-[#5C5C5C] dark:text-foreground-muted transition-transform duration-base group-open:rotate-45 flex-shrink-0"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <div className="px-3 md:px-4 pb-3 md:pb-4 text-[15px] md:text-[16px] font-normal leading-[1.7] text-[#3D3D3D] dark:text-foreground-secondary">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
