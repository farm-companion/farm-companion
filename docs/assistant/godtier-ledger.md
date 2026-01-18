# GodTier Implementation Ledger

## Mission
Implement the FarmCompanion Product Audit end-to-end. Transform into seamless Apple-level directory where map, seasonal, counties, and farm profiles interlock cleanly.

## Execution Order

### Phase 1: Foundations that unblock integration

#### 1.1 Design Contract Enforcement
**Goal**: Remove hardcoded colors, standardize heights, enforce token usage

**Slice 1** - Core component token standardization [DONE]
- FarmCard: Replace hardcoded colors with semantic tokens
- ProduceCard: Standardize to design contract
- County badges: Use semantic token classes (Badge component)
- MapShell cluster SVG: Added comment documenting brand-primary color
- Button heights: Standardized all interactive to h-12 (48px)
- Acceptance: Visual consistency, no hardcoded hex, all buttons 48px
- Verification: `pnpm --filter farm-frontend dev` then inspect /map, /counties/kent, /seasonal
- Status: DONE

**Slice 2** - Remaining component standardization [DONE]
- Footer: text-serum -> text-brand-primary
- SearchBar: hardcoded slate colors -> semantic tokens, h-12 container
- Button: default size md updated from h-10 to h-12 (48px touch target)
- MapSearch: all inputs h-12, buttons h-12, semantic tokens for colors and focus rings
- Acceptance: All interactive elements meet 48px minimum, consistent token usage
- Verification: Inspect /map search, footer, general buttons across site
- Status: DONE

**Slice 2.5** - Design system enforcement tooling [DONE]
- Created DESIGN_GUIDELINES.md with comprehensive Apple-level standards
- Added prettier-plugin-tailwindcss for automatic class ordering
- Added eslint-plugin-tailwindcss for design token enforcement
- Created .prettierrc.json with Tailwind-aware formatting
- Updated eslint.config.mjs to enable Tailwind linting rules
- Rewrote design guidelines to world-class Apple/Vercel/Linear quality
- Added complete component patterns, accessibility standards, performance patterns
- Acceptance: Linting catches hardcoded colors, class order auto-formats
- Verification: Run `pnpm lint` and `pnpm prettier --write .`
- Status: DONE

#### 1.2 Backend Prerequisites for Seasonal Integration

**Slice 3** - Product-to-Farm relationship verification and completion
- Verify Product model exists and has farmId, availableMonths
- Add seed data or migration for sample products
- Acceptance: Can query products by farm, filter by month
- Status: TODO

**Slice 4** - API produce filter endpoint
- Add produce query param to /api/farms
- Filter farms that have products matching slug + current month
- Return facets for available produce
- Acceptance: GET /api/farms?produce=strawberries returns filtered results
- Status: TODO

**Slice 5** - Opening hours validation schema
- Add Zod schema for openingHours format
- Validate on farm submission
- Add utility to check isOpenNow
- Acceptance: Invalid hours rejected, isOpenNow works correctly
- Status: TODO

#### 1.3 Map Integration First Slice

**Slice 6** - Seasonal produce filter on map [HIGH PRIORITY]
- MapSearch: Add produce dropdown populated from seasonal data
- Map page: Accept produce URL param
- API already filtered from Slice 4
- Update markers and list based on filter
- Acceptance: Can filter map by produce, URL updates, clear filter works
- Status: TODO

### Phase 2: Seamless Stitching Across Pages

**Slice 7** - Seasonal page to prefiltered map CTA
- /seasonal/[slug]: Add "Find near me" button
- Links to /map?produce=slug&near=user
- Map initializes with filter applied
- Acceptance: Click strawberries "Find near me" -> map shows strawberry farms
- Status: TODO

**Slice 8** - County pages view on map with bbox
- Calculate county bounding box from farms
- Add "View X farms on map" button
- Map initializes with bbox viewport
- Acceptance: Kent county page -> View on map -> map shows Kent region
- Status: TODO

**Slice 9** - Farm profile seasonal badges
- Query farm products, filter by current month
- Show "In season now" badges below hero
- Link badges to seasonal pages
- Acceptance: Farm profile shows 3-5 seasonal badges if applicable
- Status: TODO

**Slice 10** - Farm profile open now indicator
- Create OpeningHoursDisplay component
- Visual calendar with current day highlighted
- "Open now" badge with next transition time
- Acceptance: Shows "Open now - Closes at 6pm" or "Closed - Opens tomorrow at 9am"
- Status: TODO

**Slice 11** - Cluster preview to list transition
- Complete MapShell.tsx TODO at line 204
- "Show all farms" expands bottom sheet with filtered list
- Acceptance: Tap cluster -> tap "Show all" -> list view with those farms
- Status: TODO

**Slice 12** - Nearby farms section on farm profile
- Query farms within 5 miles using geo
- Show 3 cards at bottom
- "View all nearby on map" CTA
- Acceptance: Farm profile shows 3 nearby farms with distance
- Status: TODO

