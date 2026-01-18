# FarmCompanion Execution Ledger

## Queue Status

### Queue 1: Security closure and secret removal
- [x] Fix twitter-workflow critical Next.js vulnerabilities (CVE-2025-66478)
- [x] Fix js-yaml vulnerability (not present, false positive)
- [x] Confirm undici vulnerability status (fixed with override)
- [x] Remove hardcoded API key in farm-pipeline (already using env var)

### Queue 2: Deployment stability
- [x] Run Vercel build commands locally (farm-frontend: 254 pages, 0 errors)
- [x] Fix remaining build blockers (none remaining)

### Queue 3: Track 0 Map fixes
- [x] Remove production console logs (2 debug logs removed from MapSearch.tsx, 2 legitimate warnings remain)
- [x] Fix MapShell.tsx type safety
- [x] Fix cluster event handling
- [x] Add desktop marker popovers
- [x] Extract Haversine utility
- [x] Fix ClusterPreview data loss

### Queue 4: Design system
- [x] Add missing components
- [x] Add design tokens
- [x] Add micro interactions
- [x] WCAG AA compliance

### Queue 5: Backend optimization
- [x] Add indexes (Already in schema.prisma with comprehensive composite indexes)
- [x] PostGIS strategy (PostGIS fully implemented in geospatial.ts with ST_Distance, ST_DWithin, ST_Contains)
- [x] Connection pooling (Configured in prisma.ts with Supabase Pooler)
- [x] Fix N+1 queries (Audited all 4 query files: categories.ts getCategoryStats optimized with parallel aggregations, counties.ts/farms.ts/geospatial.ts already optimized)

### Queue 6: Twitter workflow refinement
- [x] Fix sendFailureNotification bug (Method is sendErrorNotification, working correctly)
- [x] Replace filesystem locks (Already using Redis/Upstash for Bluesky and Telegram clients)

### Queue 7: Farm pipeline hardening
- [x] Pin requirements.txt (All dependencies pinned with specific versions in requirements.txt)
- [x] Add retries and backoff (Comprehensive retry.py with exponential backoff, jitter, async/sync decorators, retry context manager, predefined configs)
- [x] Structured logging (Comprehensive logging.py with JSON formatter, colored console output, performance logger, progress logger, function call decorator)

### Queue 8: Data integrity and schema foundation
- [x] Add Zod validation for opening hours JSON (Comprehensive schemas for both array and object formats in validation.ts, with parsing and conversion utilities, integrated into farm-status.ts and StatusBadge)
- [x] Add Produce model with seasonality fields (Global produce catalog with name, slug, category, seasonStart, seasonEnd, icon, seasonalPageSlug in schema.prisma)
- [x] Add FarmProduce junction table (farmId, produceId, available, isPYO, notes with proper indexes and unique constraint)
- [x] Seed initial seasonal produce data (12 UK seasonal items in prisma/seed-data/produce.ts, seed script in prisma/seed.ts, run with npm run db:seed)

### Queue 9: Seasonal location integration (North Star Journey)
- [x] Add map filter for produce type with season awareness
- [x] Update map API to accept produce filter parameter
- [x] Add "Find [produce] near me" CTAs on seasonal pages
- [ ] Show "In season now" badges on farm markers

### Queue 10: Farm profile seasonal context
- [ ] Add "What's in season here" section to farm profiles
- [ ] Query FarmProduct joined with Product for seasonal items
- [ ] Link produce items to seasonal guide pages
- [ ] Add "Available now" vs "Coming soon" status

### Queue 11: County to map integration
- [ ] Add "View on map" CTA to county pages
- [ ] Pass county bbox/centroid to map via URL params
- [ ] Auto-focus map viewport to county bounds
- [ ] Preserve county context in breadcrumb

### Queue 12: Cross-page journey scaffolding
- [ ] Add persistent seasonal banner with peak produce
- [ ] Add "Farms with this produce" section to seasonal pages
- [ ] Add category to seasonal produce cross-links
- [ ] Add recent/saved farms quick access component

