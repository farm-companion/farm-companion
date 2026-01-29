'use client'

import React, { useEffect, useRef, useState, useCallback, memo } from 'react'
import { Marker, Map as MapLibreMapInstance, Popup } from 'maplibre-gl'
import { FarmShop } from '@/types/farm'
import { getPinForFarm, CategoryPinConfig, DEFAULT_PIN } from '@/features/map/lib/pin-icons'
import { isCurrentlyOpen } from '@/lib/farm-status'

// =============================================================================
// TYPES
// =============================================================================

export interface FarmMarkerProps {
  /** Farm data to display */
  farm: FarmShop
  /** MapLibre map instance */
  map: MapLibreMapInstance
  /** Whether this marker is currently selected */
  selected?: boolean
  /** Whether this marker is currently hovered */
  hovered?: boolean
  /** Callback when marker is clicked */
  onClick?: (farm: FarmShop) => void
  /** Callback when marker is hovered */
  onHover?: (farm: FarmShop | null) => void
  /** Size of the marker in pixels */
  size?: number
  /** Z-index offset for layering */
  zIndex?: number
}

export interface MarkerElement extends HTMLDivElement {
  _farmId?: string
}

// =============================================================================
// MARKER SVG GENERATION
// =============================================================================

/**
 * Generate marker SVG with category styling and status indicator
 */
