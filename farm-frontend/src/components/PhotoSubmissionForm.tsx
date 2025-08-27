'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
// Removed direct API call import - will use proxy instead

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
  const [submissionStep, setSubmissionStep] = useState<string>('')
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [isPhotoLimitError, setIsPhotoLimitError] = useState(false)
  const [replaceMode, setReplaceMode] = useState(false)
  const [isCheckingQuota, setIsCheckingQuota] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-submit quota check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/photos?farmSlug=${encodeURIComponent(farmSlug)}`);
        if (!res.ok) return;
        const { farmPhotoCount, maxPhotosAllowed } = await res.json();
        
        if (farmPhotoCount >= maxPhotosAllowed) {
          setErrors([`This farm already has ${farmPhotoCount}/${maxPhotosAllowed} photos.`]);
          setReplaceMode(true);
        }
      } catch (error) {
        console.error('Error checking photo quota:', error);
      } finally {
        setIsCheckingQuota(false);
      }
    })();
  }, [farmSlug]);

  // Client guardrails for file validation
  const ALLOWED = new Set(['image/jpeg','image/png','image/webp']);
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  const MIN_W = 800, MIN_H = 600;

  function validateBasic(file: File): string | null {
    if (!ALLOWED.has(file.type)) return 'Please upload a JPG, PNG, or WebP.';
    if (file.size > MAX_BYTES)    return 'Please keep images under 5 MB.';
    return null;
  }

  async function validateDims(file: File): Promise<string | null> {
    const url = URL.createObjectURL(file);
    const ok = await new Promise<boolean>((res) => {
      const img = new Image();
      img.onload = () => res(img.naturalWidth >= MIN_W && img.naturalHeight >= MIN_H);
      img.onerror = () => res(false);
      img.src = url;
    });
    URL.revokeObjectURL(url);
    return ok ? null : `Minimum size is ${MIN_W}×${MIN_H}px.`;
  }

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
      // Enhanced file validation
      const basicError = validateBasic(formData.photoFile)
      if (basicError) {
        newErrors.push(basicError)
      }
    }
    
    return newErrors
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Enhanced validation with client guardrails
      const basicError = validateBasic(file)
      if (basicError) {
        setErrors([basicError])
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      
      // Dimension validation
      const dimError = await validateDims(file)
      if (dimError) {
        setErrors([dimError])
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      
      // Clear any previous errors
      setErrors([])
      
      // Keep the original File as source of truth
      setFormData(prev => ({ ...prev, photoFile: file }))
      
      // Create preview for display only
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
    setSubmissionStep('Preparing photo...')
    
    try {
      if (!formData.photoFile) {
        setErrors(['Please choose a photo'])
        return
      }
      
      const fd = new FormData()
      fd.append('farmSlug', farmSlug)
      fd.append('farmName', farmName)
      fd.append('submitterName', formData.submitterName.trim())
      fd.append('submitterEmail', formData.submitterEmail.trim())
      fd.append('description', formData.photoDescription.trim())
      fd.append('file', formData.photoFile) // ✅ stream the original File
      
      setSubmissionStep('Uploading to server...')
      
      const response = await fetch('/api/photos', { 
        method: 'POST', 
        body: fd 
      })
      
      setSubmissionStep('Processing with AI...')
      
      const result = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        if (onSuccess) {
          onSuccess()
        }
      } else if (response.status === 409) {
        // "5 photos max" UI
        const rid = response.headers.get('x-request-id') ?? crypto.randomUUID()
        setErrors([`${result.message || 'This farm has reached the maximum number of photos'} (ref: ${rid}). Please contact support if you'd like to replace an existing photo.`])
        setIsPhotoLimitError(true)
      } else {
        // generic error UI
        const rid = response.headers.get('x-request-id') ?? crypto.randomUUID()
        setErrors([`Upload failed (ref: ${rid}). ${result.message || 'Please try again.'}`])
        setIsPhotoLimitError(false)
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
      const rid = crypto.randomUUID()
      if (error instanceof TypeError && errorMessage.includes('fetch')) {
        setErrors([`Network error (ref: ${rid}). Please check your internet connection and try again.`])
      } else if (error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
        setErrors([`Unable to connect to server (ref: ${rid}). Please try again.`])
      } else {
        setErrors([`An unexpected error occurred (ref: ${rid}): ${errorMessage}`])
      }
    } finally {
      setIsSubmitting(false)
      setSubmissionStep('')
    }
  }

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
      setIsPhotoLimitError(false)
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
    <div className="card relative">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-serum mx-auto mb-3" />
            <p className="text-text-heading font-medium">{submissionStep}</p>
            <p className="text-text-muted text-sm mt-1">Please wait while we process your submission</p>
          </div>
        </div>
      )}
      
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
              disabled={replaceMode}
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
                  disabled={replaceMode}
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
                  disabled={replaceMode}
                >
                  Choose Photo
                </button>
                <p className="mt-2 text-sm text-text-muted">
                  JPG, PNG, or WebP up to 5MB, min {MIN_W}×{MIN_H}px
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
              {replaceMode ? 'Photo Limit Reached' : 'Please fix the following errors:'}
            </h3>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            {replaceMode && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-sm text-red-700 mb-2">
                  This farm has reached the maximum number of photos. To add a new photo, you'll need to:
                </p>
                <ul className="text-sm text-red-700 space-y-1 mb-3">
                  <li>• Contact us to request removal of an existing photo</li>
                  <li>• Wait for an existing photo to be rejected</li>
                  <li>• Replace an existing photo with a better one</li>
                </ul>
                <p className="text-sm text-red-700 mb-2">
                  Need help? Contact our support team:
                </p>
                <a 
                  href="mailto:hello@farmcompanion.co.uk?subject=Photo%20Replacement%20Request" 
                  className="inline-flex items-center gap-2 text-sm text-red-800 hover:text-red-900 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  hello@farmcompanion.co.uk
                </a>
              </div>
            )}
            {isPhotoLimitError && !replaceMode && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-sm text-red-700 mb-2">
                  Need help? Contact our support team:
                </p>
                <a 
                  href="mailto:hello@farmcompanion.co.uk?subject=Photo%20Replacement%20Request" 
                  className="inline-flex items-center gap-2 text-sm text-red-800 hover:text-red-900 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  hello@farmcompanion.co.uk
                </a>
              </div>
            )}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={isSubmitting || isCheckingQuota || replaceMode}
            className={`btn-primary flex-1 flex items-center justify-center gap-2 ${
              replaceMode ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-describedby="submit-help"
          >
            {isCheckingQuota ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Photo Limit...</span>
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Photo...</span>
              </>
            ) : replaceMode ? (
              'Photo Limit Reached'
            ) : (
              'Submit Photo'
            )}
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
