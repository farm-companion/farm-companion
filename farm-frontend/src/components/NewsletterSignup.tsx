'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { Mail } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { Loader2 } from 'lucide-react'

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
      console.warn('Bot detected via honeypot field')
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
      console.error('Newsletter subscription error:', error)
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Subscription failed. Please try again.'
      }))
    }
  }

  if (formState.isSuccess) {
    return (
      <div className={`text-center p-6 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
        <h3 className="text-heading font-semibold text-green-800 mb-2">
          Successfully Subscribed!
        </h3>
        <p className="text-green-700">
          Welcome to Farm Companion! Check your email for a welcome message.
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-background-surface rounded-lg p-6 sm:p-8 ${className}`}>
      <div className="text-center mb-6">
        <Mail className="w-8 h-8 text-brand-primary mx-auto mb-3" />
        <h2 className="text-display sm:text-display font-bold text-text-heading mb-2">
          Stay Updated
        </h2>
        <p className="text-text-muted">
          Get seasonal updates, new farm shop discoveries, and exclusive offers delivered to your inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="newsletter-name" className="block text-caption font-medium text-text-heading mb-2">
            Your Name *
          </label>
          <input
            id="newsletter-name"
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            className="w-full px-4 py-3 border border-border-default rounded-md bg-background-canvas text-text-body placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            placeholder="Enter your name"
            required
            disabled={formState.isLoading}
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="newsletter-email" className="block text-caption font-medium text-text-heading mb-2">
            Email Address *
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            className="w-full px-4 py-3 border border-border-default rounded-md bg-background-canvas text-text-body placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            placeholder="Enter your email"
            required
            disabled={formState.isLoading}
          />
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start space-x-3">
          <input
            id="newsletter-consent"
            type="checkbox"
            checked={formData.consent}
            onChange={handleInputChange('consent')}
            className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-border-default rounded"
            required
            disabled={formState.isLoading}
          />
          <label htmlFor="newsletter-consent" className="text-caption text-text-muted">
            I agree to receive email updates from Farm Companion. I can unsubscribe at any time.
            <span className="text-brand-danger ml-1" aria-hidden="true">*</span>
          </label>
        </div>

        {/* Error Message */}
        {formState.error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-caption text-red-700">{formState.error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={formState.isLoading}
        >
          {formState.isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Subscribing...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Subscribe to Newsletter
            </>
          )}
        </Button>
      </form>

      <p className="text-captionall text-text-muted mt-4 text-center">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  )
}
