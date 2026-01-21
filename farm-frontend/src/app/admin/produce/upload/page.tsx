'use client'

import { useState } from 'react'
import Link from 'next/link'

import ImageUpload from '@/components/ImageUpload'
import { getAllProduce, getMonthName, uploadProduceImages } from '@/lib/produce-integration'
import type { Produce } from '@/data/produce'

export default function AdminProduceUploadPage() {
  const [produce] = useState<Produce[]>(getAllProduce())
  
  const [selectedProduce, setSelectedProduce] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [altText, setAltText] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    errors: string[]
  } | null>(null)

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const handleImagesChange = (images: string[]) => {
    setUploadedImages(images)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduce || uploadedImages.length === 0 || !altText.trim()) {
      setUploadResult({
        success: false,
        message: 'Please fill in all required fields and upload at least one image.',
        errors: []
      })
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      // Convert data URLs to Files
      const files: File[] = []
      for (const imageUrl of uploadedImages) {
        if (imageUrl.startsWith('data:')) {
          // Handle data URLs directly
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          const file = new File([blob], `image-${Date.now()}.jpg`, { type: blob.type })
          files.push(file)
        } else {
          // Handle regular URLs
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          const file = new File([blob], `image-${Date.now()}.jpg`, { type: blob.type })
          files.push(file)
        }
      }

      const result = await uploadProduceImages({
        produceSlug: selectedProduce,
        month: selectedMonth,
        images: files,
        alt: altText,
        isPrimary,
        metadata: {
          description: `Images for ${produce.find(p => p.slug === selectedProduce)?.name} in ${getMonthName(selectedMonth)}`,
          tags: [selectedProduce, `month-${selectedMonth}`, 'seasonal'],
        }
      })

      if (result.success) {
        setUploadResult({
          success: true,
          message: `Successfully uploaded ${result.totalUploaded} images for ${produce.find(p => p.slug === selectedProduce)?.name}`,
          errors: result.errors
        })
        
        // Reset form
        setSelectedProduce('')
        setSelectedMonth(new Date().getMonth() + 1)
        setAltText('')
        setIsPrimary(false)
        setUploadedImages([])
      } else {
        setUploadResult({
          success: false,
          message: 'Upload failed',
          errors: result.errors
        })
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Upload failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-display font-bold text-gray-900 dark:text-white">
                Upload Produce Images
              </h1>
              <p className="text-caption text-gray-600 dark:text-gray-400">
                Add new images to the seasonal produce system
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/produce"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-caption font-medium transition-colors"
              >
                Back to Produce
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Upload Result */}
          {uploadResult && (
            <div className={`mb-6 p-4 rounded-lg ${
              uploadResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {uploadResult.success ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-caption font-medium ${
                    uploadResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                  </h3>
                  <div className={`mt-2 text-caption ${
                    uploadResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    <p>{uploadResult.message}</p>
                    {uploadResult.errors.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Form */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-heading font-medium text-gray-900 dark:text-white">
                Upload Produce Images
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Produce Selection */}
                <div>
                  <label htmlFor="produce" className="block text-caption font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Produce *
                  </label>
                  <select
                    id="produce"
                    value={selectedProduce}
                    onChange={(e) => setSelectedProduce(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Choose a produce item</option>
                    {produce.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Selection */}
                <div>
                  <label htmlFor="month" className="block text-caption font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Month *
                  </label>
                  <select
                    id="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alt Text */}
                <div>
                  <label htmlFor="altText" className="block text-caption font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alt Text *
                  </label>
                  <input
                    type="text"
                    id="altText"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Describe the image for accessibility"
                    required
                  />
                </div>

                {/* Primary Image Toggle */}
                <div className="flex items-center">
                  <input
                    id="isPrimary"
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPrimary" className="ml-2 block text-caption text-gray-700 dark:text-gray-300">
                    Set as primary image
                  </label>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-caption font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Images *
                  </label>
                  <ImageUpload
                    onImagesChange={handleImagesChange}
                    maxImages={5}
                    className="w-full"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-md text-caption font-medium transition-colors flex items-center"
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      'Upload Images'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
