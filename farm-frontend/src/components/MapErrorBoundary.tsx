'use client'

import React, { Component, ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorType?: 'network' | 'geolocation' | 'tiles' | 'general'
}

export default class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Determine error type for better UX
    let errorType: 'network' | 'geolocation' | 'tiles' | 'general' = 'general'
    
    if (error.message.includes('geolocation') || error.message.includes('location')) {
      errorType = 'geolocation'
    } else if (error.message.includes('tile') || error.message.includes('map')) {
      errorType = 'tiles'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = 'network'
    }

    return { hasError: true, error, errorType }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map error caught:', error, errorInfo)
    
    // Log to error tracking service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          component: 'MapErrorBoundary',
        }),
      }).catch(() => {
        // Silently fail if logging fails
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorType: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI based on error type
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="h-full min-h-[400px] bg-background-surface rounded-xl border border-border-default/30 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            {/* Error Icon */}
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              {this.state.errorType === 'network' ? (
                <WifiOff className="w-6 h-6 text-red-600" />
              ) : this.state.errorType === 'geolocation' ? (
                <MapPin className="w-6 h-6 text-red-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
            </div>

            {/* Error Message */}
            <h3 className="font-semibold text-text-heading mb-2">
              {this.state.errorType === 'network' && 'Connection Issue'}
              {this.state.errorType === 'geolocation' && 'Location Access'}
              {this.state.errorType === 'tiles' && 'Map Loading Error'}
              {this.state.errorType === 'general' && 'Map Error'}
            </h3>

            <p className="text-sm text-text-muted mb-4">
              {this.state.errorType === 'network' && 
                'Unable to load map data. Please check your internet connection.'}
              {this.state.errorType === 'geolocation' && 
                'Location access is required to show nearby farms. Please enable location services.'}
              {this.state.errorType === 'tiles' && 
                'Map tiles failed to load. Please try refreshing the page.'}
              {this.state.errorType === 'general' && 
                'Something went wrong loading the map. Please try again.'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="w-full bg-serum text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-serum/90 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              {this.state.errorType === 'geolocation' && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-background-canvas text-text-heading px-4 py-2 rounded-lg text-sm font-medium hover:bg-background-canvas/80 transition-colors border border-border-default"
                >
                  Reload Page
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
