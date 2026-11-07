import { NextResponse, NextRequest } from 'next/server'
import { SITE_URL, IS_PROD } from '@/lib/site'
import { GONE_FARM_SLUGS } from '@/data/gone-farm-slugs'

// Next 16 renamed this convention to `proxy.ts` and warns that `middleware.ts`
// is deprecated, but still builds it: `next build` lists it as "Proxy
// (Middleware)" and emits it to .next/server/middleware-manifest.json.
//
// Do NOT add a `proxy.ts` beside this file. next/dist/build/index.js throws
// "Both middleware file and proxy file are detected" and the build fails.
// Migrate with `npx @next/codemod middleware-to-proxy .` when ready.
//
// Note for anyone testing a change here: this does NOT execute under `next
// dev` in this project. Verified 6 November 2026 by probing a sentinel status
// from all four accepted locations (middleware.ts, src/middleware.ts,
// proxy.ts, src/proxy.ts), every one answering 404 in dev while the
// production build serves the CSP below correctly. Verify changes to this
// file against a standalone build, not the dev server.
export const config = { matcher: ['/((?!_next/|api/og|favicon.ico).*)'] }

/**
 * 410 Gone for farm listings that were deliberately withdrawn.
 *
 * The page already 404s, because getFarmBySlug filters on status 'active'.
 * These URLs were indexed before removal, so 404 ("might come back") is the
 * wrong signal and 410 ("withdrawn, stop asking") is the right one. It lives
 * here because the App Router gives a page no way to set a status other than
 * 404 via notFound().
 */
function goneResponse(): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>No longer listed &middot; Farm Companion</title>
<style>body{margin:0;background:#fff;color:#141E27;font:16px/1.6 system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
main{max-width:34rem}h1{font-size:2rem;line-height:1.1;margin:0 0 .75rem}p{color:#4A5560;margin:0 0 1.5rem}
a{display:inline-block;min-height:48px;line-height:48px;padding:0 24px;background:#DB330E;color:#fff;text-decoration:none;font-weight:600}</style>
</head><body><main>
<h1>This listing has been withdrawn</h1>
<p>It was a record with no contact details and no sign the place was open to visitors, so we removed it rather than leave it on the map.</p>
<a href="/map">Find farm shops near you</a>
</main></body></html>`
  return new NextResponse(html, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

function cspFor(req: NextRequest) {
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
  // Withdrawn listings answer 410 everywhere, so this sits ahead of the
  // production-only CSP branch below.
  const shop = /^\/shop\/([^/]+)\/?$/.exec(req.nextUrl.pathname)
  if (shop) {
    let slug: string
    try {
      slug = decodeURIComponent(shop[1])
    } catch {
      slug = shop[1]
    }
    if (GONE_FARM_SLUGS.has(slug)) return goneResponse()
  }

  // Only enforce CSP in production (redirect handled by next.config.ts)
  if (!IS_PROD) return NextResponse.next()

  const res = NextResponse.next()
  res.headers.set('Content-Security-Policy', cspFor(req))
  return res
}
