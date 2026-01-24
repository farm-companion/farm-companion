'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Global error caught:', error)
    
    // Log to external service if available
    if (process.env.NODE_ENV === 'production') {
      // Lightweight error logging
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail if logging fails
      })
    }
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background-canvas flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-text-heading mb-4">
              Something went wrong
            </h1>
            
            <p className="text-text-muted mb-6">
              We&apos;re sorry, but something unexpected happened. Our team has been notified and we&apos;re working to fix it.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-caption text-text-muted hover:text-text-heading">
                  Error Details
                </summary>
                <pre className="mt-2 p-3 bg-background-surface rounded text-small text-text-muted overflow-auto">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-serum text-white px-6 py-3 rounded-lg font-medium hover:bg-serum/90 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <Link
                href="/"
                className="w-full bg-background-surface text-text-heading px-6 py-3 rounded-lg font-medium hover:bg-background-surface/80 transition-colors flex items-center justify-center gap-2 border border-border-default"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>

            {/* Contact Info */}
            <p className="mt-6 text-caption text-text-muted">
              If this problem persists, please{' '}
              <Link href="/contact" className="text-serum hover:underline">
                contact us
              </Link>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
