'use client'

import React, { useState } from 'react'

interface NewsletterSignupProps {
  className?: string
  source?: string
}

interface FormData {
  email: string
  name: string
  honeypot: string
  consent: boolean
}

interface FormState {
  isLoading: boolean
  isSuccess: boolean
  error: string | null
}

export default function NewsletterSignup({ className = '', source = 'homepage' }: NewsletterSignupProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    honeypot: '',
    consent: false
  })

  const [formState, setFormState] = useState<FormState>({
    isLoading: false,
    isSuccess: false,
    error: null
  })

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    }))

    // Clear error when user starts typing
    if (formState.error) {
      setFormState(prev => ({ ...prev, error: null }))
    }
  }

  const validateForm = (): string | null => {
    if (!formData.email) return 'Email address is required'
    if (!formData.name.trim()) return 'Name is required'
    if (!formData.consent) return 'Please agree to receive emails'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address'
    }

    // Honeypot check
    if (formData.honeypot) {
      return 'Invalid submission'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setFormState(prev => ({ ...prev, error: validationError }))
      return
    }

    setFormState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim(),
          honeypot: formData.honeypot,
          source,
          consent: formData.consent
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed')
      }

      setFormState(prev => ({ ...prev, isLoading: false, isSuccess: true }))

      // Reset form
      setFormData({
        email: '',
        name: '',
        honeypot: '',
        consent: false
      })

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setFormState(prev => ({ ...prev, isSuccess: false }))
      }, 5000)

    } catch (error) {
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Subscription failed. Please try again.'
      }))
    }
  }

  if (formState.isSuccess) {
    return (
      <div className={`text-center ${className}`}>
        <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />
        <p className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-6">
          Thank You
        </p>
        <h3 className="font-serif text-2xl md:text-3xl font-normal text-foreground mb-4">
          Welcome to Farm Companion
        </h3>
        <p className="text-lg leading-[1.9] text-foreground-muted">
          Check your email for a welcome message.
        </p>
        <div className="w-px h-12 bg-border mx-auto mt-8" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-px h-12 bg-border mx-auto mb-8" aria-hidden="true" />
        <p className="text-xs tracking-[0.2em] uppercase text-foreground-muted mb-6">
          Newsletter
        </p>
        <h2 className="font-serif text-3xl md:text-4xl font-normal leading-tight text-foreground mb-4">
          Stay Updated
        </h2>
        <p className="text-lg leading-[1.9] text-foreground-muted max-w-lg mx-auto">
          Seasonal updates, new farm shop discoveries, and curated guides delivered to your inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
        {/* Honeypot field - hidden from users but visible to bots */}
        <div className="absolute -left-[9999px] opacity-0 pointer-events-none">
          <input
            type="text"
            name="honeypot"
            value={formData.honeypot}
            onChange={handleInputChange('honeypot')}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Name Field */}
        <div>
          <label
            htmlFor="newsletter-name"
            className="block text-xs tracking-[0.15em] uppercase text-foreground-muted mb-3"
          >
            Your Name
          </label>
          <input
            id="newsletter-name"
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            className="w-full px-0 py-3 bg-transparent text-foreground text-lg border-0 border-b border-border placeholder:text-foreground-muted/50 focus:outline-none focus:border-foreground transition-colors"
            placeholder="Enter your name"
            required
            disabled={formState.isLoading}
          />
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="newsletter-email"
            className="block text-xs tracking-[0.15em] uppercase text-foreground-muted mb-3"
          >
            Email Address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            className="w-full px-0 py-3 bg-transparent text-foreground text-lg border-0 border-b border-border placeholder:text-foreground-muted/50 focus:outline-none focus:border-foreground transition-colors"
            placeholder="Enter your email"
            required
            disabled={formState.isLoading}
          />
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start gap-3 pt-2">
          <input
            id="newsletter-consent"
            type="checkbox"
            checked={formData.consent}
            onChange={handleInputChange('consent')}
            className="mt-0.5 h-4 w-4 accent-current text-foreground border-border"
            required
            disabled={formState.isLoading}
          />
          <label
            htmlFor="newsletter-consent"
            className="text-sm leading-relaxed text-foreground-muted"
          >
            I agree to receive email updates from Farm Companion. I can unsubscribe at any time.
          </label>
        </div>

        {/* Error Message */}
        {formState.error && (
          <div className="border-t border-b border-border py-4">
            <p className="text-sm text-foreground">{formState.error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formState.isLoading}
          className="inline-flex items-center justify-center gap-3 w-full py-4 text-xs tracking-[0.15em] uppercase bg-foreground text-background hover:opacity-80 transition-opacity duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {formState.isLoading ? (
            <span>Subscribing...</span>
          ) : (
            <span>Subscribe</span>
          )}
        </button>
      </form>

      <p className="text-xs tracking-[0.1em] text-foreground-muted text-center mt-8">
        We respect your privacy. Unsubscribe at any time.
      </p>

      <div className="w-16 h-px bg-border mx-auto mt-8" aria-hidden="true" />
    </div>
  )
}
