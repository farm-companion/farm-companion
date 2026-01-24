'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload } from 'lucide-react'
import { X } from 'lucide-react'
import { Image as ImageIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FarmImageUploadProps {
  farmSlug: string
  onImagesChange: (images: File[]) => void
  maxImages?: number
  onUploadSuccess?: (uploadedImages: string[]) => void
}

interface ImagePreview {
  id: string
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  error?: string
}

export default function FarmImageUpload({ 
  farmSlug, 
  onImagesChange,
  maxImages = 4,
  onUploadSuccess
}: FarmImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Client guardrails for file validation
  const ALLOWED = new Set(['image/jpeg','image/png','image/webp']);
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  const MIN_W = 800, MIN_H = 600;

  const validateBasic = useCallback((file: File): string | null => {
    if (!ALLOWED.has(file.type)) return 'Please upload a JPG, PNG, or WebP.';
    if (file.size > MAX_BYTES)    return 'Please keep images under 5 MB.';
    return null;
  }, [])

  async function validateDims(file: File): Promise<string | null> {
    const url = URL.createObjectURL(file);
    const ok = await new Promise<boolean>((res) => {
      const img = new window.Image();
      img.onload = () => res(img.naturalWidth >= MIN_W && img.naturalHeight >= MIN_H);
      img.onerror = () => res(false);
      img.src = url;
    });
    URL.revokeObjectURL(url);
    return ok ? null : `Minimum size is ${MIN_W}×${MIN_H}px.`;
  }

  const createImagePreview = (file: File): Promise<ImagePreview> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve({
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: e.target?.result as string,
          uploading: false,
          uploaded: false
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const addImages = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const newErrors: string[] = []

    // Validate files with enhanced guardrails
    for (const file of fileArray) {
      // Basic validation (type and size)
      const basicError = validateBasic(file)
      if (basicError) {
        newErrors.push(`${file.name}: ${basicError}`)
        continue
      }
      
      // Dimension validation
      const dimError = await validateDims(file)
      if (dimError) {
        newErrors.push(`${file.name}: ${dimError}`)
        continue
      }
      
      validFiles.push(file)
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    // Check if adding these files would exceed the limit
    if (images.length + validFiles.length > maxImages) {
      setErrors([`You can only upload up to ${maxImages} images. Please remove some images first.`])
      return
    }

    setErrors([])

    // Create previews for valid files
    const newImagePreviews = await Promise.all(
      validFiles.map(file => createImagePreview(file))
    )

    const updatedImages = [...images, ...newImagePreviews]
    setImages(updatedImages)
    onImagesChange(updatedImages.map(img => img.file))
  }, [images, maxImages, onImagesChange, validateBasic])

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id)
    setImages(updatedImages)
    onImagesChange(updatedImages.map(img => img.file))
  }

  const uploadFile = async (file: File): Promise<{ leaseId: string; uploadUrl: string; objectKey: string }> => {
    const response = await fetch('/api/photos/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmSlug,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        mode: 'new'
      })
    })

    if (!response.ok) {
      let errorMessage = 'Failed to get upload URL'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response is not JSON, get the text
        const text = await response.text()
        errorMessage = text || errorMessage
      }
      throw new Error(errorMessage)
    }

    try {
      return await response.json()
    } catch (e) {
      console.error('Failed to parse response as JSON:', e)
      const text = await response.text()
      console.error('Response text:', text)
      throw new Error('Invalid response from server')
    }
  }

  const uploadToBlob = async (uploadUrl: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to upload file to blob storage: ${error}`)
    }

    const result = await response.json()
    return { url: result.url }
  }

  const finalizeUpload = async (leaseId: string, objectKey: string): Promise<void> => {
    const response = await fetch('/api/photos/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leaseId,
        objectKey,
        caption: '',
        authorName: '',
        authorEmail: ''
      })
    })

    if (!response.ok) {
      let errorMessage = 'Failed to finalize upload'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response is not JSON, get the text
        const text = await response.text()
        errorMessage = text || errorMessage
      }
      throw new Error(errorMessage)
    }
  }

  const uploadImages = async () => {
    const imagesToUpload = images.filter(img => !img.uploaded && !img.uploading)
    if (imagesToUpload.length === 0) return

    const uploadedUrls: string[] = []

    for (const image of imagesToUpload) {
      try {
        // Mark as uploading
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, uploading: true, error: undefined } : img
        ))

        // Step 1: Get upload URL
        const { leaseId, uploadUrl, objectKey } = await uploadFile(image.file)

        // Step 2: Upload to blob storage
        const uploadResult = await uploadToBlob(uploadUrl, image.file)

        // Step 3: Finalize upload
        await finalizeUpload(leaseId, objectKey)

        // Mark as uploaded
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, uploading: false, uploaded: true } : img
        ))

        uploadedUrls.push(uploadResult.url)

      } catch (error) {
        console.error('Upload error for', image.file.name, ':', error)
        setImages(prev => prev.map(img => 
          img.id === image.id ? { 
            ...img, 
            uploading: false, 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : img
        ))
      }
    }

    if (uploadedUrls.length > 0) {
      onUploadSuccess?.(uploadedUrls)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      addImages(files)
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files) {
      addImages(files)
    }
  }, [addImages])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        ref={dropZoneRef}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragOver 
            ? 'border-serum bg-serum/5 scale-[1.02]' 
            : 'border-border-default hover:border-serum/50 hover:bg-background-surface'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-serum/10 rounded-full">
            <Upload className="w-8 h-8 text-serum" />
          </div>
          
          <div>
            <h3 className="text-body font-semibold text-text-heading mb-2">
              Upload Farm Images
            </h3>
            <p className="text-text-body mb-4">
              Drag and drop up to {maxImages} images here, or click to browse
            </p>
            <p className="text-caption text-text-muted">
              Supported formats: JPEG, PNG, WebP (max 5MB each, min {MIN_W}×{MIN_H}px)
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800 mb-1">Upload Errors</h4>
              <ul className="text-caption text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-body font-semibold text-text-heading">
              Selected Images ({images.length}/{maxImages})
            </h3>
            {images.length > 0 && (
              <Button
                onClick={() => {
                  setImages([])
                  onImagesChange([])
                }}
                variant="secondary"
                size="sm"
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square bg-background-surface rounded-lg border border-border-default overflow-hidden"
              >
                {/* Image Preview */}
                <div className="w-full h-full relative">
                  <Image
                    src={image.preview}
                    alt={`Preview of ${image.file.name}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  
                  {/* Status Indicators */}
                  {image.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  {image.uploaded && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-green-500 bg-white dark:bg-gray-800 rounded-full" />
                    </div>
                  )}
                  
                  {image.error && (
                    <div className="absolute top-2 right-2">
                      <AlertCircle className="w-5 h-5 text-red-500 bg-white dark:bg-gray-800 rounded-full" />
                    </div>
                  )}
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(image.id)
                  }}
                  className="absolute top-2 left-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-small font-medium truncate">
                    {image.file.name}
                  </p>
                  <p className="text-white/80 text-small">
                    {(image.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                
                {/* Error Message */}
                {image.error && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-small p-2">
                    {image.error}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Upload Progress */}
          {images.some(img => img.uploading) && (
            <div className="p-4 bg-serum/10 border border-serum/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-serum animate-spin" />
                <div>
                  <p className="font-medium text-text-heading">Uploading images...</p>
                  <p className="text-caption text-text-muted">
                    Please wait while we process your images
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {images.length > 0 && images.some(img => !img.uploaded && !img.uploading) && (
            <div className="flex justify-center">
              <Button
                onClick={uploadImages}
                disabled={images.some(img => img.uploading)}
                className="px-8 py-3"
              >
                {images.some(img => img.uploading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Images'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="p-4 bg-background-surface rounded-lg border border-border-default">
        <div className="flex items-start space-x-3">
          <ImageIcon className="w-5 h-5 text-serum mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-text-heading mb-1">Image Guidelines</h4>
            <ul className="text-caption text-text-body space-y-1">
              <li>• Upload up to {maxImages} high-quality images of your farm</li>
              <li>• Show your produce, farm shop, or farm activities</li>
              <li>• Images will be reviewed before being added to your listing</li>
              <li>• Supported formats: JPEG, PNG, WebP (max 5MB each, min {MIN_W}×{MIN_H}px)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
