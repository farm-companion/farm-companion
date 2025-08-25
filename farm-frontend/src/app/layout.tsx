import './globals.css'

import type { Metadata } from 'next'
// import { Analytics } from '@vercel/analytics'
import ConsentBanner from '@/components/ConsentBanner'
import Header from '@/components/Header'
import FooterWrapper from '@/components/FooterWrapper'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
    siteName: 'Farm Companion',
    title: 'Farm Companion — UK farm shops directory',
    description: 'Find trusted farm shops near you, farmshopsnearme, farm shop near you with verified information and the freshest local produce. Use our interactive map to discover farm shops in your area.',
    images: [
      { 
        url: '/og.jpg', 
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
    images: ['/og.jpg'],
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FQ0B9L8MFE"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-FQ0B9L8MFE');
            `,
          }}
        />
        
        {/* Font declarations */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Comprehensive Favicon Setup */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Theme detection script - prevents hydration mismatch */}
        <script
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
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  // Listen for system theme changes
                  var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                  mediaQuery.addEventListener('change', function(e) {
                    // Only auto-switch if no manual theme is set
                    if (!localStorage.getItem('theme')) {
                      if (e.matches) {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                      // Dispatch event for components to update
                      window.dispatchEvent(new Event('theme-changed'));
                    }
                  });
                  
                  // Mark theme as ready and show content
                  document.documentElement.classList.add('theme-ready');
                } catch (e) {
                  console.warn('Theme detection failed:', e);
                  // Fallback: show content even if theme detection fails
                  document.documentElement.classList.add('theme-ready');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background-canvas text-text-body antialiased">
        {/* Skip link for keyboard users */}
        <a
          href="#main"
          className="skip-link"
        >
          Skip to main content
        </a>

        {/* Header */}
        <Header />

        {/* Page content */}
        <main id="main" className="flex-1">{children}</main>

        {/* Consent */}
        <ConsentBanner />

        {/* Footer - conditionally hidden on map page */}
        <FooterWrapper />

        {/* Vercel Analytics */}
        {/* <Analytics /> */}

      </body>
    </html>
  )
}
