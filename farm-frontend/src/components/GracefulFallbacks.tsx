'use client'

import React from 'react'
import { MapPin } from 'lucide-react'
import { Search } from 'lucide-react'
import { WifiOff } from 'lucide-react'
import { Clock } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { Info } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-background-surface rounded-full flex items-center justify-center mb-4">
        {icon || <Search className="w-8 h-8 text-text-muted" />}
      </div>
      <h3 className="text-lg font-semibold text-text-heading mb-2">{title}</h3>
      <p className="text-text-muted mb-4 max-w-sm mx-auto">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ message = 'Loading...', size = 'md' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-serum border-t-transparent mb-3`} />
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  )
}

interface NetworkErrorProps {
  onRetry?: () => void
  message?: string
}

export function NetworkError({ onRetry, message = 'Network connection issue' }: NetworkErrorProps) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="font-semibold text-text-heading mb-2">Connection Issue</h3>
      <p className="text-text-muted mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-serum text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-serum/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

interface GeolocationDeniedProps {
  onRetry?: () => void
}

export function GeolocationDenied({ onRetry }: GeolocationDeniedProps) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <MapPin className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="font-semibold text-text-heading mb-2">Location Access Required</h3>
      <p className="text-text-muted mb-4">
        To show nearby farm shops, we need access to your location. Please enable location services in your browser.
      </p>
      <div className="space-y-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-serum text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-serum/90 transition-colors"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-background-canvas text-text-heading px-4 py-2 rounded-lg text-sm font-medium hover:bg-background-canvas/80 transition-colors border border-border-default"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}

interface NoResultsProps {
  searchTerm?: string
  onClearSearch?: () => void
}

export function NoResults({ searchTerm, onClearSearch }: NoResultsProps) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-background-surface rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="font-semibold text-text-heading mb-2">No Results Found</h3>
      <p className="text-text-muted mb-4">
        {searchTerm 
          ? `No farm shops found matching "${searchTerm}". Try adjusting your search terms.`
          : 'No farm shops found in this area. Try expanding your search.'
        }
      </p>
      {onClearSearch && (
        <button
          onClick={onClearSearch}
          className="bg-background-canvas text-text-heading px-4 py-2 rounded-lg text-sm font-medium hover:bg-background-canvas/80 transition-colors border border-border-default"
        >
          Clear Search
        </button>
      )}
    </div>
  )
}

interface MaintenanceModeProps {
  estimatedTime?: string
}

export function MaintenanceMode({ estimatedTime }: MaintenanceModeProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold text-text-heading mb-2">Under Maintenance</h3>
      <p className="text-text-muted mb-4">
        We&apos;re currently updating our farm shop directory to bring you better service.
        {estimatedTime && ` Estimated completion: ${estimatedTime}`}
      </p>
      <div className="bg-background-surface rounded-lg p-4 border border-border-default/30">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="text-sm text-text-muted">
              You can still browse our existing farm shop listings, but new submissions and updates are temporarily paused.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface RateLimitExceededProps {
  retryAfter?: number
}

export function RateLimitExceeded({ retryAfter }: RateLimitExceededProps) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="font-semibold text-text-heading mb-2">Too Many Requests</h3>
      <p className="text-text-muted mb-4">
        You&apos;ve made too many requests. Please wait a moment before trying again.
        {retryAfter && ` You can retry in ${retryAfter} seconds.`}
      </p>
      <div className="bg-background-surface rounded-lg p-4 border border-border-default/30">
        <p className="text-sm text-text-muted">
          This helps us provide a better experience for all users.
        </p>
      </div>
    </div>
  )
}
