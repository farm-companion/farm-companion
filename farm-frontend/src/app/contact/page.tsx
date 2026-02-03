'use client'

import Link from 'next/link'
import ContactForm from '@/components/forms/ContactForm'

export default function ContactPage() {
  const enabled = process.env.NEXT_PUBLIC_CONTACT_FORM_ENABLED === 'true'

  return (
    <main className="min-h-screen bg-background-secondary">
      {/* Editorial Header */}
      <header className="pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-foreground tracking-tight">
            Get in Touch
          </h1>

          <p className="mt-6 text-foreground-muted">
            Have a question, suggestion, or need help? We would love to hear from you.
          </p>

          <div className="w-px h-12 bg-border mx-auto mt-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content */}
      <div id="content" className="max-w-2xl mx-auto px-6 pb-24">
        {/* Contact Form Section */}
        <section className="mb-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-4">
            Send a Message
          </h2>

          {enabled ? (
            <ContactForm />
          ) : (
            <div className="py-6 border-t border-border">
              <p className="text-lg leading-[1.9] text-foreground">
                The contact form is temporarily unavailable. Please email{' '}
                <a
                  className="border-b border-foreground hover:opacity-70 transition-opacity"
                  href={`mailto:${process.env.CONTACT_TO_EMAIL || 'support@farmcompanion.co.uk'}`}
                >
                  {process.env.CONTACT_TO_EMAIL || 'support@farmcompanion.co.uk'}
                </a>
                .
              </p>
            </div>
          )}
        </section>

        {/* Other Ways to Reach Us */}
        <section className="mb-16">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-center mb-12 text-foreground">
            Other Ways to Reach Us
          </h2>

          <div className="space-y-8">
            <div className="py-4 border-t border-border">
              <div className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
                Email
              </div>
              <p className="text-lg leading-[1.9] text-foreground">
                Write to us at{' '}
                <a
                  href="mailto:hello@farmcompanion.co.uk"
                  className="border-b border-foreground hover:opacity-70 transition-opacity"
                >
                  hello@farmcompanion.co.uk
                </a>
              </p>
            </div>

            <div className="py-4 border-t border-border">
              <div className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
                Report Issues
              </div>
              <p className="text-lg leading-[1.9] text-foreground mb-2">
                Found an error in our data or have a technical issue?
              </p>
              <a
                href="https://github.com/farm-companion/farm-frontend/issues/new?title=Issue%20Report&labels=bug&template=bug_report.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
              >
                Report on GitHub
              </a>
            </div>

            <div className="py-4 border-t border-b border-border">
              <div className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
                Farm Shop Owners
              </div>
              <p className="text-lg leading-[1.9] text-foreground mb-2">
                Need to update your listing or claim ownership?
              </p>
              <Link
                href="/claim"
                className="text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
              >
                Claim Your Listing
              </Link>
            </div>
          </div>
        </section>

        {/* Response Time */}
        <section className="mb-16">
          <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />

          <h2 className="font-serif text-2xl md:text-3xl font-normal text-center mb-6 text-foreground">
            Response Time
          </h2>

          <p className="text-lg leading-[1.9] text-foreground text-center">
            We typically respond within 24 to 48 hours during business days.
          </p>
        </section>

        {/* Footer CTA */}
        <section className="text-center">
          <div className="w-px h-12 bg-border mx-auto mb-12" aria-hidden="true" />

          <div className="space-y-6">
            <Link
              href="/map"
              className="inline-block text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
            >
              Find Farm Shops Near Me
            </Link>

            <div className="flex items-center justify-center gap-6">
              <span className="w-12 h-px bg-border" aria-hidden="true" />
              <span className="text-xs tracking-[0.1em] uppercase text-foreground-muted">or</span>
              <span className="w-12 h-px bg-border" aria-hidden="true" />
            </div>

            <Link
              href="/about"
              className="inline-block text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300"
            >
              Learn About Farm Companion
            </Link>
          </div>

          <div className="w-16 h-px bg-border mx-auto mt-16" aria-hidden="true" />
        </section>
      </div>
    </main>
  )
}