function generateMarkerSVG(
  config: CategoryPinConfig,
  size: number,
  isOpen: boolean,
  isSelected: boolean,
  isHovered: boolean
): string {
  const scale = isSelected ? 1.2 : isHovered ? 1.1 : 1
  const effectiveSize = size * scale
  const innerSize = effectiveSize * 0.5
  const centerOffset = (effectiveSize - innerSize) / 2

  // Status dot colors
  const statusColor = isOpen ? '#22C55E' : '#EF4444' // green-500 / red-500
  const statusSize = effectiveSize * 0.25

  // Glow effect for selected/hovered states
  const glowOpacity = isSelected ? 0.4 : isHovered ? 0.2 : 0
  const strokeWidth = isSelected ? 3 : isHovered ? 2.5 : 2

  return `
    <svg width="${effectiveSize + 4}" height="${effectiveSize + 8}" viewBox="0 0 ${effectiveSize + 4} ${effectiveSize + 8}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pin-gradient-${config.slug}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${config.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustColor(config.color, -30)};stop-opacity:1" />
        </linearGradient>
        <filter id="pin-shadow-${config.slug}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
        </filter>
        ${glowOpacity > 0 ? `
        <filter id="pin-glow-${config.slug}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        ` : ''}
      </defs>

      <!-- Main pin -->
      <g transform="translate(2, 2)" filter="url(#pin-shadow-${config.slug})" ${glowOpacity > 0 ? `style="filter: url(#pin-glow-${config.slug})"` : ''}>
        <!-- Pin body -->
        <circle
          cx="${effectiveSize / 2}"
          cy="${effectiveSize / 2}"
          r="${effectiveSize / 2 - strokeWidth / 2}"
          fill="url(#pin-gradient-${config.slug})"
          stroke="white"
          stroke-width="${strokeWidth}"
        />

        <!-- Category icon -->
        <g transform="translate(${centerOffset}, ${centerOffset}) scale(${innerSize / 16})" fill="white">
          <path d="${config.iconPath}"/>
        </g>

        <!-- Pin tail/pointer -->
        <path
          d="M ${effectiveSize / 2 - 6} ${effectiveSize - 2} L ${effectiveSize / 2} ${effectiveSize + 6} L ${effectiveSize / 2 + 6} ${effectiveSize - 2}"
          fill="url(#pin-gradient-${config.slug})"
          stroke="white"
          stroke-width="${strokeWidth}"
          stroke-linejoin="round"
        />
      </g>

      <!-- Status indicator dot -->
      <circle
        cx="${effectiveSize - statusSize / 2 + 2}"
        cy="${statusSize / 2 + 2}"
        r="${statusSize / 2}"
        fill="${statusColor}"
        stroke="white"
        stroke-width="1.5"
      />
    </svg>
  `.trim()
}

/**
 * Adjust hex color brightness
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Farm Marker Component for MapLibre GL
 *
 * Renders a category-colored marker with:
 * - Category-based icon (from pin-icons.ts)
 * - Open/closed status indicator dot
 * - Hover and selected states with scaling and glow
 * - Accessible keyboard navigation
 *
 * Usage:
 * ```tsx
 * <FarmMarker
 *   farm={farm}
 *   map={mapInstance}
 *   selected={selectedFarmId === farm.id}
 *   onClick={(farm) => setSelectedFarm(farm)}
 *   onHover={(farm) => setHoveredFarm(farm)}
 * />
 * ```
 */
export const FarmMarker = memo(function FarmMarker({
  farm,
  map,
  selected = false,
  hovered = false,
  onClick,
  onHover,
  size = 36,
  zIndex = 1,
}: FarmMarkerProps) {
  const markerRef = useRef<Marker | null>(null)
  const elementRef = useRef<MarkerElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Check open status on mount and periodically
  useEffect(() => {
    const checkStatus = () => {
      setIsOpen(isCurrentlyOpen(farm.hours))
    }
    checkStatus()

    // Update status every minute
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [farm.hours])

  // Get pin configuration based on farm offerings
  const pinConfig = getPinForFarm(farm.offerings) || DEFAULT_PIN

  // Create or update marker element
  const updateMarkerElement = useCallback(() => {
    if (!elementRef.current) return

    const svg = generateMarkerSVG(pinConfig, size, isOpen, selected, hovered)
    elementRef.current.innerHTML = svg

    // Update z-index for layering
    const effectiveZIndex = selected ? zIndex + 100 : hovered ? zIndex + 50 : zIndex
    elementRef.current.style.zIndex = String(effectiveZIndex)
  }, [pinConfig, size, isOpen, selected, hovered, zIndex])

  // Initialize marker
  useEffect(() => {
    if (!map || !farm.location?.lat || !farm.location?.lng) return

    // Create marker element
    const el = document.createElement('div') as MarkerElement
    el._farmId = farm.id
    el.className = 'farm-marker'
    el.style.cursor = 'pointer'
    el.style.transition = 'transform 0.15s ease-out'
    el.setAttribute('role', 'button')
    el.setAttribute('aria-label', `${farm.name}${isOpen ? ', currently open' : ', currently closed'}`)
    el.setAttribute('tabindex', '0')

    elementRef.current = el

    // Create MapLibre marker
    const marker = new Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([farm.location.lng, farm.location.lat])
      .addTo(map)

    markerRef.current = marker

    // Event handlers
    const handleClick = (e: Event) => {
      e.stopPropagation()
      onClick?.(farm)
    }

    const handleMouseEnter = () => {
      onHover?.(farm)
    }

    const handleMouseLeave = () => {
      onHover?.(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick?.(farm)
      }
    }

    // Touch handlers - must capture touchstart to prevent map pan
    const handleTouchStart = (e: TouchEvent) => {
      e.stopPropagation()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onClick?.(farm)
    }

    el.addEventListener('click', handleClick)
    el.addEventListener('mouseenter', handleMouseEnter)
    el.addEventListener('mouseleave', handleMouseLeave)
    el.addEventListener('keydown', handleKeyDown)
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Initial render
    updateMarkerElement()

    // Cleanup
    return () => {
      el.removeEventListener('click', handleClick)
      el.removeEventListener('mouseenter', handleMouseEnter)
      el.removeEventListener('mouseleave', handleMouseLeave)
      el.removeEventListener('keydown', handleKeyDown)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
      marker.remove()
      markerRef.current = null
      elementRef.current = null
    }
  }, [map, farm.id, farm.name, farm.location?.lat, farm.location?.lng, onClick, onHover, isOpen])

  // Update visual state when selected/hovered changes
  useEffect(() => {
    updateMarkerElement()
  }, [updateMarkerElement])

  // Update aria-label when status changes
  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.setAttribute(
        'aria-label',
        `${farm.name}${isOpen ? ', currently open' : ', currently closed'}`
      )
    }
  }, [farm.name, isOpen])

  // This component manages a MapLibre Marker imperatively
  return null
})

// =============================================================================
// MARKER LAYER COMPONENT
// =============================================================================

export interface FarmMarkerLayerProps {
  /** Array of farms to display as markers */
  farms: FarmShop[]
  /** MapLibre map instance */
  map: MapLibreMapInstance | null
  /** Currently selected farm ID */
  selectedFarmId?: string | null
  /** Currently hovered farm ID */
  hoveredFarmId?: string | null
  /** Callback when a marker is clicked */
  onMarkerClick?: (farm: FarmShop) => void
  /** Callback when a marker is hovered */
  onMarkerHover?: (farm: FarmShop | null) => void
}

/**
 * Farm Marker Layer
 *
 * Manages a collection of FarmMarker components for efficient rendering.
 * Handles selection and hover state propagation.
 */
export function FarmMarkerLayer({
  farms,
  map,
  selectedFarmId,
  hoveredFarmId,
  onMarkerClick,
  onMarkerHover,
}: FarmMarkerLayerProps) {
  if (!map) return null

  return (
    <>
      {farms.map((farm, index) => (
        <FarmMarker
          key={farm.id}
          farm={farm}
          map={map}
          selected={selectedFarmId === farm.id}
          hovered={hoveredFarmId === farm.id}
          onClick={onMarkerClick}
          onHover={onMarkerHover}
          zIndex={index}
        />
      ))}
    </>
  )
}

export default FarmMarker