**Slice 13** - Seasonal page farms near you section
- Request location, query farms with product within 10mi
- Show 3 farm cards
- "View all on map" with produce filter
- Acceptance: Strawberries page shows "3 farms near you selling strawberries"
- Status: TODO

**Slice 14** - Seasonal directory in-season filter
- Toggle "In season now" vs "Show all"
- Filter by current month
- Persist in localStorage
- Acceptance: Toggle filters produce list, persists on reload
- Status: TODO

**Slice 15** - County directory location-based sorting
- Request location permission
- Show "Near you" section first
- Then alphabetical
- Acceptance: Counties page shows nearest counties first if location granted
- Status: TODO

**Slice 16** - County page featured farms section
- Query featured/verified farms in county
- Show 3 hero cards at top
- Acceptance: County page shows 3 featured farms prominently
- Status: TODO

**Slice 17** - Farm photo gallery lightbox
- Add lightbox on photo click
- Arrow key navigation, swipe support
- ESC to close
- Acceptance: Click photo -> full screen lightbox with navigation
- Status: TODO

### Phase 3: Scalability and Performance

**Slice 18** - PostGIS spatial index [CRITICAL]
- Add geography column to farms
- Create GIST spatial index
- Migrate existing lat/lng to geography
- Acceptance: Index exists, query plan uses GIST
- Status: TODO

**Slice 19** - Spatial query optimization
- Update /api/farms to use PostGIS bbox query
- Raw SQL for spatial operations
- Benchmark P95 latency
- Acceptance: Viewport queries <200ms P95
- Status: TODO

**Slice 20** - N+1 query verification and fixes
- Audit county pages, farm lists for N+1
- Add Prisma includes where missing
- Test with query logging
- Acceptance: Single query with joins, no N+1 loops
- Status: TODO

**Slice 21** - Additional indexes
- Product seasonality composite index
- Image fetch composite index
- Full-text search GIN index
- Acceptance: Slow query log shows index usage
- Status: TODO

**Slice 22** - Caching layer implementation
- Redis cache for farm viewport queries
- County stats caching
- Cache invalidation on updates
- Acceptance: Cache hit rate >70%, TTL respected
- Status: TODO

### Phase 4: Premium Polish

**Slice 23** - Micro-interactions audit and implementation
- Hover states on all interactive elements
- Loading transitions and skeletons
- Success animations
- Acceptance: All interactions feel responsive and polished
- Status: TODO

**Slice 24** - Accessibility WCAG AA verification
- Keyboard navigation audit
- Screen reader testing
- Color contrast verification
- Touch target size verification
- Acceptance: axe DevTools reports 0 violations
- Status: TODO

**Slice 25** - Empty states consistency
- Map: no results in viewport
- County: no farms
- Seasonal: no produce
- Search: no matches
- Acceptance: All empty states follow design contract
- Status: TODO

**Slice 26** - Skeleton loading states
- Map loading skeleton
- List view loading
- Farm profile loading
- Acceptance: Smooth fade from skeleton to content
- Status: TODO

**Slice 27** - Documentation and template notes
- Update README with new features
- Document API contracts
- Add component usage examples
- Acceptance: New dev can understand architecture in <30min
- Status: TODO

## Backlog Reference (from Audit)

### Design Contract Priorities
- [ ] Remove hardcoded Tailwind colors (bg-primary-600 -> bg-brand-primary)
- [ ] Standardize button heights to h-12 (48px)
- [ ] Fix county badge colors to semantic tokens
- [ ] MapShell cluster SVG use CSS vars not hardcoded hex
- [ ] Card consistency: rounded-xl p-6 shadow-premium
- [ ] Hover states: hover:shadow-premiumLg transition-shadow duration-150

### Backend Contract Priorities
- [ ] PostGIS GIST spatial index
- [ ] Product-to-Farm relationship complete
- [ ] Opening hours Zod validation
- [ ] Produce filter on /api/farms endpoint
- [ ] Cache layer with Redis
- [ ] N+1 query elimination

### Integration Priorities (Highest Impact)
1. Seasonal produce filter on map
2. Seasonal pages -> prefiltered map CTA
3. County pages -> view on map with bbox
4. Farm profile -> seasonal badges
5. Farm profile -> open now indicator

## Completion Criteria
- [ ] All 14 audit backlog items implemented
- [ ] Design contract enforced across all components
- [ ] Backend contract implemented
- [ ] All integration gaps closed
- [ ] Performance benchmarks met
- [ ] Accessibility verified
- [ ] Zero hardcoded secrets
- [ ] Full test coverage of new features
- [ ] Documentation complete

## Notes
- Each slice must be verifiable locally before claiming done
- Ledger updated after every slice
- No slice exceeds 8 files or 300 changed lines
- Preserve all public URLs
- No new dependencies unless essential
