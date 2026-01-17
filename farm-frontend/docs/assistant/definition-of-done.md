# Definition of Done — FarmCompanion

## Code Quality
- [ ] TypeScript strict mode, 0 `any` types, 0 `@ts-ignore`
- [ ] ESLint passes, 0 warnings
- [ ] Prettier formatted
- [ ] No console.log in production code (use debug flag)
- [ ] Zod validation for all external data (API, forms, env vars)

## Performance
- [ ] Lighthouse Performance > 90 (mobile & desktop)
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Time to Interactive < 3s
- [ ] Map loads in < 2s (p95)
- [ ] Search results render in < 100ms

## SEO
- [ ] All pages have unique `<title>` (50-60 chars)
- [ ] All pages have `<meta name="description">` (150-160 chars)
- [ ] Canonical tags set correctly
- [ ] Open Graph + Twitter Card meta tags
- [ ] JSON-LD structured data (LocalBusiness schema)
- [ ] Sitemap.xml includes all public pages
- [ ] Robots.txt allows crawling
- [ ] No broken internal links (0 404s)

## Accessibility
- [ ] WCAG 2.1 Level AA compliance
- [ ] All images have descriptive `alt` text
- [ ] Form inputs have labels
- [ ] Focus indicators visible
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Keyboard navigation works (no mouse traps)
- [ ] Screen reader tested (VoiceOver or NVDA)

## Map Functionality
- [ ] Map loads with user geolocation (permission granted)
- [ ] Falls back to UK center if geolocation denied
- [ ] Markers cluster at zoom < 12
- [ ] Clicking marker shows farm details
- [ ] Search filters farms instantly (< 100ms)
- [ ] "Get Directions" opens Google Maps
- [ ] Map state persists in URL (lat, lng, zoom)
- [ ] Mobile: Swipe gestures work, no scroll jank
- [ ] Desktop: Hover states on markers

## Data Integrity
- [ ] All farms have valid lat/lng coordinates
- [ ] All farm slugs are unique
- [ ] All public farm URLs return 200 status
- [ ] Opening hours format validated
- [ ] Phone/email obfuscated on frontend
- [ ] Images have CDN URLs, no broken links

## Testing
- [ ] Unit tests for business logic (>80% coverage)
- [ ] Integration tests for API routes
- [ ] E2E tests for critical paths (homepage, map, farm detail)
- [ ] Visual regression tests for UI components
- [ ] Load tested for 10k concurrent users

## Deployment
- [ ] Builds successfully on Vercel
- [ ] No environment variable leaks
- [ ] Database migrations run successfully
- [ ] Redis cache warmed
- [ ] Monitoring + error tracking configured (Sentry)
- [ ] Rollback plan documented

## Documentation
- [ ] README updated with setup instructions
- [ ] API routes documented (request/response examples)
- [ ] Component props documented (JSDoc or Storybook)
- [ ] Migration guide for breaking changes
- [ ] Runbook for production incidents
