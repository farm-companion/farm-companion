'use client'

import { useEffect, useState } from 'react'
import { Shield, Settings, X } from 'lucide-react'

type Consent = 'granted' | 'denied' | null

export default function ConsentBanner() {
  const [consent, setConsent] = useState<Consent>(null)
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = (typeof window !== 'undefined' && localStorage.getItem('fc_consent')) as Consent | null
    if (saved === 'granted' || saved === 'denied') setConsent(saved)
    
    // Animate in after mount
    if (!saved) {
      setTimeout(() => setIsVisible(true), 100)
    }
  }, [])

  useEffect(() => {
    if (!mounted || consent === null) return
    localStorage.setItem('fc_consent', consent)
    window.dispatchEvent(new CustomEvent('fc:consent', { detail: consent }))
  }, [consent, mounted])

  const handleConsent = (choice: 'granted' | 'denied') => {
    setIsVisible(false)
    setTimeout(() => setConsent(choice), 300)
  }

  if (!mounted || consent) return null

  return (
    <>
      {/* Backdrop overlay for premium feel */}
      <div 
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
      
      {/* Main banner */}
      <div
        role="region"
        aria-label="Cookie consent"
        className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-500 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {/* Premium glass-morphism container */}
        <div className="relative mx-auto max-w-4xl px-4 pb-6 pt-4">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent dark:from-cyan-500/10" />
            
            {/* Content */}
            <div className="relative px-6 py-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-500/20">
                    <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-body font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                    Privacy & Cookies
                  </h3>
                  <p className="text-caption leading-relaxed text-zinc-700 dark:text-zinc-300 mb-4">
                    We use essential cookies to run this site and optional analytics to improve your experience.
                    Your privacy is important to us.
                  </p>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Accept button - Primary action */}
                    <button
                      onClick={() => handleConsent('granted')}
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-caption font-semibold text-white uppercase tracking-wide transition-all duration-200 hover:bg-cyan-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                    >
                      Accept All
                    </button>
                    
                    {/* Decline button - Secondary action */}
                    <button
                      onClick={() => handleConsent('denied')}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2.5 text-caption font-semibold text-zinc-800 uppercase tracking-wide transition-all duration-200 hover:bg-zinc-200 hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
                    >
                      Decline
                    </button>

                    {/* Settings link */}
                    <a
                      href="/privacy"
                      className="inline-flex items-center gap-1.5 text-caption font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 rounded px-2 py-1 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus:ring-offset-zinc-900"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </a>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => handleConsent('denied')}
                  className="flex-shrink-0 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 dark:focus:ring-offset-zinc-900"
                  aria-label="Close cookie banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
