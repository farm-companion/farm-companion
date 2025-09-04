'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import ContactForm from '@/components/forms/ContactForm'

export default function ContactPage() {
  const enabled = process.env.NEXT_PUBLIC_CONTACT_FORM_ENABLED === 'true'

  return (
    <div className="min-h-screen bg-background-canvas">
      {/* Enhanced Hero Section - PuredgeOS 3.0 Premium */}
      <section className="relative h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden">
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
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwCdABmX/9k="
          />
          {/* Professional Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          {/* Subtle texture overlay for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <ArrowRight className="w-10 h-10 text-white" />
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
                className="bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl backdrop-blur-sm"
              >
                Send Message
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#contact-info"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
              >
                Contact Info
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">


          <div className="grid gap-8 lg:grid-cols-2">
            {/* Contact Form */}
            <div id="contact-form" className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl shadow-2xl border border-border-default/30 p-8">
              <h2 className="text-2xl font-heading font-semibold text-text-heading mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-serum rounded-full"></span>
                Send us a message
              </h2>
              
              {enabled ? (
                <ContactForm />
              ) : (
                <div className="rounded-lg border p-4 bg-amber-50 text-amber-800 border-amber-200">
                  <p className="text-sm">
                    The contact form is temporarily unavailable. Please email{' '}
                    <a 
                      className="underline font-medium" 
                      href={`mailto:${process.env.CONTACT_TO_EMAIL || 'support@farmcompanion.co.uk'}`}
                    >
                      {process.env.CONTACT_TO_EMAIL || 'support@farmcompanion.co.uk'}
                    </a>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div id="contact-info" className="space-y-6">
              <div className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl shadow-2xl border border-border-default/30 p-8">
                <h2 className="text-2xl font-heading font-semibold text-text-heading mb-6 flex items-center gap-3">
                  <span className="w-2 h-2 bg-serum rounded-full"></span>
                  Other ways to reach us
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-text-heading mb-1">Email</h3>
                      <a 
                        href="mailto:hello@farmcompanion.co.uk" 
                        className="text-text-link hover:underline transition-colors"
                      >
                        hello@farmcompanion.co.uk
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-brand-accent/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-text-heading mb-1">Report Issues</h3>
                      <p className="text-sm text-text-muted mb-2">
                        Found an error in our data or have a technical issue?
                      </p>
                      <a 
                        href="https://github.com/farm-companion/farm-frontend/issues/new?title=Issue%20Report&labels=bug&template=bug_report.yml" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-text-link hover:underline text-sm transition-colors"
                      >
                        Report on GitHub →
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-midnight/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-midnight dark:text-sandstone" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-text-heading mb-1">Farm Shop Owners</h3>
                      <p className="text-sm text-text-muted mb-2">
                        Need to update your listing or claim ownership?
                      </p>
                      <Link 
                        href="/claim" 
                        className="text-text-link hover:underline text-sm transition-colors"
                      >
                        Claim Your Listing →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-brand-primary/10 to-brand-accent/5 dark:from-brand-primary/20 dark:to-brand-accent/10 rounded-lg border border-brand-primary/20 dark:border-brand-primary/30 p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-heading mb-1">Response Time</h3>
                    <p className="text-sm text-text-muted">
                      We typically respond within 24-48 hours during business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
