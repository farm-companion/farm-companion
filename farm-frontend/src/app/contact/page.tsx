'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Mail, AlertTriangle, Building2, Clock } from 'lucide-react'
import ContactForm from '@/components/forms/ContactForm'

export default function ContactPage() {
  const enabled = process.env.NEXT_PUBLIC_CONTACT_FORM_ENABLED === 'true'

  return (
    <main className="min-h-screen bg-background-canvas">
      {/* Professional Hero Section with Contact Page Image */}
      <section data-header-invert className="relative h-[80vh] min-h-[700px] max-h-[900px] overflow-hidden">
        {/* Background Image with Professional Handling */}
        <div className="absolute inset-0">
          <Image
            src="/feedback.jpg"
            alt="Beautiful farm landscape - Contact Farm Companion for support and feedback"
            fill
            className="object-cover object-center"
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
          {/* Professional Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          {/* Subtle texture overlay for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>

        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-center pt-20 pb-20">
          <div className="text-center max-w-4xl mx-auto px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Share Your
              <span className="block text-serum drop-shadow-lg">Feedback</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Have a question, suggestion, or need help? We&apos;d love to hear from you.
            </p>
            <p className="text-lg text-white/80 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Get in touch with our team for support, feedback, or to report any issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact-form"
                className="group bg-serum text-black px-8 py-4 rounded-xl font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl shadow-serum/25 hover:shadow-2xl hover:shadow-serum/30 hover:bg-serum/90 active:scale-[0.98]"
              >
                Send Message
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#contact-info"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl active:scale-[0.98]"
              >
                Contact Info
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <div id="contact-form" className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl shadow-2xl border border-border-default/30 p-8 transition-shadow duration-300 hover:shadow-3xl">
            <h2 className="text-2xl font-heading font-semibold text-text-heading mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-serum rounded-full" />
              Send us a message
            </h2>

            {enabled ? (
              <ContactForm />
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700/50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.1),transparent_50%)]" />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Form temporarily unavailable
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Please email us directly at{' '}
                      <a
                        className="font-medium underline underline-offset-2 transition-colors hover:text-amber-600"
                        href={`mailto:${process.env.CONTACT_TO_EMAIL || 'support@farmcompanion.co.uk'}`}
                      >
                        {process.env.CONTACT_TO_EMAIL || 'support@farmcompanion.co.uk'}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div id="contact-info" className="space-y-6">
            <div className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl shadow-2xl border border-border-default/30 p-8 transition-all duration-300 hover:shadow-3xl">
              <h2 className="text-2xl font-heading font-semibold text-text-heading mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-serum rounded-full" />
                Other ways to reach us
              </h2>

              <div className="space-y-5">
                {/* Email */}
                <div className="group flex items-start gap-4 rounded-2xl p-4 -mx-4 transition-all duration-200 hover:bg-brand-primary/5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 transition-colors group-hover:bg-brand-primary/20">
                    <Mail className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-heading mb-1">Email</h3>
                    <a
                      href="mailto:hello@farmcompanion.co.uk"
                      className="text-brand-primary font-medium transition-colors hover:text-brand-primary/80"
                    >
                      hello@farmcompanion.co.uk
                    </a>
                  </div>
                </div>

                {/* Report Issues */}
                <div className="group flex items-start gap-4 rounded-2xl p-4 -mx-4 transition-all duration-200 hover:bg-red-500/5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 transition-colors group-hover:bg-red-200 dark:bg-red-900/30 dark:group-hover:bg-red-900/50">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-heading mb-1">Report Issues</h3>
                    <p className="text-sm text-text-muted mb-2">
                      Found an error in our data or have a technical issue?
                    </p>
                    <a
                      href="https://github.com/farm-companion/farm-frontend/issues/new?title=Issue%20Report&labels=bug&template=bug_report.yml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Report on GitHub
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Farm Shop Owners */}
                <div className="group flex items-start gap-4 rounded-2xl p-4 -mx-4 transition-all duration-200 hover:bg-midnight/5 dark:hover:bg-sandstone/5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-midnight/10 transition-colors group-hover:bg-midnight/20 dark:bg-sandstone/10 dark:group-hover:bg-sandstone/20">
                    <Building2 className="h-5 w-5 text-midnight dark:text-sandstone" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-heading mb-1">Farm Shop Owners</h3>
                    <p className="text-sm text-text-muted mb-2">
                      Need to update your listing or claim ownership?
                    </p>
                    <Link
                      href="/claim"
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary/80"
                    >
                      Claim Your Listing
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time Card */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 via-brand-primary/10 to-solar/5 p-6 transition-all duration-300 hover:border-brand-primary/30 hover:shadow-lg dark:from-brand-primary/10 dark:via-brand-primary/15 dark:to-solar/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(0,194,178,0.1),transparent_50%)]" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-primary/20">
                  <Clock className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-heading mb-1">Response Time</h3>
                  <p className="text-sm text-text-muted">
                    We typically respond within 24-48 hours during business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
