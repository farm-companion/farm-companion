import { NextResponse, NextRequest } from 'next/server'
import { SITE_URL, IS_PROD } from '@/lib/site'

export const config = { matcher: ['/((?!_next/|api/og|favicon.ico).*)'] }

function cspFor(req: NextRequest) {
  // Read consent cookie
  const consent = req.cookies.get('fc_consent')?.value ?? '{}'
  const c = JSON.parse(consent || '{}') as { ads?: boolean; analytics?: boolean }

  // Baseline allowlists (adjust to your actual domains)
  const img = [
    "'self'",
    'data:',
    'blob:',
    'https://images.farmcompanion.co.uk', // your CDN if any
    'https://lh3.googleusercontent.com',
    'https://lh3.ggpht.com',
    'https://images.unsplash.com',
    'https://cdn.farmcompanion.co.uk',
    'https://*.s3.amazonaws.com',
    'https://maps.googleapis.com',
    'https://maps.gstatic.com',
    // MapLibre/Leaflet tile sources
    'https://tile.openstreetmap.org',
    'https://*.tile.openstreetmap.org',
    'https://tiles.stadiamaps.com',
    'https://*.stadiamaps.com',
    // Leaflet marker icons CDN
    'https://unpkg.com',
  ]
  const connect = [
    "'self'",
    'https://*.google.com',
    'https://*.gstatic.com',
    'https://*.vercel.app',
    'https://maps.googleapis.com',
    'https://maps.gstatic.com',
    'https://*.googleapis.com',
    // MapLibre tile sources
    'https://tile.openstreetmap.org',
    'https://*.tile.openstreetmap.org',
    'https://tiles.stadiamaps.com',
    'https://*.stadiamaps.com',
    'https://api.stadiamaps.com',
  ]
  const frame = ["'self'", 'https://vercel.live']
  const script = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://vercel.live']
  const style = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'] // Tailwind JIT needs none; inline may be needed for Next font fallback
  const font = ["'self'", 'data:', 'https://fonts.gstatic.com']
  const frameAncestors = ["'none'"]

  // Enable analytics only if consented
  if (c.analytics) {
    connect.push('https://vitals.vercel-insights.com')
    script.push('https://vitals.vercel-insights.com')
    connect.push('https://www.googletagmanager.com')
    connect.push('https://www.google-analytics.com')
    connect.push('https://analytics.google.com')
    connect.push('https://*.google-analytics.com')
    script.push('https://www.googletagmanager.com')
    script.push('https://www.google-analytics.com')
  }

  // Enable AdSense only if consented
  if (c.ads) {
    script.push('https://pagead2.googlesyndication.com', 'https://securepubads.g.doubleclick.net')
    connect.push('https://googleads.g.doubleclick.net', 'https://pagead2.googlesyndication.com')
    img.push('https://tpc.googlesyndication.com', 'https://googleads.g.doubleclick.net', 'https://pagead2.googlesyndication.com')
    frame.push('https://googleads.g.doubleclick.net')
  }

  const csp = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `script-src ${script.join(' ')}`,
    `style-src ${style.join(' ')}`,
    `img-src ${img.join(' ')}`,
    `font-src ${font.join(' ')}`,
    `connect-src ${connect.join(' ')}`,
    `frame-src ${frame.join(' ')}`,
    `frame-ancestors ${frameAncestors.join(' ')}`,
    `form-action 'self'`,
    `object-src 'none'`,
    `worker-src 'self' blob:`,
    `upgrade-insecure-requests`,
  ].join('; ')

  return csp
}

export function middleware(req: NextRequest) {
  // TEMPORARILY DISABLED - debugging CSS loading issue
  return NextResponse.next()

  // if (!IS_PROD) return NextResponse.next()
  
  const url = new URL(req.url)
  if (url.protocol !== 'https:' || url.host !== new URL(SITE_URL).host) {
    url.protocol = 'https:'
    url.host = new URL(SITE_URL).host
    return NextResponse.redirect(url, 308)
  }
  
  const res = NextResponse.next()
  res.headers.set('Content-Security-Policy', cspFor(req))
  return res
}
