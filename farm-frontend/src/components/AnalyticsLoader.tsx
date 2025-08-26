'use client'
import Script from 'next/script'

export default function AnalyticsLoader() {
  const consent = (() => {
    try { 
      return JSON.parse(decodeURIComponent((document.cookie.split('; ').find(c=>c.startsWith('fc_consent='))||'').split('=')[1]||'{}')) 
    }
    catch { 
      return {} 
    }
  })() as { analytics?: boolean }

  if (!consent.analytics || !process.env.NEXT_PUBLIC_GA_ID) return null

  return (
    <>
      <Script 
        id="ga" 
        strategy="afterInteractive" 
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} 
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date()); gtag('config','${process.env.NEXT_PUBLIC_GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  )
}
