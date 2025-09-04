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
      <section className="relative overflow-hidden bg-gradient-to-br from-background-surface via-background-canvas to-background-surface">
        {/* Sophisticated animated background patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.04),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,255,79,0.03),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,31,35,0.02),transparent_70%)]" />
        
        {/* Floating accent elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-serum rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-32 right-20 w-1 h-1 bg-solar rounded-full opacity-40 animate-ping" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-serum rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          {/* Enhanced Hero Content */}
          <div className="text-center mb-16">
            {/* Enhanced typography with premium styling */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-text-heading mb-8 tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-text-heading via-serum to-text-heading bg-clip-text text-transparent">
                Share Your Feedback
              </span>
            </h1>
            
            {/* Enhanced description */}
            <p className="text-xl md:text-2xl text-text-muted mb-12 max-w-4xl mx-auto leading-relaxed">
              Have a question, suggestion, or need help? We&apos;d love to hear from you.
            </p>
            
            {/* Enhanced Action Buttons with premium styling */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href="#contact-form"
                className="group bg-gradient-to-r from-serum to-teal-500 text-black px-10 py-5 rounded-2xl font-bold text-lg hover:from-teal-500 hover:to-serum transition-all duration-300 inline-flex items-center justify-center gap-3 shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1"
              >
                Send Message
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#contact-info"
                className="group border-2 border-serum text-serum dark:text-serum px-10 py-5 rounded-2xl font-bold text-lg hover:bg-serum hover:text-black dark:hover:bg-serum dark:hover:text-black transition-all duration-300 inline-flex items-center justify-center gap-3 backdrop-blur-sm bg-background-surface/30 hover:shadow-xl transform hover:scale-105 hover:-translate-y-1"
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
