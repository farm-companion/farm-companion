/**
 * Privacy Policy Page
 *
 * Luxury editorial design matching the Best Farm Guides aesthetic.
 * Narrow text columns, serif headings, vertical line accents.
 *
 * WCAG AA Compliant: Uses semantic color system for dark/light mode support.
 */

'use client'

import Link from 'next/link'

const EFFECTIVE_DATE = '22 August 2025'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background-secondary">
      {/* Editorial Header */}
      <header className="pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-foreground tracking-tight">
            Privacy Policy
          </h1>

          <p className="mt-6 text-foreground-muted">
            We respect your privacy. This notice explains what we collect, why, and your rights under UK GDPR.
          </p>

          <div className="w-px h-12 bg-border mx-auto mt-8" aria-hidden="true" />
        </div>
      </header>

      {/* Navigation */}
      <nav aria-label="On this page" className="max-w-2xl mx-auto px-6 mb-16">
        <div className="py-6 border-t border-b border-border">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              { href: '#who-we-are', label: 'Who we are' },
              { href: '#what-we-collect', label: 'What we collect' },
              { href: '#how-we-use', label: 'How we use' },
              { href: '#lawful-bases', label: 'Lawful bases' },
              { href: '#sharing', label: 'Sharing' },
              { href: '#cookies', label: 'Cookies' },
              { href: '#transfers', label: 'Transfers' },
              { href: '#security', label: 'Security' },
              { href: '#retention', label: 'Retention' },
              { href: '#your-rights', label: 'Your rights' },
              { href: '#contact', label: 'Contact' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs tracking-[0.1em] uppercase text-foreground-muted hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 pb-24">
        <section id="who-we-are" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Who We Are
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            Farm Companion helps people find farm shops across the UK. For this site, we act as the
            data controller. Contact:{' '}
            <a
              href="mailto:hello@farmcompanion.co.uk"
              className="border-b border-foreground hover:opacity-70 transition-opacity"
            >
              hello@farmcompanion.co.uk
            </a>
          </p>
        </section>

        <section id="what-we-collect" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            What We Collect
          </h2>
          <div className="space-y-6 text-lg leading-[1.9] text-foreground">
            <div>
              <span className="font-medium">Essential data</span> (strictly necessary): server and application logs, error diagnostics, basic security telemetry including IP address, user-agent, and timestamps.
            </div>
            <div>
              <span className="font-medium">Consent-based data</span> (optional): if you accept cookies, we may load analytics which can use cookies and SDKs.
            </div>
            <div>
              <span className="font-medium">Shop submissions</span> (you provide): shop name, address, contact details, links, and any photos or text you upload.
            </div>
            <div>
              <span className="font-medium">Communications</span>: emails you send us and our replies.
            </div>
          </div>
          <p className="mt-6 text-foreground-muted text-sm">
            We do not intentionally collect sensitive categories of personal data.
          </p>
        </section>

        <section id="how-we-use" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            How We Use Your Data
          </h2>
          <div className="space-y-4 text-lg leading-[1.9] text-foreground">
            <p>Operate, secure, and improve the site including debugging, uptime monitoring, and fraud prevention.</p>
            <p>Measure basic usage through analytics if you consent.</p>
            <p>Publish and moderate shop listings you submit.</p>
            <p>Respond to enquiries and provide support.</p>
            <p>Comply with legal obligations.</p>
          </div>
        </section>

        <section id="lawful-bases" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Lawful Bases (UK GDPR)
          </h2>
          <div className="space-y-6 text-lg leading-[1.9] text-foreground">
            <div>
              <span className="font-medium">Legitimate interests</span>: site security, debugging, preventing abuse.
            </div>
            <div>
              <span className="font-medium">Consent</span>: analytics, advertising cookies, and any optional tracking.
            </div>
            <div>
              <span className="font-medium">Contract</span>: processing necessary to publish and manage your submitted listings.
            </div>
            <div>
              <span className="font-medium">Legal obligation</span>: records we must keep by law.
            </div>
          </div>
        </section>

        <section id="sharing" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Sharing Your Data
          </h2>
          <p className="text-lg leading-[1.9] text-foreground mb-6">
            We share limited data with service providers (processors) who help us run the site, under data-processing agreements.
          </p>
          <div className="space-y-4 text-lg leading-[1.9] text-foreground">
            <p>Hosting and infrastructure to serve the website and store logs.</p>
            <p>Map and tiles services to render maps and locate you if you opt in.</p>
            <p>Analytics and advertising loaded only with your consent.</p>
            <p>Email and support tooling to respond to enquiries.</p>
          </div>
          <p className="mt-6 text-foreground-muted text-sm">
            We do not sell your personal data. If we are required to disclose data by law, we will do so.
          </p>
        </section>

        <section id="cookies" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Cookies & Consent
          </h2>
          <p className="text-lg leading-[1.9] text-foreground mb-6">
            We ask for your consent before loading non-essential cookies for analytics and advertising. You can change your choice at any time.
          </p>
          <button
            onClick={() => (window as any).showCookiePreferences?.()}
            className="text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
            aria-label="Manage cookie preferences"
          >
            Manage Cookies
          </button>
          <p className="mt-6 text-foreground-muted text-sm">
            If you do not consent, analytics and advertising will not load.
          </p>
        </section>

        <section id="transfers" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            International Transfers
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            Where data is transferred outside the UK or EEA, we rely on appropriate safeguards such as UK Addendum or EU Standard Contractual Clauses, or an adequacy decision, as applicable.
          </p>
        </section>

        <section id="security" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Security
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            We apply reasonable technical and organisational measures including access controls, least-privilege principles, encryption in transit, and monitoring. No internet service can be 100% secure.
          </p>
        </section>

        <section id="retention" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Data Retention
          </h2>
          <p className="text-lg leading-[1.9] text-foreground mb-8">
            We keep data only as long as necessary for the purposes described above.
          </p>

          <div className="space-y-6">
            <div className="py-4 border-t border-border">
              <div className="text-xs tracking-[0.15em] uppercase text-foreground-muted mb-2">
                Server & Application Logs
              </div>
              <p className="text-foreground">
                Up to 30 to 90 days rolling, unless required for security investigations
              </p>
            </div>

            <div className="py-4 border-t border-border">
              <div className="text-xs tracking-[0.15em] uppercase text-foreground-muted mb-2">
                Shop Submissions
              </div>
              <p className="text-foreground">
                For as long as the listing is live; archived for moderation and audit as needed
              </p>
            </div>

            <div className="py-4 border-t border-border">
              <div className="text-xs tracking-[0.15em] uppercase text-foreground-muted mb-2">
                Support Emails
              </div>
              <p className="text-foreground">
                Up to 24 months
              </p>
            </div>

            <div className="py-4 border-t border-b border-border">
              <div className="text-xs tracking-[0.15em] uppercase text-foreground-muted mb-2">
                Consent Records
              </div>
              <p className="text-foreground">
                As required to demonstrate compliance
              </p>
            </div>
          </div>
        </section>

        <section id="your-rights" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Your Rights
          </h2>
          <p className="text-lg leading-[1.9] text-foreground mb-4">
            Under UK GDPR you can request access, correction, deletion, restriction, portability, and object to certain processing. Where we rely on consent, you can withdraw it at any time, though this will not affect prior processing.
          </p>
          <p className="text-foreground-muted text-sm">
            You also have the right to complain to the Information Commissioner&apos;s Office (ICO) at{' '}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-foreground-muted hover:opacity-70 transition-opacity"
            >
              ico.org.uk
            </a>
          </p>
        </section>

        <section id="contact" className="mb-16 scroll-mt-24">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Contact
          </h2>
          <p className="text-lg leading-[1.9] text-foreground">
            To exercise your rights or ask questions, email{' '}
            <a
              href="mailto:hello@farmcompanion.co.uk"
              className="border-b border-foreground hover:opacity-70 transition-opacity"
            >
              hello@farmcompanion.co.uk
            </a>
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-border">
          <p className="text-xs tracking-[0.1em] uppercase text-foreground-muted">
            Effective date: {EFFECTIVE_DATE}
          </p>
          <p className="mt-2 text-foreground-muted text-sm">
            We may update this notice; material changes will be posted here.
          </p>

          <div className="w-16 h-px bg-border mt-8" aria-hidden="true" />
        </footer>
      </div>
    </main>
  )
}
