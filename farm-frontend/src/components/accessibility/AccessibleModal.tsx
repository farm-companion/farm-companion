'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocusManagement } from '@/lib/accessibility'
import { Button } from '@/components/ui/Button'

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { trapFocus, restoreFocus, saveFocus } = useFocusManagement()

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      saveFocus()
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      
      // Set focus to modal
      if (modalRef.current) {
        modalRef.current.focus()
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      restoreFocus()
    }
  }, [isOpen, onClose, closeOnEscape, saveFocus, restoreFocus])

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef.current)
      return cleanup
    }
  }, [isOpen, trapFocus])

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button
            variant="tertiary"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </Button>
        </div>
        
        <div id="modal-description" className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
