/**
 * useCommandPalette Hook
 *
 * Manages command palette state and keyboard shortcuts.
 * Listens for CMD+K / Ctrl+K and custom events.
 *
 * Design System Compliance:
 * - Keyboard-first navigation pattern
 * - Escape to close
 * - Focus trap when open
 */

import { useState, useEffect, useCallback } from 'react'

export interface UseCommandPaletteResult {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * Hook for managing command palette state with keyboard shortcuts.
 */
export function useCommandPalette(): UseCommandPaletteResult {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  useEffect(() => {
    // Listen for CMD+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        close()
      }
    }

    // Listen for custom event from CommandTrigger button
    const handleCustomOpen = () => open()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleCustomOpen)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleCustomOpen)
    }
  }, [isOpen, open, close, toggle])

  return { isOpen, open, close, toggle }
}

export default useCommandPalette
