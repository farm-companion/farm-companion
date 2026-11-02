import type { NextConfig } from "next"

const isProd = process.env.NODE_ENV === "production"

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const headersCommon = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // Geolocation allowed on self for map functionality
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), fullscreen=(self), autoplay=(self)" },
  // COOP re-enabled: only restricts window.opener, does NOT block resources
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // CORP and COEP remain disabled - these block cross-origin CSS/fonts/images
  // { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  // CSP is now set in middleware (consent-aware)
]

// Note: Geolocation is now allowed site-wide in headersCommon for map functionality

// County slugs retired by scripts/normalise-county-names.sql, which merged the
// five county names the directory held twice (a council's corporate name and
// the county's own name counted as two counties) and dropped the council
// suffix from three more. Permanent, because the old slug will never come
// back: the name it came from no longer exists in the data.
const countyMergeRedirects = [
  ['argyll-and-bute-council', 'argyll-and-bute'],
  ['bridgend-county-borough', 'bridgend'],
  ['caerphilly-county-borough', 'caerphilly'],
  ['durham', 'county-durham'],
  ['east-ayrshire-council', 'east-ayrshire'],
  ['east-dunbartonshire-council', 'east-dunbartonshire'],
  ['merthyr-tydfil-county-borough', 'merthyr-tydfil'],
  ['north-ayrshire-council', 'north-ayrshire'],
  // Not a renaming like the rest: this borough held one farm while 15 other
  // London farms sat under Greater London, so it is rolled up rather than
  // kept as a county of its own.
  ['richmond-upon-thames', 'greater-london'],
].map(([from, to]) => ({
  source: `/counties/${from}`,
  destination: `/counties/${to}`,
  permanent: true,
}))

const nextConfig: NextConfig = {
  // Dev-only: disable React Strict Mode's double-invoke, which trips
  // framer-motion's useScroll "target ref not hydrated" error and blanks
  // the page in local dev. No effect on production builds (which never
  // double-invoke). See homepage-redesign spec 2026-05-26.
  reactStrictMode: false,
  // Self-contained server bundle for Docker / Coolify deploys.
  // Produces .next/standalone with a minimal node_modules and server.js.
  output: 'standalone',
  // Domain redirects - canonical domain is www.farmcompanion.co.uk
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'farmcompanion.uk' }],
        destination: 'https://www.farmcompanion.co.uk/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.farmcompanion.uk' }],
        destination: 'https://www.farmcompanion.co.uk/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'farmcompanion.co.uk' }],
        destination: 'https://www.farmcompanion.co.uk/:path*',
        permanent: true,
      },
      // Redirect acquired farm directory domains to canonical origin
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'localfarmshops.co.uk' }],
        destination: 'https://www.farmcompanion.co.uk/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.localfarmshops.co.uk' }],
        destination: 'https://www.farmcompanion.co.uk/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'farmshopfinder.co.uk' }],
        destination: 'https://www.farmcompanion.co.uk/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.farmshopfinder.co.uk' }],
        destination: 'https://www.farmcompanion.co.uk/:path*',
        permanent: true,
      },
      ...countyMergeRedirects,
    ]
  },
  // Environment variables
  env: { 
    NEXT_PUBLIC_ADD_FORM_ENABLED: process.env.ADD_FORM_ENABLED,
    NEXT_PUBLIC_CONTACT_FORM_ENABLED: process.env.CONTACT_FORM_ENABLED,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_GA_MEASUREMENT_ID_DEV: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_DEV,
    NEXT_PUBLIC_GA_ENABLED: process.env.NEXT_PUBLIC_GA_ENABLED
  },
  // Performance optimizations
  experimental: {
    // inlineCss shipped the whole Tailwind bundle in the document THREE times:
    // once as a <style> in markup (267,105 B) and twice as byte-identical RSC
    // flight rows (249,889 B each). 766,883 B per page, on every page, for one
    // stylesheet. Brotli collapsed the duplicates so the transfer looked fine,
    // which is why it hid: /counties was 2,002,148 B uncompressed but 198,736 B
    // on the wire. Off, the CSS is one <link> the browser caches across
    // navigations instead of re-parsing per page.
    inlineCss: false,
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  // Configure image domains for external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/wikipedia/commons/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.farmcompanion.co.uk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      // Supabase Storage (hosted)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/**',
      },
      // Supabase Storage (self-hosted) - from env var
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL ? [{
        protocol: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).protocol.replace(':', '') as 'http' | 'https',
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
        port: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).port,
        pathname: '/storage/**',
      }] : []),
      // Fallback: explicit self-hosted Supabase
      {
        protocol: 'http',
        hostname: '134.122.102.159',
        port: '8000',
        pathname: '/storage/**',
      },
      // Runware AI-generated images (temporary CDN; we self-host via Hetzner now)
      {
        protocol: 'https',
        hostname: 'im.runware.ai',
        port: '',
        pathname: '/**',
      },
      // Hetzner Object Storage, production blob backend for Pitti Press
      // and Apothecary self-hosted illustrations. Wildcard form so any
      // <bucket>.<region>.your-objectstorage.com is whitelisted. Per
      // Next.js 16 syntax `**.x` matches any number of subdomain
      // segments at the beginning. The exact-match form was silently
      // rejected by Vercel's edge image optimizer in Slice 1.1.3a
      // (returned INVALID_IMAGE_OPTIMIZE_REQUEST despite being present
      // in the committed config and surviving a no-cache rebuild).
      {
        protocol: 'https',
        hostname: '**.your-objectstorage.com',
        port: '',
        pathname: '/**',
      },
    ],
    // AVIF first: 30-50% smaller than WebP at equivalent quality. WebP fallback for older browsers.
    formats: ['image/avif', 'image/webp'],
    // Optimize image loading
    minimumCacheTTL: 31536000, // 1 year for better caching
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for responsive images
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Configure API routes for larger file uploads
  // External packages that should not be bundled (helps with ESM/CommonJS issues)
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
  // Enable compression
  compress: true,
  // Add strong headers for every route
  async headers() {
    const base = [
      {
        source: "/:path*",
        headers: [
          ...headersCommon,
          // HSTS and Expect-CT only in prod on HTTPS
          ...(isProd
            ? [
                { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
                { key: "Expect-CT", value: "max-age=86400, enforce" }
              ]
            : []),
        ],
      },
      // Note: Geolocation is now allowed site-wide in headersCommon
      // Cross-origin headers for fonts
      {
        source: '/:all*(woff2)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cross-origin headers for images
      {
        source: '/:all*(png|jpg|jpeg|webp|avif|svg|ico)',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Clear-Site-Data headers for logout and sensitive endpoints
      {
        source: '/api/admin/logout',
        headers: [
          { key: 'Clear-Site-Data', value: '"cache", "cookies", "storage", "executionContexts"' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // Additional security headers for admin endpoints
      {
        source: '/api/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
    return base
  },
}

export default withBundleAnalyzer(nextConfig)
