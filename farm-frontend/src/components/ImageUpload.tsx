'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void
  maxImages?: number
  className?: string
}

export default function ImageUpload({ onImagesChange, maxImages = 5, className = '' }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    
    try {
      const imageUrls: string[] = []
      
      for (let i = 0; i < Math.min(files.length, maxImages); i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please upload only image files')
          continue
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Please upload files smaller than 5MB`)
          continue
        }
        
        // For now, we'll use a placeholder URL
        // In production, you'd upload to a service like Cloudinary, AWS S3, or similar
        const imageUrl = await uploadImage(file)
        imageUrls.push(imageUrl)
      }
      
      setSelectedImages(imageUrls)
      onImagesChange(imageUrls)
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Error uploading images. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    // This is a placeholder implementation
    // In production, you would:
    // 1. Upload to your image hosting service (Cloudinary, AWS S3, etc.)
    // 2. Get back a URL
    // 3. Return that URL
    
    // For now, we'll create a local object URL for demonstration
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-caption font-medium text-gray-700 dark:text-gray-300">
        Shop Photos (optional)
      </label>
      <p className="text-captionall text-gray-600 dark:text-gray-400">
        Add photos of your farm shop to help customers find you. 
        Maximum {maxImages} images, 5MB each. JPG, PNG, or WebP format.
      </p>
      
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragActive 
            ? 'border-[#00C2B2] bg-[#00C2B2]/5 dark:border-[#D4FF4F] dark:bg-[#D4FF4F]/5' 
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="space-y-2">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            stroke="currentColor" 
            fill="none" 
            viewBox="0 0 48 48"
          >
            <path 
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
              strokeWidth={2} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
          
          <div className="text-caption text-gray-600 dark:text-gray-400">
            {uploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onButtonClick}
                  className="font-medium text-[#00C2B2] hover:text-[#00C2B2]/80 dark:text-[#D4FF4F] dark:hover:text-[#D4FF4F]/80"
                >
                  Click to upload
                </button>
                {' '}or drag and drop
              </>
            )}
          </div>
          
          <p className="text-captionall text-gray-500 dark:text-gray-500">
            PNG, JPG, WebP up to 5MB
          </p>
        </div>
      </div>
      
      {/* Image Preview */}
      {selectedImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-caption font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected Images ({selectedImages.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <Image
                  src={imageUrl}
                  alt={`Preview ${index + 1}`}
                  width={96}
                  height={96}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newImages = selectedImages.filter((_, i) => i !== index)
                    setSelectedImages(newImages)
                    onImagesChange(newImages)
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-captionall hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
