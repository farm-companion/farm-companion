'use client'

import { useEffect, useState } from 'react'
type Consent = 'granted' | 'denied' | null

export default function ConsentBanner() {
  const [consent, setConsent] = useState<Consent>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = (typeof window !== 'undefined' && localStorage.getItem('fc_consent')) as Consent | null
    if (saved === 'granted' || saved === 'denied') setConsent(saved)
  }, [])

  useEffect(() => {
    if (!mounted || consent === null) return
    localStorage.setItem('fc_consent', consent)
    window.dispatchEvent(new CustomEvent('fc:consent', { detail: consent }))
  }, [consent, mounted])

  if (!mounted || consent) return null

  return (
    <div
      role="region"
      aria-label="Cookie consent"
              className="fixed inset-x-0 bottom-0 z-50 border-t bg-background-canvas/95 text-text-body backdrop-blur
                 dark:border-gray-700 dark:bg-[#121D2B]/95 dark:text-[#E4E2DD]"
    >
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-3">
        <p className="text-sm">
          We use a small number of cookies to run this site. With your consent, we&apos;ll also load
          basic analytics. You can change this any time in
          {' '}<a className="underline decoration-1 underline-offset-2 hover:no-underline dark:text-[#E4E2DD]" href="/privacy">Privacy</a>.
        </p>
        <div className="flex shrink-0 gap-2">
          {/* Secondary button — high contrast in dark mode */}
          <button
            onClick={() => setConsent('denied')}
                          className="rounded border border-border-default px-3 py-1.5 text-sm text-text-body hover:bg-background-surface
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4FF4F]
                       dark:border-gray-500 dark:text-[#E4E2DD] dark:hover:bg-[#1E1F23]"
          >
            Decline
          </button>
          {/* Primary button — brand teal with DARK text for WCAG contrast */}
          <button
            onClick={() => setConsent('granted')}
            className="rounded px-3 py-1.5 text-sm font-medium bg-[#00C2B2] text-[#121D2B] hover:brightness-95
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4FF4F]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
