import type { NextConfig } from "next"

const isProd = process.env.NODE_ENV === "production"

// Content Security Policy that supports:
// - MapLibre (tiles, workers via blob:)
// - Analytics (scripts after consent)
// - Our assets and images
// - Enhanced security with strict controls
const CSP = [
  "default-src 'self';",
  "base-uri 'self';",
  "object-src 'none';",
  "frame-ancestors 'none';",
  "font-src 'self' data: https:;",
  "img-src 'self' data: blob: https: https://lh3.googleusercontent.com https://images.unsplash.com https://cdn.farmcompanion.co.uk https://*.s3.amazonaws.com;",
  // Analytics script (+ allow inline/eval for Next/MapLibre in dev)
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;",
  // External styles (map styles) + inline styles (Tailwind preflight/runtime)
  "style-src 'self' 'unsafe-inline' https:;",
      // Tile/vector servers + Analytics + data URLs for image uploads + API domains
"connect-src 'self' data: https://tiles.openfreemap.org https://demotiles.maplibre.org https://tile.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org https://*.google.com https://*.gstatic.com https://*.vercel.app https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com;",
  // MapLibre workers
  "worker-src 'self' blob:;",
  "child-src blob:;",
  // Helpful on HTTPS in prod
  "upgrade-insecure-requests;",
  // Additional security
  "form-action 'self';",
  "manifest-src 'self';",
].join(" ")

const headersCommon = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
]

const nextConfig: NextConfig = {
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
    ],
  },
  // Configure API routes for larger file uploads
  serverExternalPackages: [],
  // Add strong headers for every route
  async headers() {
    const base = [
      {
        source: "/:path*",
        headers: [
          ...headersCommon,
          // Run CSP as Report-Only in dev to avoid breaking while you iterate
          isProd
            ? { key: "Content-Security-Policy", value: CSP }
            : { key: "Content-Security-Policy-Report-Only", value: CSP },
          // HSTS only in prod on HTTPS
          ...(isProd
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ]
    return base
  },
}

export default nextConfig
