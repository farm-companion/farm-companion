'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface PhotoSubmissionFormProps {
  farmSlug: string
  farmName: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormData {
  submitterName: string
  submitterEmail: string
  photoDescription: string
  photoFile: File | null
  photoPreview: string | null
}

export default function PhotoSubmissionForm({ 
  farmSlug, 
  farmName, 
  onSuccess, 
  onCancel 
}: PhotoSubmissionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    submitterName: '',
    submitterEmail: '',
    photoDescription: '',
    photoFile: null,
    photoPreview: null
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validation following PuredgeOS clarity standards
  const validateForm = (): string[] => {
    const newErrors: string[] = []
    
    if (!formData.submitterName.trim()) {
      newErrors.push('Your name is required')
    }
    
    if (!formData.submitterEmail.trim()) {
      newErrors.push('Email address is required')
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.submitterEmail)) {
        newErrors.push('Please enter a valid email address')
      }
    }
    
    if (!formData.photoDescription.trim()) {
      newErrors.push('Photo description is required')
    } else if (formData.photoDescription.length > 500) {
      newErrors.push('Description must be less than 500 characters')
    }
    
    if (!formData.photoFile) {
      newErrors.push('Please select a photo to upload')
    } else {
      // Check file type
      if (!formData.photoFile.type.startsWith('image/')) {
        newErrors.push('Please select a valid image file')
      }
      
      // Check file size (5MB limit)
      if (formData.photoFile.size > 5 * 1024 * 1024) {
        newErrors.push('Photo must be smaller than 5MB')
      }
    }
    
    return newErrors
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size before processing (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        setErrors(['File too large. Please select an image smaller than 5MB.'])
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors(['Please select a valid image file (JPEG, PNG, or WebP).'])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      
      // Clear any previous errors
      setErrors([])
      
      setFormData(prev => ({ ...prev, photoFile: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ 
          ...prev, 
          photoPreview: e.target?.result as string 
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    // Clear previous errors
    setErrors([])
    
    // Validate form
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Convert file to base64
      const base64Data = formData.photoPreview!
      
      const submissionData = {
        farmSlug,
        farmName,
        submitterName: formData.submitterName.trim(),
        submitterEmail: formData.submitterEmail.trim(),
        photoDescription: formData.photoDescription.trim(),
        photoData: base64Data
      }
      
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })
      
      // Check for specific HTTP status codes before parsing JSON
      if (response.status === 413) {
        setErrors(['File too large. Please select a smaller image (under 5MB).'])
        return
      }
      
      if (response.status === 429) {
        setErrors(['Too many requests. Please wait a moment and try again.'])
        return
      }
      
      if (!response.ok) {
        setErrors([`Server error (${response.status}). Please try again.`])
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess(true)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        // Handle specific error cases
        if (result.error === 'Validation failed' && result.details) {
          setErrors(result.details)
        } else if (result.error) {
          setErrors([result.error])
        } else {
          setErrors(['Submission failed. Please try again.'])
        }
      }
    } catch (error) {
      console.error('Photo submission error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorName = error instanceof Error ? error.name : 'Unknown'
      
      console.error('Error details:', {
        name: errorName,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Check if it's a network error
      if (error instanceof TypeError && errorMessage.includes('fetch')) {
        setErrors(['Network error. Please check your internet connection and try again.'])
      } else if (error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
        setErrors(['Unable to connect to server. Please try again.'])
      } else {
        setErrors([`An unexpected error occurred: ${errorMessage}`])
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  if (success) {
    return (
      <div className="card text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-text-heading mb-2">
          Photo Submitted Successfully!
        </h3>
        <p className="text-text-muted mb-4">
          Thank you for your submission. We&apos;ll review your photo and add it to {farmName} if approved.
        </p>
        <p className="text-sm text-text-muted mb-2">
          You&apos;ll receive an email confirmation shortly.
        </p>
        <p className="text-xs text-text-muted">
          Note: Photo processing may take a few minutes in production.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-text-heading mb-6">
        Submit a Photo for {farmName}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="submitterName" className="block text-sm font-medium text-text-heading mb-2">
            Your Name *
          </label>
          <input
            id="submitterName"
            type="text"
            value={formData.submitterName}
            onChange={handleInputChange('submitterName')}
            className="input w-full"
            placeholder="Enter your full name"
            required
            aria-describedby="name-help"
          />
          <p id="name-help" className="mt-1 text-sm text-text-muted">
            This will be displayed with your photo if approved
          </p>
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="submitterEmail" className="block text-sm font-medium text-text-heading mb-2">
            Email Address *
          </label>
          <input
            id="submitterEmail"
            type="email"
            value={formData.submitterEmail}
            onChange={handleInputChange('submitterEmail')}
            className="input w-full"
            placeholder="your.email@example.com"
            required
            aria-describedby="email-help"
          />
          <p id="email-help" className="mt-1 text-sm text-text-muted">
            We&apos;ll send you a confirmation and notify you when your photo is approved
          </p>
        </div>

        {/* Photo Upload */}
        <div>
          <label htmlFor="photoFile" className="block text-sm font-medium text-text-heading mb-2">
            Photo *
          </label>
          <div className="border-2 border-dashed border-border-default rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              id="photoFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              required
              aria-describedby="photo-help"
            />
            
            {formData.photoPreview ? (
              <div className="space-y-4">
                <div className="relative mx-auto max-w-xs">
                  <Image
                    src={formData.photoPreview}
                    alt="Photo preview"
                    width={300}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  Choose Different Photo
                </button>
              </div>
            ) : (
              <div>
                <svg className="w-12 h-12 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                >
                  Choose Photo
                </button>
                <p className="mt-2 text-sm text-text-muted">
                  JPG, PNG, or GIF up to 5MB
                </p>
              </div>
            )}
          </div>
          <p id="photo-help" className="mt-1 text-sm text-text-muted">
            Please ensure you have permission to share this photo
          </p>
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="photoDescription" className="block text-sm font-medium text-text-heading mb-2">
            Photo Description *
          </label>
          <textarea
            id="photoDescription"
            value={formData.photoDescription}
            onChange={handleInputChange('photoDescription')}
            className="input w-full min-h-[100px] resize-y"
            placeholder="Describe what this photo shows (e.g., 'Fresh vegetables at the farm shop entrance', 'The farm shop cafe area')"
            required
            maxLength={500}
            aria-describedby="description-help"
          />
          <div className="flex justify-between items-center mt-1">
            <p id="description-help" className="text-sm text-text-muted">
              Help visitors understand what they&apos;re looking at
            </p>
            <span className="text-sm text-text-muted">
              {formData.photoDescription.length}/500
            </span>
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Please fix the following errors:
            </h3>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
            aria-describedby="submit-help"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Photo'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          )}
        </div>
        
        <p id="submit-help" className="text-sm text-text-muted text-center">
          Your photo will be reviewed by our team before being added to the farm shop page
        </p>
      </form>
    </div>
  )
}
