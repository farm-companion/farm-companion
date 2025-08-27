'use client'

import React, { Component, ReactNode } from 'react'
import { Database } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { WifiOff } from 'lucide-react'
import { Search } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  dataType?: 'farms' | 'produce' | 'general'
}

interface State {
  hasError: boolean
  error?: Error
  errorType?: 'network' | 'data' | 'empty' | 'general'
}

export default class DataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Determine error type for better UX
    let errorType: 'network' | 'data' | 'empty' | 'general' = 'general'
    
    if (error.message.includes('fetch') || error.message.includes('network')) {
      errorType = 'network'
    } else if (error.message.includes('data') || error.message.includes('parse')) {
      errorType = 'data'
    } else if (error.message.includes('empty') || error.message.includes('no results')) {
      errorType = 'empty'
    }

    return { hasError: true, error, errorType }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Data error caught:', error, errorInfo)
    
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
          component: 'DataErrorBoundary',
          dataType: this.props.dataType,
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

      const dataTypeLabel = this.props.dataType === 'farms' ? 'farm shops' : 
                           this.props.dataType === 'produce' ? 'produce' : 'data'

      return (
        <div className="bg-background-surface rounded-xl border border-border-default/30 p-6">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              {this.state.errorType === 'network' ? (
                <WifiOff className="w-6 h-6 text-red-600" />
              ) : this.state.errorType === 'empty' ? (
                <Search className="w-6 h-6 text-red-600" />
              ) : (
                <Database className="w-6 h-6 text-red-600" />
              )}
            </div>

            {/* Error Message */}
            <h3 className="font-semibold text-text-heading mb-2">
              {this.state.errorType === 'network' && 'Connection Issue'}
              {this.state.errorType === 'data' && 'Data Loading Error'}
              {this.state.errorType === 'empty' && 'No Results Found'}
              {this.state.errorType === 'general' && 'Loading Error'}
            </h3>

            <p className="text-sm text-text-muted mb-4">
              {this.state.errorType === 'network' && 
                `Unable to load ${dataTypeLabel}. Please check your internet connection.`}
              {this.state.errorType === 'data' && 
                `Failed to load ${dataTypeLabel}. Please try again.`}
              {this.state.errorType === 'empty' && 
                `No ${dataTypeLabel} found matching your criteria.`}
              {this.state.errorType === 'general' && 
                `Something went wrong loading ${dataTypeLabel}. Please try again.`}
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

              {this.state.errorType === 'network' && (
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
