'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Eye, Download, ExternalLink } from 'lucide-react'

interface AdminPhotoDisplayProps {
  url?: string
  caption?: string
  alt?: string
  showActions?: boolean
  onPreview?: () => void
  onDownload?: () => void
  onViewOriginal?: () => void
}

export default function AdminPhotoDisplay({ 
  url, 
  caption, 
  alt, 
  showActions = false,
  onPreview,
  onDownload,
  onViewOriginal
}: AdminPhotoDisplayProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    if (url) {
      setImageError(false)
      setIsLoading(true)
    }
  }, [url])

  if (!url || imageError) {
    return (
      <div className="w-full h-full bg-background-surface border border-border-default/30 rounded-lg flex items-center justify-center relative min-h-[200px]">
        <div className="text-center">
          <svg className="h-12 w-12 text-text-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-caption text-text-muted">No image available</p>
          {imageError && (
            <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
              <span className="text-small text-red-600 font-medium">Failed to load</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative w-full h-full group"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-background-surface border border-border-default/30 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-serum border-t-transparent rounded-full animate-spin" />
            <span className="text-caption text-text-muted">Loading...</span>
          </div>
        </div>
      )}

      {/* Main Image */}
      <Image 
        className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" 
        src={url} 
        alt={alt || caption || 'Farm photo'}
        fill
        onError={(e) => {
          console.error('AdminPhotoDisplay: Image failed to load:', url, e)
          setImageError(true)
          setIsLoading(false)
        }}
        onLoad={() => {
          setIsLoading(false)
        }}
      />
      
      {/* Action Overlay */}
      {showActions && showOverlay && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-20">
          <div className="flex gap-2">
            {onPreview && (
              <button
                onClick={onPreview}
                className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
                title="Preview image"
              >
                <Eye className="w-4 h-4 text-text-heading" />
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
                title="Download image"
              >
                <Download className="w-4 h-4 text-text-heading" />
              </button>
            )}
            {onViewOriginal && (
              <button
                onClick={onViewOriginal}
                className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
                title="View original"
              >
                <ExternalLink className="w-4 h-4 text-text-heading" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Caption Overlay */}
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg">
          <p className="text-white text-caption line-clamp-2">{caption}</p>
        </div>
      )}
    </div>
  )
}
