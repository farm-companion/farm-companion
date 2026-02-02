/**
 * Terms of Service Page
 *
 * Luxury editorial design matching the Best Farm Guides aesthetic.
 * Narrow text columns, serif headings, vertical line accents.
 *
 * WCAG AA Compliant: Uses semantic color system for dark/light mode support.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms of Service | Farm Companion',
  description: 'Terms of service for Farm Companion. Learn about the terms and conditions for using our UK farm shops directory and seasonal produce guide.',
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  openGraph: {
    title: 'Terms of Service | Farm Companion',
    description: 'Terms of service for Farm Companion. Learn about the terms and conditions for using our UK farm shops directory.',
    url: `${SITE_URL}/terms`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Terms of Service - Farm Companion',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Farm Companion',
    description: 'Terms of service for Farm Companion. Learn about the terms and conditions for using our UK farm shops directory.',
    images: [`${SITE_URL}/og.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background-secondary">
      {/* Editorial Header */}
      <header className="pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-foreground tracking-tight">
            Terms of Service
          </h1>

          <p className="mt-6 text-foreground-muted">
            These terms govern your use of Farm Companion. By using the site, you agree to them.
          </p>

          <div className="w-px h-12 bg-border mx-auto mt-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 pb-24">
        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Who We Are
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            Farm Companion is a UK directory helping people find farm shops. Contact us at{' '}
            <a
              href="mailto:hello@farmcompanion.co.uk"
              className="border-b border-foreground hover:opacity-70 transition-opacity"
            >
              hello@farmcompanion.co.uk
            </a>
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Use of the Site
          </h2>
          <div className="space-y-4 text-lg leading-[1.9] text-foreground">
            <p>Do not misuse the site, attempt unauthorised access, or disrupt services.</p>
            <p>You may link to our pages provided you do so fairly and lawfully.</p>
            <p>We may update or remove content and features without notice.</p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Accuracy of Information
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            We aim for accuracy but do not guarantee that listings, opening hours, or seasonality data
            are complete, current, or error-free. Always check directly with the farm shop before travelling.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            User Submissions
          </h2>
          <div className="space-y-4 text-lg leading-[1.9] text-foreground">
            <p>
              If you submit or claim a listing, you represent that the information is accurate and that
              you have the right to share it. You grant us a worldwide, non-exclusive, royalty-free licence
              to host, display, and adapt the submission for the purpose of operating the directory.
            </p>
            <p>
              We may edit, moderate, or remove submissions that are inaccurate, unlawful, or abusive.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Third-Party Links & Advertising
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            The site may display third-party links. We do not endorse or control third-party sites
            or products and are not responsible for their content or policies.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Privacy
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            See our{' '}
            <Link
              href="/privacy"
              className="border-b border-foreground hover:opacity-70 transition-opacity"
            >
              Privacy Policy
            </Link>
            {' '}for how we handle personal data and cookies.
            Non-essential tools, including advertising, load only after consent.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Availability
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            We try to keep the service available and fast. However, we do not guarantee uninterrupted access and
            may suspend or limit features for maintenance or security.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Liability
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            To the fullest extent permitted by law, we exclude all implied warranties and are not liable for any
            loss or damage arising from use of the site, except where caused by our fraud or wilful misconduct.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Governing Law
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            These terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-border">
          <p className="text-xs tracking-[0.1em] uppercase text-foreground-muted">
            Effective date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div className="w-16 h-px bg-border mt-8" aria-hidden="true" />
        </footer>
      </div>
    </main>
  )
}
