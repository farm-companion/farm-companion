# FarmCompanion — Product Brief

## Mission
UK's premier farm shop directory enabling 50k-100k monthly organic searches. Connect consumers with 1,300+ verified local farms via interactive map, real-time status, and seasonal produce guides.

## Core Value Proposition
- **Discovery**: Interactive Google Maps with clustering, geolocation, radius search
- **Trust**: Verified farms, real-time open/closed status, community photos
- **Seasonality**: Monthly produce guides, what's in season now
- **Engagement**: Compare farms, directions, contact info, SEO-optimized pages

## Technical Stack
- **Framework**: Next.js 15 App Router, React 19, TypeScript
- **Database**: Supabase (PostgreSQL), Prisma ORM
- **Maps**: Google Maps JavaScript API, @googlemaps/markerclusterer
- **Styling**: Tailwind CSS, Framer Motion, Radix UI
- **Deployment**: Vercel, Vercel KV (Redis), Vercel Blob (images)

## Success Metrics
- Map load time < 2s (p95)
- Search results < 100ms
- Lighthouse Performance > 90
- Organic traffic 50k-100k/month
- 0 broken public URLs post-refactor

## Non-Goals This Quarter
- User accounts/auth (admin only)
- E-commerce/booking
- Mobile native apps
- Multi-language support
