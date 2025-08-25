'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FarmImageUploadProps {
  farmSlug: string
  farmName: string
  onImagesChange: (images: File[]) => void
  maxImages?: number
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
  farmName, 
  onImagesChange,
  maxImages = 4 
}: FarmImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)'
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return 'Image must be smaller than 5MB'
    }
    
    return null
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

    // Validate files
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        newErrors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
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
  }, [images, maxImages, onImagesChange])

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id)
    setImages(updatedImages)
    onImagesChange(updatedImages.map(img => img.file))
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
            <h3 className="text-lg font-semibold text-text-heading mb-2">
              Upload Farm Images
            </h3>
            <p className="text-text-body mb-4">
              Drag and drop up to {maxImages} images here, or click to browse
            </p>
            <p className="text-sm text-text-muted">
              Supported formats: JPEG, PNG, WebP (max 5MB each)
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
              <ul className="text-sm text-red-700 space-y-1">
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
            <h3 className="text-lg font-semibold text-text-heading">
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
                  <img
                    src={image.preview}
                    alt={`Preview of ${image.file.name}`}
                    className="w-full h-full object-cover"
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
                      <CheckCircle className="w-5 h-5 text-green-500 bg-white rounded-full" />
                    </div>
                  )}
                  
                  {image.error && (
                    <div className="absolute top-2 right-2">
                      <AlertCircle className="w-5 h-5 text-red-500 bg-white rounded-full" />
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
                  <p className="text-white text-xs font-medium truncate">
                    {image.file.name}
                  </p>
                  <p className="text-white/80 text-xs">
                    {(image.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                
                {/* Error Message */}
                {image.error && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-xs p-2">
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
                  <p className="text-sm text-text-muted">
                    Please wait while we process your images
                  </p>
                </div>
              </div>
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
            <ul className="text-sm text-text-body space-y-1">
              <li>• Upload up to {maxImages} high-quality images of your farm</li>
              <li>• Show your produce, farm shop, or farm activities</li>
              <li>• Images will be reviewed before being added to your listing</li>
              <li>• Supported formats: JPEG, PNG, WebP (max 5MB each)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
