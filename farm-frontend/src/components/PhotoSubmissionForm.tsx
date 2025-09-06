'use client'

import { useState, useRef } from 'react'
import { Upload, X, AlertCircle, CheckCircle, Loader2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PhotoSubmissionFormProps {
  farmSlug: string
  farmName: string
  onSuccess?: () => void
}

interface UploadState {
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  error?: string
  leaseId?: string
  objectKey?: string
}

interface ExistingPhoto {
  id: string
  url: string
  caption: string
}

export default function PhotoSubmissionForm({ 
  farmSlug, 
  farmName, 
  onSuccess 
}: PhotoSubmissionFormProps) {
  const [uploadState, setUploadState] = useState<UploadState | null>(null)
  const [caption, setCaption] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([])
  const [, setSelectedPhotoId] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Client guardrails for file validation
  const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])
  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  const MIN_W = 800, MIN_H = 600

  function validateBasic(file: File): string | null {
    if (!ALLOWED.has(file.type)) return 'Please upload a JPG, PNG, or WebP.'
    if (file.size > MAX_BYTES) return 'Please keep images under 5 MB.'
    return null
  }

  async function validateDims(file: File): Promise<string | null> {
    const url = URL.createObjectURL(file)
    const ok = await new Promise<boolean>((res) => {
      const img = new Image()
      img.onload = () => res(img.naturalWidth >= MIN_W && img.naturalHeight >= MIN_H)
      img.onerror = () => res(false)
      img.src = url
    })
    URL.revokeObjectURL(url)
    return ok ? null : `Minimum size is ${MIN_W}×${MIN_H}px.`
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset states
    setSubmitError(null)
    setSubmitSuccess(false)

    // Basic validation
    const basicError = validateBasic(file)
    if (basicError) {
      setSubmitError(basicError)
      return
    }

    // Dimension validation
    const dimError = await validateDims(file)
    if (dimError) {
      setSubmitError(dimError)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadState({
        file,
        preview: e.target?.result as string,
        uploading: false,
        uploaded: false
      })
    }
    reader.readAsDataURL(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = () => {
    setUploadState(null)
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  async function submitPhoto(
    file: File,
    form: { farmSlug: string; caption: string; authorEmail: string },
    replacePhotoId?: string
  ) {
    // 1) Reserve
    const reserveResponse = await fetch('/api/photos/upload-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        farmSlug: form.farmSlug,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        mode: replacePhotoId ? 'replace' : 'new',
        replacePhotoId: replacePhotoId || undefined
      })
    })

    if (!reserveResponse.ok) {
      let errorMessage = 'Failed to reserve upload'
      try {
        const errorData = await reserveResponse.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        const text = await reserveResponse.text()
        errorMessage = text || errorMessage
      }
      throw new Error(errorMessage)
    }

    let reserve
    try {
      reserve = await reserveResponse.json()
    } catch (e) {
      console.error('Failed to parse reserve response as JSON:', e)
      const text = await reserveResponse.text()
      console.error('Reserve response text:', text)
      throw new Error('Invalid response from server')
    }

    if (reserve.quotaFull) {
      // Show replace UI using reserve.existingPhotos[]
      setExistingPhotos(reserve.existingPhotos || [])
      setShowReplaceModal(true)
      throw new Error('Gallery full; please select a photo to replace.')
    }
    if (!reserve.uploadUrl) throw new Error('Failed to reserve upload')

    // 2) Direct upload to Blob
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pathname', reserve.objectKey)
    formData.append('contentType', file.type)
    
    const uploadResponse = await fetch(reserve.uploadUrl, {
      method: 'POST',
      body: formData
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      throw new Error(`Failed to upload file: ${error}`)
    }

    // 3) Finalize
    const finalizeResponse = await fetch('/api/photos/finalize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leaseId: reserve.leaseId,
        objectKey: reserve.objectKey,
        caption: form.caption,
        authorName: '', // Empty since we're not collecting names
        authorEmail: form.authorEmail
      })
    })

    if (!finalizeResponse.ok) {
      let errorMessage = 'Failed to finalize upload'
      try {
        const errorData = await finalizeResponse.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        const text = await finalizeResponse.text()
        errorMessage = text || errorMessage
      }
      throw new Error(errorMessage)
    }

    let finalize
    try {
      finalize = await finalizeResponse.json()
    } catch (e) {
      console.error('Failed to parse finalize response as JSON:', e)
      const text = await finalizeResponse.text()
      console.error('Finalize response text:', text)
      throw new Error('Invalid response from server')
    }

    return finalize
  }

  const handleReplacePhoto = async (photoId: string) => {
    if (!uploadState) return

    setSelectedPhotoId(photoId)
    setShowReplaceModal(false)
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Mark as uploading
      setUploadState(prev => prev ? { ...prev, uploading: true } : null)

      // Submit photo with replace mode
      const result = await submitPhoto(uploadState.file, {
        farmSlug,
        caption: caption.trim(),
        authorEmail: authorEmail.trim()
      }, photoId)

      // Success
      setUploadState(prev => prev ? { ...prev, uploaded: true, uploading: false } : null)
      setSubmitSuccess(true)
      setCaption('')
      setAuthorEmail('')
      onSuccess?.()

    } catch (error) {
      console.error('Upload error:', error)
      setSubmitError(error instanceof Error ? error.message : 'Upload failed')
      setUploadState(prev => prev ? { ...prev, uploading: false, error: error instanceof Error ? error.message : 'Upload failed' } : null)
    } finally {
      setIsSubmitting(false)
      setSelectedPhotoId(null)
    }
  }

  const handleSubmit = async () => {
    if (!uploadState) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Mark as uploading
      setUploadState(prev => prev ? { ...prev, uploading: true } : null)

      // Submit photo using new function
      const result = await submitPhoto(uploadState.file, {
        farmSlug,
        caption: caption.trim(),
        authorEmail: authorEmail.trim()
      })

      // Success
      setUploadState(prev => prev ? { ...prev, uploaded: true, uploading: false } : null)
      setSubmitSuccess(true)
      setCaption('')
      setAuthorEmail('')
      onSuccess?.()

    } catch (error) {
      console.error('Upload error:', error)
      setSubmitError(error instanceof Error ? error.message : 'Upload failed')
      setUploadState(prev => prev ? { ...prev, uploading: false, error: error instanceof Error ? error.message : 'Upload failed' } : null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-serum/10 rounded-full">
          <Camera className="w-6 h-6 text-serum" />
        </div>
        <h2 className="text-xl font-semibold text-text-heading">
          Share a Photo
        </h2>
        <p className="text-text-body">
          Help showcase {farmName} with your photos
        </p>
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border-default rounded-xl p-8 text-center cursor-pointer hover:border-serum/50 hover:bg-background-surface transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-serum/10 rounded-full">
              <Upload className="w-6 h-6 text-serum" />
            </div>
            
            <div>
              <p className="text-text-body font-medium">
                Click to select or drag and drop
              </p>
              <p className="text-sm text-text-muted mt-1">
                JPEG, PNG, WebP • Max 5MB • Min {MIN_W}×{MIN_H}px
              </p>
            </div>
          </div>
        </div>

        {/* File Preview */}
        {uploadState && (
          <div className="relative bg-background-surface rounded-lg border border-border-default overflow-hidden">
            <div className="aspect-video relative">
              <img
                src={uploadState.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              
              {/* Status Overlay */}
              {uploadState.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              
              {uploadState.uploaded && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="w-6 h-6 text-green-500 bg-white dark:bg-gray-800 rounded-full" />
                </div>
              )}
              
              {uploadState.error && (
                <div className="absolute top-4 right-4">
                  <AlertCircle className="w-6 h-6 text-red-500 bg-white dark:bg-gray-800 rounded-full" />
                </div>
              )}
            </div>
            
            {/* Remove Button */}
            <button
              onClick={removeFile}
              className="absolute top-4 left-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* File Info */}
            <div className="p-4">
              <p className="font-medium text-text-heading">{uploadState.file.name}</p>
              <p className="text-sm text-text-muted">
                {(uploadState.file.size / 1024 / 1024).toFixed(1)} MB
              </p>
              {uploadState.error && (
                <p className="text-sm text-red-600 mt-2">{uploadState.error}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form Fields */}
      {uploadState && !uploadState.uploaded && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-heading mb-2">
              Caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe what's in the photo..."
              className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-serum/20 focus:border-serum transition-colors"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-text-muted mt-1">
              {caption.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-heading mb-2">
              Your Email (optional)
            </label>
            <input
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-serum/20 focus:border-serum transition-colors"
              maxLength={200}
            />
            <p className="text-xs text-text-muted mt-1">
              We&apos;ll notify you when your photo is approved
            </p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800 mb-1">Upload Error</h4>
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-800 mb-1">Photo Submitted!</h4>
              <p className="text-sm text-green-700">
                Your photo will be reviewed and added to the farm shop page soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {uploadState && !uploadState.uploaded && (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || uploadState.uploading}
          className="w-full"
        >
          {isSubmitting || uploadState.uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploadState.uploading ? 'Uploading...' : 'Submitting...'}
            </>
          ) : (
            'Submit Photo'
          )}
        </Button>
      )}

      {/* Help Text */}
      <div className="p-4 bg-background-surface rounded-lg border border-border-default">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-serum mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-text-heading mb-1">Photo Guidelines</h4>
            <ul className="text-sm text-text-body space-y-1">
              <li>• Show your produce, farm shop, or farm activities</li>
              <li>• Photos will be reviewed before being added to the page</li>
              <li>• Supported formats: JPEG, PNG, WebP (max 5MB, min {MIN_W}×{MIN_H}px)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Replace Photo Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gallery Full - Replace a Photo
              </h3>
              <button
                onClick={() => setShowReplaceModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This farm&apos;s photo gallery is full. Please select a photo to replace with your new upload.
            </p>
            
            <div className="space-y-3">
              {existingPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-center space-x-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Farm photo'}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {photo.caption || 'No caption'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {photo.id}
                    </p>
                  </div>
                  <button
                    onClick={() => handleReplacePhoto(photo.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Replace This
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
