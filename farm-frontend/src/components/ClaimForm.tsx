'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, AlertCircle, User, Mail, Phone, Building, FileText, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
  claimantName: string
  claimantRole: string
  claimantEmail: string
  claimantPhone: string
  claimType: 'ownership' | 'management' | 'correction' | 'removal'
  corrections: string
  additionalInfo: string
  verificationMethod: 'email' | 'phone' | 'document'
  verificationDetails: string
  consent: boolean
}

const claimTypes = [
  { value: 'ownership' as const, label: 'I own this business', description: 'Manage and verify your listing as the owner', icon: Building },
  { value: 'management' as const, label: 'I manage this business', description: 'Authorized to manage this listing on behalf of the owner', icon: User },
  { value: 'correction' as const, label: 'Correct information', description: 'Update incorrect details on this listing', icon: FileText },
  { value: 'removal' as const, label: 'Remove this listing', description: 'Business is closed or should not be listed', icon: AlertCircle },
]

const verificationMethods = [
  { value: 'email' as const, label: 'Email verification', description: 'Verification email sent to your business address' },
  { value: 'phone' as const, label: 'Phone verification', description: 'Quick call to the business phone number' },
  { value: 'document' as const, label: 'Document upload', description: 'Business licence, certificate, or other proof' },
]

const inputClasses = [
  'block w-full rounded-xl border border-slate-300 dark:border-slate-600',
  'bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
  'px-4 py-3 text-[15px]',
  'placeholder:text-slate-400 dark:placeholder:text-slate-500',
  'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
  'dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
  'transition-colors duration-200',
].join(' ')

