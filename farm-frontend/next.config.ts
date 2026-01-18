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
  { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=(), payment=(), fullscreen=(self), autoplay=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  // CSP is now set in middleware (consent-aware)
]

// Headers for routes that need geolocation access
const headersWithGeolocation = [
  ...headersCommon,
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), fullscreen=(self), autoplay=(self)" },
]

const nextConfig: NextConfig = {
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
    optimizePackageImports: ['lucide-react'],
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
    ],
    // Enable modern image formats
    formats: ['image/webp', 'image/avif'],
    // Optimize image loading
    minimumCacheTTL: 31536000, // 1 year for better caching
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for responsive images
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allowed quality values for image optimization
    qualities: [75, 80, 85],
  },
  // Configure API routes for larger file uploads
  serverExternalPackages: [],
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
      // Allow geolocation only on map and location-related routes
      {
        source: "/map/:path*",
        headers: [
          ...headersWithGeolocation,
          // HSTS and Expect-CT only in prod on HTTPS
          ...(isProd
            ? [
                { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
                { key: "Expect-CT", value: "max-age=86400, enforce" }
              ]
            : []),
        ],
      },
      {
        source: "/map",
        headers: [
          ...headersWithGeolocation,
          // HSTS and Expect-CT only in prod on HTTPS
          ...(isProd
            ? [
                { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
                { key: "Expect-CT", value: "max-age=86400, enforce" }
              ]
            : []),
        ],
      },
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