### Queue 13: Viewport query caching
- [ ] Implement geohash-based tile caching for bbox queries
- [ ] Add cache invalidation on farm data updates
- [ ] Add Redis cache layer for hot viewport tiles
- [ ] Monitor cache hit rates and tune TTL

## Completed Work

### 2026-01-18 (latest)
- **Queue 9, Slice 3: Find Produce Near Me CTAs** (Queue 9)
  - Updated seasonal page CTAs to use produce filter parameter (/map?produce=slug)
  - Changed "Find at farm shops" to "Find [produce] near me" with highlighted styling
  - Updated bottom CTA to use produce filter
  - Added useSearchParams to map page to read produce/county/category from URL
  - Added initialFilters memo to parse URL parameters
  - Added effect to sync filters when URL parameters change
  - TypeScript compilation verified
- **Queue 9, Slice 2: Map API Produce Filter Parameter** (Queue 9)
  - Added produce query parameter to /api/farms endpoint
  - Added FarmProduce junction table filtering (filters by available produce with matching slug)
  - Updated FarmWithRelations type to include produce relation
  - Included produce data in farm response (name, slug, seasonStart, seasonEnd, icon, isPYO)
  - Updated cache key to include produce parameter
  - Added FarmProduce interface and produce field to FarmShop type
  - TypeScript compilation verified
- **Queue 9, Slice 1: Map Filter for Produce with Season Awareness** (Queue 9)
  - Created ProduceFilter.tsx component with season-aware chip display
  - In-season items show green styling with "Now" badge
  - Items sorted with in-season first, then alphabetically
  - Handles wrap-around seasons (e.g., kale Nov-Apr)
  - Updated MapSearch.tsx FilterState to include produce field
  - Added ProduceFilter to MapSearch filter panel
  - Added produce filter chip to active filters display
  - Updated map/page.tsx with produceItems conversion from PRODUCE data
  - Added placeholder produce filtering (searches farm name/offerings until FarmProduce data populated)
  - TypeScript compilation verified
- **Queue 8, Slice 3: Seasonal Produce Seed Data** (Queue 8)
  - Created prisma/seed-data/produce.ts with 12 UK seasonal produce items (asparagus, PSB, strawberries, tomatoes, sweetcorn, runner beans, blackberries, apples, plums, pumpkins, kale, leeks)
  - Created prisma/seed.ts seed script using upsert for idempotent seeding
  - Added npm run db:seed script and prisma.seed configuration
  - Each item includes: name, slug, description, category, seasonStart/End, icon, imageUrl, displayOrder, seasonalPageSlug
  - **Queue 8 Complete**: All data integrity and schema foundation work done
- **Queue 8, Slice 2: Produce and FarmProduce Models** (Queue 8)
  - Added Produce model for global seasonal produce catalog (name, slug, category, seasonStart, seasonEnd, icon, imageUrl, seasonalPageSlug)
  - Added FarmProduce junction table linking farms to produce they offer (available, isPYO, notes)
  - Added Farm.produce relationship for querying farm's available produce
  - Proper indexes on category, seasonStart/seasonEnd, slug, farmId, produceId, available, isPYO
  - Unique constraint on [farmId, produceId] to prevent duplicates
  - Prisma client generated successfully
- **Queue 8, Slice 1: Opening Hours Zod Validation** (Queue 8)
  - Added comprehensive Zod schemas in validation.ts for both array format ([{ day, open, close }]) and object format ({ [dayNum]: { open, close, closed? } })
  - Added TimeStringSchema validating HH:MM format plus "Closed" and "24 hours" special values
  - Added DayNameSchema for day name validation
  - Added parseOpeningHours(), arrayToObjectHours(), objectToArrayHours(), normalizeToObjectHours(), validateOpeningHours() utility functions
  - Updated farm-status.ts to use normalizeToObjectHours() internally, accepting both formats
  - Updated schemas.ts to use OpeningHoursArraySchema instead of z.any()
  - Updated StatusBadge.tsx props to accept unknown type
  - Verified TypeScript compiles with no errors in changed files

