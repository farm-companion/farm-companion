# URL Contract — FarmCompanion

**Rule**: Public URLs must never break. Implement 308 redirects if unavoidable.

## Public Routes (PROTECTED)

### Core Pages
- `/` — Homepage
- `/map` — Interactive farm map (CRITICAL PATH)
- `/shop` — Farm listing page
- `/shop/[slug]` — Individual farm detail (SEO pages, 1,300+ indexed)
- `/seasonal` — Seasonal produce guide
- `/seasonal/[slug]` — Month-specific produce pages

### Discovery & Filtering
- `/categories` — All categories
- `/categories/[slug]` — Category-filtered farms (e.g., `/categories/organic`)
- `/counties/[slug]` — County-filtered farms (e.g., `/counties/essex`)
- `/best/[slug]` — Best-of curated lists

### Utility Pages
- `/about` — About page
- `/contact` — Contact form
- `/privacy` — Privacy policy
- `/terms` — Terms of service
- `/compare` — Farm comparison tool
- `/claim/[slug]` — Claim farm ownership

### Admin Routes
- `/admin/*` — All admin routes (protected, no SEO)

### API Routes
- `/api/farms` — Farm data endpoint (used by map)
- `/api/photos` — Photo uploads
- `/api/contact` — Contact form submission
- `/api/newsletter` — Newsletter signup
- `/api/claims` — Farm claim submissions

## Query Parameters (Map Route)
- `?lat=51.5&lng=-0.1` — Center map on coordinates
- `?q=search+term` — Search/filter farms
- `?county=Essex` — Filter by county
- `?radius=10` — Search radius in km

## Canonical URLs
All pages must set canonical tag. Format: `https://farmcompanion.co.uk/[route]`

## SEO Impact
- `/shop/[slug]` pages are 80% of organic traffic
- `/categories/[slug]` and `/counties/[slug]` are high-value landing pages
- `/map` is the primary UX differentiator

## Enforcement
- E2E tests for all public routes (200 status)
- Redirect monitoring (no 404s from search)
- Sitemap validation (all slugs accessible)
