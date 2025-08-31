import './globals.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
// import { Analytics } from '@vercel/analytics'
import ConsentBanner from '@/components/ConsentBanner'
import Header from '@/components/Header'
import FooterWrapper from '@/components/FooterWrapper'
import AnalyticsLoader from '@/components/AnalyticsLoader'
import { SITE_URL } from '@/lib/site'
import { SecureJsonLd, SecureStyle, SecureScript } from '@/components/SecureScripts'
import { logEnvironmentStatus } from '@/lib/secrets-management'
import { AccessibilityProvider, ComprehensiveSkipLinks } from '@/components/accessibility'
import { contentProtection } from '@/lib/content-protection'
import Watermark from '@/components/Watermark'

// Optimize font loading with next/font - preload primary font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter',
  adjustFontFallback: true
})

// Enhanced metadata for better SEO and social sharing
export const metadata: Metadata = {
  title: {
    default: 'Farm Companion - Your Local Farm Directory',
    template: '%s | Farm Companion'
  },
  description: 'Discover local farms, fresh produce, and authentic farm experiences. Connect with farmers, find seasonal produce, and explore the best of local agriculture.',
  keywords: ['farm', 'local produce', 'farmers market', 'organic', 'fresh food', 'agriculture', 'farm directory', 'local farms'],
  authors: [{ name: 'Farm Companion Team' }],
  creator: 'Farm Companion',
  publisher: 'Farm Companion',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: 'https://www.farmcompanion.co.uk',
    // Content type alternatives for feeds and APIs
    types: {
      'application/rss+xml': '/rss.xml',
      'application/atom+xml': '/atom.xml',
      'application/json': '/api/farms',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: SITE_URL,
    siteName: 'Farm Companion',
    title: 'Farm Companion - Your Local Farm Directory',
    description: 'Discover local farms, fresh produce, and authentic farm experiences.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Farm Companion - Local Farm Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farm Companion - Your Local Farm Directory',
    description: 'Discover local farms, fresh produce, and authentic farm experiences.',
    images: ['/og-image.jpg'],
    creator: '@farmcompanion',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'jQ0ZccBtvUb6xYe-dr35lDNWNTulA0tdsoKgaKTraVQ',
    yandex: '5d47005981767b7d',
    yahoo: 'your-yahoo-verification-code',
    other: {
      'msvalidate.01': 'D5F792E19E823EAE982BA6AB25F2B588',
    },
  },
  category: 'agriculture',
  classification: 'farm directory',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Farm Companion',
    'application-name': 'Farm Companion',
    'msapplication-TileColor': '#00C2B2',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#00C2B2',
  },
}

// Enhanced viewport configuration
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#00C2B2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Log environment status for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    logEnvironmentStatus();
  }

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* Security headers and CSP */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Enhanced security for content protection */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        
        {/* Disable browser features for content protection */}
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Prevent caching of sensitive content */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Multi-domain hreflang tags for SEO - all pointing to www.farmcompanion.co.uk */}
        <link rel="alternate" hrefLang="en-GB" href="https://www.farmcompanion.co.uk" />
        <link rel="alternate" hrefLang="en-GB" href="https://farmcompanion.co.uk" />
        <link rel="alternate" hrefLang="en-GB" href="https://farmcompanion.uk" />
        <link rel="alternate" hrefLang="en-GB" href="https://farmshopfinder.co.uk" />
        <link rel="alternate" hrefLang="en-GB" href="https://localfarmshops.co.uk" />
        <link rel="alternate" hrefLang="en-GB" href="https://www.localfarmshops.co.uk" />
        <link rel="alternate" hrefLang="x-default" href="https://www.farmcompanion.co.uk" />
      </head>
      <body className="min-h-screen text-gray-900 antialiased">
        {/* Minimal Content Protection - Disabled for now */}
        <Script
          id="content-protection"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Content protection temporarily disabled for site functionality
              if (typeof window !== 'undefined') {
                console.log('🛡️ Content protection disabled - site functionality restored');
              }
            `
          }}
        />
        
        {/* Enhanced Watermark Component */}
        <Watermark 
          enabled={true}
          opacity={0.06}
          text={[
            'Farm Companion',
            'farmcompanion.co.uk',
            '© 2024 Farm Companion',
            'Protected Content',
            'Do Not Copy',
            'Confidential',
            'Private Property',
            'All Rights Reserved'
          ]}
          animationSpeed={25}
        />
        
        {/* Accessibility Provider */}
        <AccessibilityProvider>
          {/* Skip Links for Accessibility */}
          <ComprehensiveSkipLinks />
          
          {/* Main Content */}
          <div className="flex min-h-screen flex-col">
            {/* Header */}
            <Header />
            
            {/* Main Content Area */}
            <main className="flex-1" id="main-content">
              {children}
            </main>
            
            {/* Footer */}
            <FooterWrapper />
          </div>
          
          {/* Consent Banner */}
          <ConsentBanner />
          
          {/* Analytics Loader */}
          <AnalyticsLoader />
        </AccessibilityProvider>
        
        {/* Secure Scripts */}
        <SecureJsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: 'Farm Companion',
          description: 'Discover local farms, fresh produce, and authentic farm experiences.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/map?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
        }} />
        <SecureStyle content={`
          /* Enhanced skip link styles */
          .skip-link {
            position: absolute;
            top: -40px;
            left: 6px;
            background: #00C2B2;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1000;
            transition: top 0.2s ease;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .skip-link:focus {
            top: 6px;
            outline: 2px solid #fff;
            outline-offset: 2px;
          }
          .skip-link--visible {
            top: 6px;
          }
          
          /* Accessibility focus styles */
          .focus-visible {
            outline: 2px solid #00C2B2;
            outline-offset: 2px;
          }
          
          /* Reduced motion support */
          .motion-reduce * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          
          /* High contrast mode */
          .high-contrast {
            --text-heading: #000000;
            --text-body: #000000;
            --background-canvas: #ffffff;
            --primary-500: #000000;
            --primary-600: #000000;
          }
          
          /* Keyboard-only mode */
          .keyboard-only *:focus {
            outline: 2px solid #00C2B2 !important;
            outline-offset: 2px !important;
          }
          
          /* Minimum touch targets */
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          
          .theme-ready {
            visibility: visible;
          }
          html:not(.theme-ready) {
            visibility: hidden;
          }
          /* Fallback: ensure content is visible after 2 seconds */
          html.theme-ready {
            visibility: visible;
          }
        `} />
        <SecureScript content={`
          // Content protection temporarily disabled for site functionality
          (function() {
            console.log('🛡️ SecureScript content protection disabled - site functionality restored');
          })();
        `} />
        
        {/* Developer Tools Detection - Disabled for now */}
        <Script
          id="content-protection-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Developer tools detection temporarily disabled for site functionality
              if (typeof window !== 'undefined') {
                console.log('🛡️ Developer tools detection disabled - site functionality restored');
              }
            `
          }}
        />
      </body>
    </html>
  )
}
