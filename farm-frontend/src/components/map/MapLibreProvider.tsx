'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { getMapConfig, type MapConfig } from '@/lib/map-config'

// =============================================================================
// CONTEXT
// =============================================================================

interface MapLibreContextValue {
  /** Current map configuration */
  config: MapConfig
  /** Whether dark mode is active */
  isDarkMode: boolean
  /** MapTiler API key (if available) */
  maptilerKey: string | null
  /** Whether MapLibre is supported in this browser */
  isSupported: boolean
  /** Loading state for initial setup */
  isLoading: boolean
}

const MapLibreContext = createContext<MapLibreContextValue | null>(null)

// =============================================================================
// PROVIDER
// =============================================================================

interface MapLibreProviderProps {
  children: React.ReactNode
  /** Optional MapTiler API key for higher quality tiles */
  maptilerKey?: string
}

/**
 * MapLibre Context Provider
 *
 * Provides map configuration and theme awareness to all map components.
 * Automatically switches between light/dark map styles based on theme.
 *
 * Usage:
 * ```tsx
 * <MapLibreProvider>
 *   <MapLibreMap />
 * </MapLibreProvider>
 * ```
 */
export function MapLibreProvider({ children, maptilerKey }: MapLibreProviderProps) {
  const { resolvedTheme } = useTheme()
  const [isSupported, setIsSupported] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Check WebGL support
  useEffect(() => {
    const checkSupport = () => {
      try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        setIsSupported(!!gl)
      } catch {
        setIsSupported(false)
      }
      setIsLoading(false)
    }

    checkSupport()
  }, [])

  const isDarkMode = resolvedTheme === 'dark'

  // Get environment variables
  const envMaptilerKey = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_MAPTILER_API_KEY
    : null

  const config = useMemo(() => {
    return getMapConfig({
      isDarkMode,
      maptilerKey: maptilerKey || envMaptilerKey || undefined,
    })
  }, [isDarkMode, maptilerKey, envMaptilerKey])

  const value = useMemo<MapLibreContextValue>(() => ({
    config,
    isDarkMode,
    maptilerKey: maptilerKey || envMaptilerKey || null,
    isSupported,
    isLoading,
  }), [config, isDarkMode, maptilerKey, envMaptilerKey, isSupported, isLoading])

  return (
    <MapLibreContext.Provider value={value}>
      {children}
    </MapLibreContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to access MapLibre context
 *
 * @throws Error if used outside of MapLibreProvider
 */
export function useMapLibre(): MapLibreContextValue {
  const context = useContext(MapLibreContext)

  if (!context) {
    throw new Error('useMapLibre must be used within a MapLibreProvider')
  }

  return context
}

/**
 * Hook to safely access MapLibre context (returns null if not in provider)
 */
export function useMapLibreSafe(): MapLibreContextValue | null {
  return useContext(MapLibreContext)
}

export default MapLibreProvider
