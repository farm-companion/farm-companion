'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Renders an email link that is assembled client-side to prevent bot scraping.
 *
 * SSR output contains no email in plain text or href. The address is split
 * into parts and joined only after hydration. A hidden honeypot field baits
 * naive crawlers that parse raw HTML for mailto: links.
 */
export default function ObfuscatedEmail({
  user = 'hello',
  domain = 'farmcompanion',
  tld = 'co.uk',
  className = '',
  label,
}: {
  user?: string
  domain?: string
  tld?: string
  className?: string
  label?: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!ref.current) return
    const addr = [user, '@', domain, '.', tld].join('')
    ref.current.href = ['m', 'a', 'i', 'l', 't', 'o', ':'].join('') + addr
    ref.current.textContent = label || addr
  }, [user, domain, tld, label])

  return (
    <>
      {/* Honeypot: hidden decoy to trap bots that parse raw HTML */}
      <a
        href="mailto:noreply@example.com"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
      />
      <a
        ref={ref}
        className={className}
        rel="nofollow"
      >
        {mounted ? null : 'Get in touch'}
      </a>
    </>
  )
}
