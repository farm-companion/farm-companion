'use client'

import { useEffect, useState } from 'react'
import { MapPin, Search, Globe, Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  isLoading: boolean
  stage: 'initializing' | 'loading-data' | 'preparing-map' | 'ready'
  progress?: number
  message?: string
}

export default function LoadingOverlay({ 
  isLoading, 
  stage, 
  progress = 0,
  message 
}: LoadingOverlayProps) {
  const [shouldRender, setShouldRender] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true)
      // Small delay to ensure smooth fade-in
      setTimeout(() => setIsVisible(true), 50)
    } else {
      setIsVisible(false)
      // Delay hiding to allow fade-out animation
      setTimeout(() => setShouldRender(false), 300)
    }
  }, [isLoading])

  if (!shouldRender) return null

  const getStageIcon = () => {
    switch (stage) {
      case 'initializing':
        return <Loader2 className="w-6 h-6 animate-spin text-serum" />
      case 'loading-data':
        return <Globe className="w-6 h-6 text-serum" />
      case 'preparing-map':
        return <MapPin className="w-6 h-6 text-serum" />
      case 'ready':
        return <Search className="w-6 h-6 text-serum" />
      default:
        return <Loader2 className="w-6 h-6 animate-spin text-serum" />
    }
  }

  const getStageMessage = () => {
    if (message) return message
    
    switch (stage) {
      case 'initializing':
        return 'Initializing map system...'
      case 'loading-data':
        return 'Loading farm data...'
      case 'preparing-map':
        return 'Preparing map view...'
      case 'ready':
        return 'Ready to explore!'
      default:
        return 'Loading...'
    }
  }

  return (
    <div className={`fixed inset-0 bg-background-canvas/95 backdrop-blur-md z-50 transition-all duration-300 ease-out ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center gap-6">
          {/* Main loading indicator */}
          <div className="relative">
            {/* Outer timing circle */}
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-serum/20"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * progress) / 100}
                className="text-serum transition-all duration-500 ease-out"
              />
            </svg>
            
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {getStageIcon()}
            </div>
          </div>

          {/* Stage message */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-text-heading mb-2">
              {getStageMessage()}
            </h3>
            <p className="text-sm text-text-muted">
              {stage === 'initializing' && 'Setting up the map system...'}
              {stage === 'loading-data' && 'Fetching farm locations and details...'}
              {stage === 'preparing-map' && 'Configuring map view and markers...'}
              {stage === 'ready' && 'Map is ready for exploration!'}
            </p>
          </div>

          {/* Progress bar */}
          {progress > 0 && progress < 100 && (
            <div className="w-64 bg-background-surface rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-serum transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Anticipatory indicators */}
          <div className="flex gap-2 mt-4">
            <div className="w-2 h-2 bg-serum/60 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-serum/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-serum/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
