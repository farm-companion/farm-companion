'use client'

import React from 'react'
import { Button, ButtonProps } from '@/components/ui/Button'
import { useAnnouncement } from './AriaLiveRegion'

interface AccessibleButtonProps extends ButtonProps {
  announceOnClick?: boolean
  announcementText?: string
  loadingAnnouncement?: string
}

export function AccessibleButton({
  announceOnClick = false,
  announcementText,
  loadingAnnouncement = 'Loading...',
  loading = false,
  children,
  onClick,
  ...props
}: AccessibleButtonProps) {
  const announce = useAnnouncement()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (announceOnClick && announcementText) {
      announce(announcementText)
    }
    
    if (onClick) {
      onClick(event)
    }
  }

  // Announce loading state
  React.useEffect(() => {
    if (loading && loadingAnnouncement) {
      announce(loadingAnnouncement, 'polite')
    }
  }, [loading, loadingAnnouncement, announce])

  return (
    <Button
      {...props}
      loading={loading}
      onClick={handleClick}
      aria-disabled={loading}
    >
      {children}
    </Button>
  )
}