### 2026-01-17
- **Slice 2: Optimized getCategoryStats with Database Aggregation** (Queue 5)
  - Replaced in-memory JavaScript processing with parallel Prisma aggregations in categories.ts
  - Changed from `findMany` + reduce/filter to `Promise.all` with `count`, `aggregate`, and `groupBy`
  - Eliminated loading all category farms into memory
- **Audited All Query Files for N+1 Patterns** (Queue 5)
  - counties.ts (319 lines): Already optimized with database aggregations
  - farms.ts (271 lines): Already optimized with parallel queries and raw SQL geospatial
  - geospatial.ts (258 lines): Already optimized with PostGIS (ST_Distance, ST_DWithin, ST_Contains, JSON aggregation)
  - Verified PostGIS fully implemented with spatial indexes
- **Queue 5 Complete**: All backend optimizations verified and complete

### 2026-01-17 (continued)
- Removed final 2 debug console.log statements from MapSearch.tsx (lines 81, 104)
- Verified Track 0 complete: 0 debug logs remain, 2 legitimate warnings preserved (AdvancedMarkerElement fallback, map resize error)

### 2026-01-17 (earlier)
- Created execution ledger
- Updated twitter-workflow dependencies to resolve Next.js CVE-2025-66478
- Removed all debug console statements from MapShell.tsx (17 statements removed, 2 console.error preserved)
- Fixed MapShell.tsx type safety by replacing all any casts with proper interfaces (FarmMarkerExtended, WindowWithMapUtils)
- Improved cluster event handling: added ClusterData type, show preview for small clusters (<=8 farms), smart zoom for large clusters, proper event validation
- Added desktop marker popovers with screen-position calculation (MapMarkerPopover component, replaces mobile bottom sheet on desktop)
- Consolidated Haversine utilities to shared/lib/geo (deleted lib/geo-utils.ts, moved calculateBearing and isWithinBounds, removed inline implementation from LiveLocationTracker)
- Fixed ClusterPreview data loss: replaced any casts with FarmMarkerExtended type, added validation for missing farm data, prevent render when farms array empty, use farms.length instead of cluster.count for accuracy
- Added WCAG 2.1 AA accessibility utilities to globals.css: touch-target class (44x44px), sr-only for screen readers, skip-to-content link, focus-visible-ring, prefers-reduced-motion support, prefers-contrast high support
- Added essential layout and utility components: EmptyState (no results/empty lists), Divider (solid/dashed/dotted, horizontal/vertical, with label), Container (responsive max-width layouts), Stack (flexbox with direction/spacing/alignment), all exported from ui/index.ts
- Enhanced design tokens: added semantic feedback colors (success/warning/error/info with light/default/dark shades), premium elevation shadows, updated accessibility tokens (focus ring offset, WCAG AA/AAA values), created comprehensive design-tokens.md documentation with usage guidelines
- Added comprehensive micro-interactions: shake animation (error feedback), success-pop (success states), gentle-pulse (loading), CSS utility classes (hover-lift, hover-scale, press-effect), Tailwind animations config, performance-optimized CSS-only alternatives to Framer Motion
- Verified Queue 5 (Backend optimization): comprehensive indexes already in schema.prisma, PostGIS extension enabled, connection pooling configured with Supabase Pooler in prisma.ts, N+1 query fixes deferred until database migration from JSON
- Verified Queue 6 (Twitter workflow): sendFailureNotification bug non-existent (method is sendErrorNotification, working correctly), filesystem locks already replaced with Redis/Upstash for Bluesky and Telegram clients
- Verified Queue 7 (Farm pipeline): requirements.txt already has all dependencies pinned, comprehensive retry.py with exponential backoff and jitter, comprehensive logging.py with JSON formatting and structured logging