const labelClasses = 'block text-[14px] font-semibold text-slate-900 dark:text-white mb-2'

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
    consent: false,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData(prev => ({
          ...prev,
          claimantName: '',
          claimantRole: '',
          claimantEmail: '',
          claimantPhone: '',
          corrections: '',
          additionalInfo: '',
          verificationDetails: '',
          consent: false,
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-green-200 dark:border-green-800 p-8 md:p-12 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/40 mb-6">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Claim submitted successfully
        </h2>
        <p className="text-body text-slate-600 dark:text-slate-400 mb-2 max-w-md mx-auto">
          We will review your submission and contact you within 2-3 business days.
        </p>
        <p className="text-caption text-slate-500 dark:text-slate-500 mb-8">
          A confirmation email will be sent from hello@farmcompanion.co.uk
        </p>
        <Link href={`/shop/${shop.slug}`}>
          <Button variant="primary" size="lg">
            Back to {shop.name}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Claim Type */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            What would you like to do?
          </h2>
          <p className="text-caption text-slate-600 dark:text-slate-400">
            Select the option that best describes your relationship to this business.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {claimTypes.map((option) => {
            const isSelected = formData.claimType === option.value
            return (
              <label
                key={option.value}
                className={`
                  relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer
                  transition-all duration-200
                  ${isSelected
                    ? 'border-primary-500 bg-primary-50/50 dark:border-primary-400 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="claimType"
                  value={option.value}
                  checked={isSelected}
                  onChange={(e) => handleInputChange('claimType', e.target.value)}
                  className="sr-only"
                />
                <div className={`
                  flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center
                  ${isSelected
                    ? 'bg-primary-100 dark:bg-primary-800/40 text-primary-600 dark:text-primary-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }
                `}>
                  <option.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-slate-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                  </div>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Section 2: Your Details */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Your details
          </h2>
          <p className="text-caption text-slate-600 dark:text-slate-400">
            We need a few details to verify your claim. Fields marked with * are required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="claimantName" className={labelClasses}>
              Full name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                id="claimantName"
                required
                value={formData.claimantName}
                onChange={(e) => handleInputChange('claimantName', e.target.value)}
                placeholder="Your full name"
                className={`${inputClasses} pl-10`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="claimantRole" className={labelClasses}>
              Your role
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                id="claimantRole"
                value={formData.claimantRole}
                onChange={(e) => handleInputChange('claimantRole', e.target.value)}
                className={`${inputClasses} pl-10 appearance-none`}
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

          <div>
            <label htmlFor="claimantEmail" className={labelClasses}>
              Email address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                id="claimantEmail"
                required
                value={formData.claimantEmail}
                onChange={(e) => handleInputChange('claimantEmail', e.target.value)}
                placeholder="you@business.co.uk"
                className={`${inputClasses} pl-10`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="claimantPhone" className={labelClasses}>
              Phone number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                id="claimantPhone"
                value={formData.claimantPhone}
                onChange={(e) => handleInputChange('claimantPhone', e.target.value)}
                placeholder="Landline or mobile number"
                className={`${inputClasses} pl-10`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Corrections (conditional) */}
      {(formData.claimType === 'correction' || formData.claimType === 'management') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {formData.claimType === 'correction' ? 'What needs correcting?' : 'What changes are needed?'}
            </h2>
            <p className="text-caption text-slate-600 dark:text-slate-400">
              Describe the information that needs to be updated on this listing.
            </p>
          </div>
          <textarea
            id="corrections"
            rows={4}
            value={formData.corrections}
            onChange={(e) => handleInputChange('corrections', e.target.value)}
            placeholder="Please describe the corrections needed, e.g. updated opening hours, correct phone number, new address..."
            className={inputClasses}
          />
        </div>
      )}

      {/* Section 4: Verification */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Verification method
          </h2>
          <p className="text-caption text-slate-600 dark:text-slate-400">
            Choose how you would like us to verify your identity.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {verificationMethods.map((method) => {
            const isSelected = formData.verificationMethod === method.value
            return (
              <label
                key={method.value}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer
                  transition-all duration-200
                  ${isSelected
                    ? 'border-primary-500 bg-primary-50/50 dark:border-primary-400 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="verificationMethod"
                  value={method.value}
                  checked={isSelected}
                  onChange={(e) => handleInputChange('verificationMethod', e.target.value)}
                  className="sr-only"
                />
                <div className={`
                  h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected
                    ? 'border-primary-500 dark:border-primary-400'
                    : 'border-slate-300 dark:border-slate-600'
                  }
                `}>
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary-500 dark:bg-primary-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-slate-900 dark:text-white">
                    {method.label}
                  </div>
                  <div className="text-[13px] text-slate-500 dark:text-slate-400">
                    {method.description}
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        <div>
          <label htmlFor="verificationDetails" className={labelClasses}>
            Additional verification details
          </label>
          <textarea
            id="verificationDetails"
            rows={3}
            value={formData.verificationDetails}
            onChange={(e) => handleInputChange('verificationDetails', e.target.value)}
            placeholder="Any extra information to help us verify your claim..."
            className={inputClasses}
          />
        </div>
      </div>

      {/* Section 5: Additional Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Anything else?
          </h2>
          <p className="text-caption text-slate-600 dark:text-slate-400">
            Optional. Share anything else relevant to your claim.
          </p>
        </div>
        <textarea
          id="additionalInfo"
          rows={3}
          value={formData.additionalInfo}
          onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
          placeholder="Any other information you would like to share..."
          className={inputClasses}
        />
      </div>

      {/* Consent + Submit */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        {/* Consent Checkbox */}
        <label className="flex items-start gap-4 cursor-pointer mb-8">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={formData.consent}
              onChange={(e) => handleInputChange('consent', e.target.checked)}
              className="sr-only peer"
            />
            <div className="h-5 w-5 rounded-md border-2 border-slate-300 dark:border-slate-600 peer-checked:border-primary-500 peer-checked:bg-primary-500 dark:peer-checked:border-primary-400 dark:peer-checked:bg-primary-400 transition-colors flex items-center justify-center">
              {formData.consent && (
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <div className="text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold">I consent to Farm Companion contacting me</span> about this claim.
            My information will be used solely for verification and processing of this claim.
          </div>
        </label>

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-6">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-[14px] text-red-700 dark:text-red-300">{errorMessage}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href={`/shop/${shop.slug}`}
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl text-[14px] font-semibold text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 active:scale-[0.98]"
          >
            Cancel
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            leftIcon={!isSubmitting ? <ShieldCheck className="h-5 w-5" /> : undefined}
            className="w-full sm:w-auto px-8"
          >
            {isSubmitting ? 'Submitting claim...' : 'Submit Claim'}
          </Button>
        </div>
      </div>
    </form>
  )
}
