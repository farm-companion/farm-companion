import { NextResponse, NextRequest } from 'next/server'
import { SITE_URL, IS_PROD } from '@/lib/site'

export const config = { matcher: ['/((?!_next/|api/og|favicon.ico).*)'] }

/** Exported for testing: the policy is security-critical and silently fatal. */
export function cspFor(req: NextRequest) {
  // Read consent cookie
  const consent = req.cookies.get('fc_consent')?.value ?? '{}'
  const c = JSON.parse(consent || '{}') as { ads?: boolean; analytics?: boolean }

  // Baseline allowlists (adjust to your actual domains)
  const img = [
    "'self'",
    'data:',
    'blob:',
    'https://images.farmcompanion.co.uk',
    'https://lh3.googleusercontent.com',
    'https://lh3.ggpht.com',
    'https://images.unsplash.com',
    'https://cdn.farmcompanion.co.uk',
    'https://*.s3.amazonaws.com',
    // MapLibre/Leaflet tile sources
    'https://tile.openstreetmap.org',
    'https://*.tile.openstreetmap.org',
    'https://tiles.stadiamaps.com',
    'https://*.stadiamaps.com',
    // OpenFreeMap: the keyless fallback style used when no Stadia key is set.
    // Serves vector tiles, natural-earth raster, glyph .pbf fonts and sprites,
    // all from this one host.
    'https://tiles.openfreemap.org',
    // Leaflet marker icons CDN
    'https://unpkg.com',
    // Runware AI-generated images
    'https://im.runware.ai',
    // Vercel Blob storage
    'https://*.public.blob.vercel-storage.com',
  ]
  const connect = [
    "'self'",
    'https://*.vercel.app',
    // MapLibre tile sources
    'https://tile.openstreetmap.org',
    'https://*.tile.openstreetmap.org',
    'https://tiles.stadiamaps.com',
    'https://*.stadiamaps.com',
    'https://api.stadiamaps.com',
    // OpenFreeMap: keyless fallback. Without this the map is blank in any
    // deploy that has no Stadia key, because the style fetch itself is blocked.
    'https://tiles.openfreemap.org',
  ]
  // Cloudflare Turnstile. Both directives are required and documented at
  // https://developers.cloudflare.com/turnstile/reference/content-security-policy/
  // Without them the widget's api.js is blocked, the CAPTCHA never renders, and
  // the contact form cannot be submitted at all. connect-src needs only 'self',
  // which is already present.
  const TURNSTILE = 'https://challenges.cloudflare.com'
  const frame = ["'self'", 'https://vercel.live', TURNSTILE]
  const script = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://vercel.live', TURNSTILE]
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
  // Only enforce CSP in production (redirect handled by next.config.ts)
  if (!IS_PROD) return NextResponse.next()

  const res = NextResponse.next()
  res.headers.set('Content-Security-Policy', cspFor(req))
  return res
}
