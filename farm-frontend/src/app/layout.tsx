import './globals.css'

import type { Metadata } from 'next'
import Script from 'next/script'
// import { Analytics } from '@vercel/analytics'
import ConsentBanner from '@/components/ConsentBanner'
import Header from '@/components/Header'
import FooterWrapper from '@/components/FooterWrapper'
import AnalyticsLoader from '@/components/AnalyticsLoader'
import { AriaLiveRegion } from '@/components/accessibility/AriaLiveRegion'
import { SkipLinks } from '@/components/accessibility/SkipLinks'
import { BottomNav } from '@/components/navigation/BottomNav'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Farm Companion',
    template: '%s · Farm Companion',
  },
  description: 'Discover 1,300+ authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information. Find farm shops near you, farmshopsnearme, farm shop near you with our interactive map and location-based search.',
  keywords: [
    'farm shops', 'UK farm shops', 'local produce', 'fresh food', 'farm directory', 
    'farm shop near me', 'farmshopsnearme', 'farm shop near you', 'farms near me', 
    'local farms', 'seasonal produce', 'farm fresh', 'UK farms', 'farm shop directory', 
    'local food', 'farm to table', 'farm shops near me', 'farm shops near you',
    'farm shop directory near me', 'farm shops UK', 'local farm shops', 'farm shop finder',
    'farm shops map', 'farm shop locations', 'farm shop search', 'farm shop locator',
    'farm shops in my area', 'farm shops nearby', 'farm shops close to me',
    'farm shop directory UK', 'farm shop finder near me', 'farm shop search near me'
  ],
  authors: [{ name: 'Farm Companion' }],
  creator: 'Farm Companion',
  publisher: 'Farm Companion',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Farm Companion',
    title: 'Farm Companion — UK farm shops directory',
    description: 'Find trusted farm shops near you, farmshopsnearme, farm shop near you with verified information and the freshest local produce. Use our interactive map to discover farm shops in your area.',
    images: [
      { 
        url: `${SITE_URL}/og.jpg`, 
        width: 1200, 
        height: 630, 
        alt: 'Farm Companion - UK farm shops directory',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farm Companion — UK farm shops directory',
    description: 'Find trusted farm shops near you, farmshopsnearme, farm shop near you with verified information and the freshest local produce. Use our interactive map to discover farm shops in your area.',
    images: [`${SITE_URL}/og.jpg`],
    creator: '@farmcompanion',
  },
  alternates: {
    canonical: '/',
  },
  other: {
    'theme-color': '#00C2B2',
    'color-scheme': 'light dark',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Site-wide WebSite + SearchAction JSON-LD
  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: 'Farm Companion',
    description: 'Discover authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/map?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Site-wide structured data - optimized with next/script */}
        <Script
          id="site-jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        
                 {/* Critical CSS - inlined to prevent render-blocking */}
         <style dangerouslySetInnerHTML={{
           __html: `
             .skip-link {
               position: absolute;
               top: -40px;
               left: 6px;
               background: #00C2B2;
               color: white;
               padding: 8px;
               text-decoration: none;
               border-radius: 4px;
               z-index: 1000;
               transition: top 0.2s ease;
             }
             .skip-link:focus {
               top: 6px;
             }
             /* Ensure content is always visible */
             html, body {
               visibility: visible !important;
             }
             .theme-ready {
               visibility: visible !important;
             }
           `
         }} />
        
        {/* Preload critical LCP resources */}
        {/* Removed overlay-banner.jpg preload - not used above the fold */}
        
        {/* Preload critical font weights for above-the-fold content */}
        <link rel="preload" href="/fonts/clash-display/ClashDisplay-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/clash-display/ClashDisplay-Semibold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/clash-display/ClashDisplay-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* Google Analytics - now handled by AnalyticsLoader component */}
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Comprehensive Favicon Setup */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />

        {/* Preconnect to critical domains for performance - optimized network tree */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* Bing Webmaster Tools Verification */}
        <meta name="msvalidate.01" content="D5F792E19E823EAE982BA6AB25F2B588" />
        
        {/* Bing-specific meta tags for better indexing */}
        <meta name="msapplication-TileColor" content="#00C2B2" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#00C2B2" />
        
        {/* Theme detection script - optimized with next/script */}
        <Script
          id="theme-detection"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get theme preference
                  var theme = localStorage.getItem('theme');
                  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  // Apply theme immediately
                  if (theme === 'dark' || (!theme && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.remove('dark', 'light');
                  }
                  
                  // Listen for system theme changes
                  var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                  mediaQuery.addEventListener('change', function(e) {
                    // Only auto-switch if no manual theme is set
                    if (!localStorage.getItem('theme')) {
                      if (e.matches) {
                        document.documentElement.classList.add('dark');
                        document.documentElement.classList.remove('light');
                      } else {
                        document.documentElement.classList.remove('dark');
                        document.documentElement.classList.remove('light');
                      }
                      // Dispatch event for components to update
                      window.dispatchEvent(new Event('theme-changed'));
                    }
                  });
                  
                  // Mark theme as ready and show content immediately
                  document.documentElement.classList.add('theme-ready');
                  
                  // Also ensure content is visible after DOM is ready
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      document.documentElement.classList.add('theme-ready');
                    });
                  } else {
                    document.documentElement.classList.add('theme-ready');
                  }
                  
                } catch (e) {
                  console.warn('Theme detection failed:', e);
                  // Fallback: show content even if theme detection fails
                  document.documentElement.classList.add('theme-ready');
                }
                
                // Ensure content is always visible after a short delay as final fallback
                setTimeout(function() {
                  document.documentElement.classList.add('theme-ready');
                }, 50);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background-canvas text-text-body antialiased">
        {/* Accessibility Components */}
        <SkipLinks />
        <AriaLiveRegion />

        {/* Header */}
        <Header />

        {/* Page content */}
        <main id="main-content" className="flex-1" role="main">{children}</main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />

        {/* Consent */}
        <ConsentBanner />

        {/* Footer - conditionally hidden on map page */}
        <FooterWrapper />

        {/* Vercel Analytics */}
        {/* <Analytics /> */}

        {/* Consent-gated Analytics */}
        <AnalyticsLoader />

        {/* Force deployment to remove all content protection - right-click should work */}

      </body>
    </html>
  )
}
