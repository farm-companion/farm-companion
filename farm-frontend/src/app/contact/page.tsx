'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type ContactForm = {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({ name: '', email: '', subject: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  function onChange<K extends keyof ContactForm>(key: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setForm({ name: '', email: '', subject: '', message: '' })
        // Store feedback ID in localStorage for reference
        if (data.feedbackId) {
          localStorage.setItem('lastFeedbackId', data.feedbackId)
        }
      } else {
        console.error('Feedback submission error:', data)
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Feedback form error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-canvas">
      {/* Professional Header with Background Image */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/feedback.jpg"
            alt="Group discussion and feedback session with diverse perspectives"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Professional Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          {/* Subtle texture overlay for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Share Your
              <span className="block text-serum drop-shadow-lg">Feedback</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
              Have a question, suggestion, or need help? We&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact-form"
                className="bg-serum text-black px-8 py-4 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl backdrop-blur-sm"
              >
                Send Message
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
            <div id="contact-form" className="bg-background-surface rounded-lg shadow-sm border border-border-default p-6">
              <h2 className="text-2xl font-semibold text-text-heading mb-6">
                Send us a message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-body mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={form.name}
                    onChange={onChange('name')}
                    className="w-full rounded-lg border border-border-default px-4 py-3 text-sm bg-background-surface text-text-body
                             focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
                             placeholder-text-muted"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-body mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={form.email}
                    onChange={onChange('email')}
                    className="w-full rounded-lg border border-border-default px-4 py-3 text-sm bg-background-surface text-text-body
                             focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
                             placeholder-text-muted"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-text-body mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={form.subject}
                    onChange={onChange('subject')}
                    className="w-full rounded-lg border border-border-default px-4 py-3 text-sm bg-background-surface text-text-body
                             focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
                             placeholder-text-muted"
                    placeholder="What&apos;s this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text-body mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={onChange('message')}
                    className="w-full rounded-lg border border-border-default px-4 py-3 text-sm bg-background-surface text-text-body
                             focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
                             placeholder-text-muted"
                    placeholder="Tell us more..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  {isSubmitting ? 'Sending...' : 'Send feedback'}
                </button>

                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          Thank you! Your feedback has been submitted successfully. You&apos;ll receive a confirmation email shortly.
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          We typically respond within 24-48 hours during business days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          Sorry, there was an error sending your message. Please try again or email us directly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Contact Information */}
            <div id="contact-info" className="space-y-6">
              <div className="bg-background-surface rounded-lg shadow-sm border border-border-default p-6">
                <h2 className="text-2xl font-semibold text-text-heading mb-6">
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
