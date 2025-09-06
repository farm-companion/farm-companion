'use client'

import React from 'react'
import Link from 'next/link'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={`skip-link ${className}`}
      tabIndex={1}
    >
      {children}
    </Link>
  )
}

export function SkipLinks() {
  return (
    <div className="skip-links">
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#navigation">
        Skip to navigation
      </SkipLink>
      <SkipLink href="#search">
        Skip to search
      </SkipLink>
    </div>
  )
}
