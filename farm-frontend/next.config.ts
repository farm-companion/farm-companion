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
  // Cross-origin headers REMOVED - were blocking CSS/fonts/images
  // { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  // CSP is now set in middleware (consent-aware)
]

// Note: Geolocation is now allowed site-wide in headersCommon for map functionality

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
      // Supabase Storage (hosted)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/**',
      },
      // Supabase Storage (self-hosted) - add your domain here or use env var
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL ? [{
        protocol: 'https' as const,
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
        port: '',
        pathname: '/storage/**',
      }] : []),
    ],
    // Enable modern image formats
    formats: ['image/webp', 'image/avif'],
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
