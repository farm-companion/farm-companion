'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FarmShop } from '@/types/farm'

interface ClaimFormProps {
  shop: FarmShop
}

interface ClaimData {
  shopId: string
  shopName: string
  shopSlug: string
  shopUrl: string
  shopAddress: string
  
  // Claimant details
  claimantName: string
  claimantRole: string
  claimantEmail: string
  claimantPhone: string
  
  // Claim details
  claimType: 'ownership' | 'management' | 'correction' | 'removal'
  corrections: string
  additionalInfo: string
  
  // Verification
  verificationMethod: 'email' | 'phone' | 'document'
  verificationDetails: string
  
  // Consent
  consent: boolean
}

export default function ClaimForm({ shop }: ClaimFormProps) {
  const [formData, setFormData] = useState<ClaimData>({
    shopId: shop.id,
    shopName: shop.name,
    shopSlug: shop.slug,
    shopUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/shop/${shop.slug}`,
    shopAddress: `${shop.location.address}, ${shop.location.county} ${shop.location.postcode}`,
    claimantName: '',
    claimantRole: '',
    claimantEmail: '',
    claimantPhone: '',
    claimType: 'ownership',
    corrections: '',
    additionalInfo: '',
    verificationMethod: 'email',
    verificationDetails: '',
    consent: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (field: keyof ClaimData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.consent) {
      setErrorMessage('You must consent to us contacting you about this claim.')
      return
    }

    if (!formData.claimantName || !formData.claimantEmail) {
      setErrorMessage('Please provide your name and email address.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        // Reset form
        setFormData(prev => ({
          ...prev,
          claimantName: '',
          claimantRole: '',
          claimantEmail: '',
          claimantPhone: '',
          corrections: '',
          additionalInfo: '',
          verificationDetails: '',
          consent: false
        }))
      } else {
        const errorText = await response.text()
        setErrorMessage(errorText || 'Failed to submit claim. Please try again.')
        setSubmitStatus('error')
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Claim Submitted Successfully!
            </h3>
            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>Thank you for your claim. We&apos;ll review your submission and contact you within 2-3 business days.</p>
              <p className="mt-2">You&apos;ll receive a confirmation email from hello@farmcompanion.co.uk shortly.</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link 
            href={`/shop/${shop.slug}`}
            className="text-sm font-medium text-green-800 hover:text-green-900 dark:text-green-200 dark:hover:text-green-100"
          >
            ← Back to {shop.name}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shop Information */}
      <div className="rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Shop Information</h3>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Name:</strong> {shop.name}</p>
          <p><strong>Address:</strong> {shop.location.address}, {shop.location.county} {shop.location.postcode}</p>
          <p><strong>URL:</strong> {formData.shopUrl}</p>
        </div>
      </div>

      {/* Claimant Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your Details</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="claimantName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name *
            </label>
            <input
              type="text"
              id="claimantName"
              required
              value={formData.claimantName}
              onChange={(e) => handleInputChange('claimantName', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#00C2B2] focus:outline-none focus:ring-1 focus:ring-[#00C2B2] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-[#D4FF4F] dark:focus:ring-[#D4FF4F]"
            />
          </div>

          <div>
            <label htmlFor="claimantRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Role
            </label>
            <select
              id="claimantRole"
              value={formData.claimantRole}
              onChange={(e) => handleInputChange('claimantRole', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#00C2B2] focus:outline-none focus:ring-1 focus:ring-[#00C2B2] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-[#D4FF4F] dark:focus:ring-[#D4FF4F]"
            >
              <option value="">Select your role</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="representative">Representative</option>
              <option value="employee">Employee</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="claimantEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address *
            </label>
            <input
              type="email"
              id="claimantEmail"
              required
              value={formData.claimantEmail}
              onChange={(e) => handleInputChange('claimantEmail', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#00C2B2] focus:outline-none focus:ring-1 focus:ring-[#00C2B2] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-[#D4FF4F] dark:focus:ring-[#D4FF4F]"
            />
          </div>

          <div>
            <label htmlFor="claimantPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              type="tel"
              id="claimantPhone"
              value={formData.claimantPhone}
              onChange={(e) => handleInputChange('claimantPhone', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#00C2B2] focus:outline-none focus:ring-1 focus:ring-[#00C2B2] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-[#D4FF4F] dark:focus:ring-[#D4FF4F]"
            />
          </div>
        </div>
      </div>

      {/* Claim Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Claim Type</h3>
        
        <div className="space-y-3">
          {[
            { value: 'ownership', label: 'I am the owner of this business', description: 'I own this farm shop and want to manage the listing' },
            { value: 'management', label: 'I manage this business', description: 'I am authorized to manage this listing on behalf of the owner' },
            { value: 'correction', label: 'I want to correct information', description: 'The listing contains incorrect information that needs updating' },
            { value: 'removal', label: 'I want this listing removed', description: 'This business should not be listed (closed, wrong business, etc.)' }
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-3">
              <input
                type="radio"
                name="claimType"
                value={option.value}
                checked={formData.claimType === option.value}
                onChange={(e) => handleInputChange('claimType', e.target.value)}
                className="mt-1 h-4 w-4 text-[#00C2B2] focus:ring-[#00C2B2] dark:focus:ring-[#D4FF4F]"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Corrections */}
      {(formData.claimType === 'correction' || formData.claimType === 'management') && (
        <div>
          <label htmlFor="corrections" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            What information needs to be corrected or updated?
          </label>
          <textarea
            id="corrections"
            rows={4}
            value={formData.corrections}
            onChange={(e) => handleInputChange('corrections', e.target.value)}
            placeholder="Please provide the correct information for any fields that need updating..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#00C2B2] focus:outline-none focus:ring-1 focus:ring-[#00C2B2] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-[#D4FF4F] dark:focus:ring-[#D4FF4F]"
          />
        </div>
      )}

      {/* Verification Method */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Verification</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          How would you like us to verify your claim? We may need to contact you to confirm your identity.
        </p>
        
        <div className="space-y-3">
          {[
            { value: 'email', label: 'Email verification', description: 'We\'ll send a verification email to your business email address' },
            { value: 'phone', label: 'Phone verification', description: 'We\'ll call the business phone number to verify your identity' },
            { value: 'document', label: 'Document verification', description: 'We\'ll request business documents (licenses, certificates, etc.)' }
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-3">
              <input
                type="radio"
                name="verificationMethod"
                value={option.value}
                checked={formData.verificationMethod === option.value}
                onChange={(e) => handleInputChange('verificationMethod', e.target.value)}
                className="mt-1 h-4 w-4 text-[#00C2B2] focus:ring-[#00C2B2] dark:focus:ring-[#D4FF4F]"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div>
          <label htmlFor="verificationDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional verification details
          </label>
          <textarea
            id="verificationDetails"
            rows={3}
            value={formData.verificationDetails}
            onChange={(e) => handleInputChange('verificationDetails', e.target.value)}
            placeholder="Any additional information that will help us verify your claim..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#00C2B2] focus:outline-none focus:ring-1 focus:ring-[#00C2B2] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-[#D4FF4F] dark:focus:ring-[#D4FF4F]"
          />
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Additional Information
        </label>
        <textarea
          id="additionalInfo"
          rows={3}
          value={formData.additionalInfo}
          onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
          placeholder="Any other information you'd like to share..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#00C2B2] focus:outline-none focus:ring-1 focus:ring-[#00C2B2] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-[#D4FF4F] dark:focus:ring-[#D4FF4F]"
        />
      </div>

      {/* Consent */}
      <div className="space-y-3">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={formData.consent}
            onChange={(e) => handleInputChange('consent', e.target.checked)}
            className="mt-1 h-4 w-4 text-[#00C2B2] focus:ring-[#00C2B2] dark:focus:ring-[#D4FF4F]"
          />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">I consent to Farm Companion contacting me</span> about this claim. 
            I understand that my information will be used solely for the purpose of verifying and processing this claim.
          </div>
        </label>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {errorMessage}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <Link
          href={`/shop/${shop.slug}`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00C2B2] focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-[#00C2B2] px-4 py-2 text-sm font-medium text-[#121D2B] shadow-sm hover:bg-[#00B2A2] focus:outline-none focus:ring-2 focus:ring-[#00C2B2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Claim'}
        </button>
      </div>
    </form>
  )
}
