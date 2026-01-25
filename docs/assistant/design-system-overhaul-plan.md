# FarmCompanion: Strategic Design System Overhaul
## Ultra-Detailed Incremental Implementation Plan

**Created**: 2026-01-25
**Approach**: Snail-pace, incremental, zero-breakage
**Constraint**: Max 8 files, 300 lines per slice

---

## Current State Assessment

### What Already Exists (Do Not Break)
- **Color System**: Obsidian & Kinetic (Cyan + Violet) - WCAG AAA compliant
- **Typography**: 5 semantic scales (display, heading, body, caption, small)
- **Spacing**: 8px baseline grid
- **Components**: 26 UI primitives (Button, Card, Modal, etc.)
- **Map**: Google Maps with clustering, popovers, haptic feedback
- **Database**: PostgreSQL + PostGIS via Prisma (1,299 farms)
- **API**: 63 routes with structured logging

### Gap Analysis: Current vs. "Harvest" Vision
| Area | Current State | Harvest Vision | Priority |
|------|---------------|----------------|----------|
| Color Palette | Tech (Cyan/Violet) | Earthy (Soil/Leaf/Clay) | Medium |
| Typography | Clash Display + Manrope | Recollect/Domaine + Inter | Low |
| Header | Static navigation | Command Center + Context | High |
| Seasonal Page | Linear list | Circular Year interface | High |
| Counties Page | Text directory | Choropleth map | High |
| Shop Profiles | Basic info | Rich storytelling | Medium |
| Search | Basic input | Predictive Command Center | High |
| Map Clusters | Basic counts | Density-aware + categories | Medium |

---

## Implementation Queues (Incremental)

### Queue 18: Immediate Value Additions (No Breaking Changes)
**Goal**: Add features that enhance existing pages without changing design.

#### Slice 18.1: Dynamic "Open Now" Status Badge
- **Files**: `src/components/ui/OpenStatusBadge.tsx` (new), `src/lib/utils/opening-hours.ts` (new)
- **What**: Calculate real-time open/closed status from opening hours JSON
- **Impact**: Shop cards and profiles show "Open" (green), "Closing Soon" (orange), "Closed" (red)
- **Lines**: ~120

#### Slice 18.2: Distance Display on Shop Cards
- **Files**: `src/components/shop/ShopCard.tsx` (modify), `src/hooks/useUserLocation.ts` (new)
- **What**: Show "2.3 miles away" on shop cards when user location available
- **Impact**: Immediate utility for users with geolocation
- **Lines**: ~80

#### Slice 18.3: "What's In Season Now" Module
- **Files**: `src/components/seasonal/InSeasonNow.tsx` (new), `src/lib/data/seasonal-calendar.ts` (new)
- **What**: Component showing top 5 seasonal items for current month
- **Impact**: Homepage module, adds seasonality awareness
- **Lines**: ~150

#### Slice 18.4: Shop Amenity Icons
- **Files**: `src/components/shop/AmenityIcons.tsx` (new), `src/lib/data/amenities.ts` (new)
- **What**: Visual icons for "Wheelchair Access", "Cafe", "PYO", "Organic"
- **Impact**: Quick scanning on shop cards
- **Lines**: ~100

#### Slice 18.5: County Density Indicators
- **Files**: `src/components/counties/CountyDensityBadge.tsx` (new)
- **What**: Show shop count with visual weight (Cornwall: 60 shops = prominent)
- **Impact**: Counties page shows relative density
- **Lines**: ~60

---

### Queue 19: Header Evolution (Command Center)
**Goal**: Transform header from static nav to context-aware command center.

#### Slice 19.1: Location Context Display
- **Files**: `src/components/navigation/LocationContext.tsx` (new)
- **What**: "January in Cornwall | 8C" display in header
- **Impact**: Personalized context awareness
- **Lines**: ~80

#### Slice 19.2: Enhanced Mobile Bottom Nav
- **Files**: `src/components/navigation/BottomNav.tsx` (modify)
- **What**: Add "Nearby" quick action, animate active state
- **Impact**: Faster mobile navigation
- **Lines**: ~60

#### Slice 19.3: Mega Menu - Counties Preview
- **Files**: `src/components/navigation/MegaMenu.tsx` (new), `src/components/navigation/CountiesPreview.tsx` (new)
- **What**: Hover "Counties" shows nearby + popular regions
- **Impact**: Reduces clicks to discovery
- **Lines**: ~150

#### Slice 19.4: Mega Menu - Seasonal Preview
- **Files**: `src/components/navigation/SeasonalPreview.tsx` (new)
- **What**: Hover "Seasonal" shows top 3 items in season now
- **Impact**: Immediate seasonal awareness
- **Lines**: ~80

#### Slice 19.5: Universal Search (Command+K)
- **Files**: `src/components/search/CommandPalette.tsx` (new), `src/hooks/useCommandPalette.ts` (new)
- **What**: Modal search indexing shops, produce, counties
- **Impact**: Power-user discovery pattern
- **Lines**: ~200

#### Slice 19.6: Predictive Search Suggestions
- **Files**: `src/components/search/SearchSuggestions.tsx` (new)
- **What**: "Straw..." suggests "Strawberry Season", "Farms with PYO"
- **Impact**: Intent-aware discovery
- **Lines**: ~120

---

### Queue 20: Seasonal Page Transformation
**Goal**: Evolve from linear list to "Almanac" interface.

#### Slice 20.1: Seasonal Data Structure
- **Files**: `prisma/schema.prisma` (modify), `src/lib/data/seasonal-data.ts` (new)
- **What**: Add seasonality table linking produce to months with status (start/peak/end)
- **Impact**: Foundation for all seasonal features
- **Lines**: ~80

#### Slice 20.2: Produce Card Enhancement
- **Files**: `src/components/seasonal/ProduceCard.tsx` (new)
- **What**: Card with image, seasonality bar, nutrition visualization
- **Impact**: Richer produce display
- **Lines**: ~120

#### Slice 20.3: Seasonality Progress Bar
- **Files**: `src/components/seasonal/SeasonalityBar.tsx` (new)
- **What**: Visual bar showing "Peak Season", "Starting", "Ending"
- **Impact**: At-a-glance availability
- **Lines**: ~60

#### Slice 20.4: Month Navigation Wheel (SVG)
- **Files**: `src/components/seasonal/MonthWheel.tsx` (new)
- **What**: Circular 12-segment SVG with current month highlighted
- **Impact**: Interactive seasonal navigation
- **Lines**: ~180

#### Slice 20.5: "Find Stockists" Bridge
- **Files**: `src/components/seasonal/StockistLink.tsx` (new), `src/app/seasonal/[produce]/page.tsx` (new)
- **What**: Button linking produce to shops that stock it
- **Impact**: Closes intent-to-action gap
- **Lines**: ~150

#### Slice 20.6: Nutrition Radial Charts
- **Files**: `src/components/seasonal/NutritionChart.tsx` (new)
- **What**: SVG radial chart for "High in Vitamin C" visualization
- **Impact**: Visual nutrition data
- **Lines**: ~100

---

### Queue 21: Counties Page Transformation
**Goal**: From text directory to choropleth map interface.

#### Slice 21.1: UK SVG Map Component
- **Files**: `src/components/map/UKChoropleth.tsx` (new), `public/maps/uk-counties.svg` (new)
- **What**: SVG map with clickable county regions
- **Impact**: Geographic navigation
- **Lines**: ~200

#### Slice 21.2: Density Coloring Logic
- **Files**: `src/lib/utils/density-scale.ts` (new)
- **What**: Color scale from pale (1 shop) to dark green (60 shops)
- **Impact**: Visual density perception
- **Lines**: ~50

#### Slice 21.3: County Hover Tooltips
- **Files**: `src/components/map/CountyTooltip.tsx` (new)
- **What**: "Cornwall: 60 Shops. Famous for: Clotted Cream"
- **Impact**: Preview without navigation
- **Lines**: ~80

#### Slice 21.4: Region Sidebar Filters
- **Files**: `src/components/counties/RegionFilter.tsx` (new)
- **What**: Filter by "South West", "Scotland", etc.
- **Impact**: Reduced cognitive load
- **Lines**: ~100

#### Slice 21.5: County Landing Page Enhancement
- **Files**: `src/app/counties/[slug]/page.tsx` (modify)
- **What**: Add "County Profile" section with specialties
- **Impact**: Richer county context
- **Lines**: ~80

#### Slice 21.6: "Curator's Choice" Featured Shops
- **Files**: `src/components/counties/FeaturedShops.tsx` (new)
- **What**: Top 3 shops by profile completeness
- **Impact**: Quality highlighting
- **Lines**: ~100

---

### Queue 22: Shop Profile Enhancement
**Goal**: From basic info to "Digital Storefront" experience.

#### Slice 22.1: Verification Badge System
- **Files**: `src/components/shop/VerificationBadge.tsx` (new)
- **What**: "Verified by Owner" / "Community Verified" badges
- **Impact**: Trust signals
- **Lines**: ~60

#### Slice 22.2: Dynamic Operating Status
- **Files**: `src/components/shop/OperatingStatus.tsx` (new)
- **What**: "Open for 2 more hours" / "Opens at 09:00 tomorrow"
- **Impact**: Real-time utility
- **Lines**: ~100

#### Slice 22.3: "What's In Season Here" Cross-Reference
- **Files**: `src/components/shop/SeasonalAvailability.tsx` (new)
- **What**: "Likely stocking: Kale" based on category + season
- **Impact**: Purchase intent
- **Lines**: ~120

#### Slice 22.4: Interactive Location Card
- **Files**: `src/components/shop/LocationCard.tsx` (new)
- **What**: Mini-map with "Send to Car" deep link
- **Impact**: Navigation utility
- **Lines**: ~100

#### Slice 22.5: Farm Story Rich Text
- **Files**: `src/components/shop/FarmStory.tsx` (new)
- **What**: Rich text with image gallery, "Meet the Farmer"
- **Impact**: Narrative depth
- **Lines**: ~150

#### Slice 22.6: Related Farms Module
- **Files**: `src/components/shop/RelatedFarms.tsx` (new)
- **What**: "Other shops nearby" / "Similar to this"
- **Impact**: Discovery continuation
- **Lines**: ~100

---

### Queue 23: Map Experience Enhancement ("Compass")
**Goal**: Elevate map from tool to experience.

#### Slice 23.1: Smart Cluster Sizing
- **Files**: `src/features/map/utils/cluster-config.ts` (modify)
- **What**: Zoom-dependent hierarchy (County > Town > Individual)
- **Impact**: Coherent at all zoom levels
- **Lines**: ~80

#### Slice 23.2: Category-Based Pin Icons
- **Files**: `src/features/map/ui/CategoryPin.tsx` (new), `public/icons/pins/*.svg` (new)
- **What**: Milk bottle for Dairies, Carrot for Veg
- **Impact**: Visual category identification
- **Lines**: ~120

#### Slice 23.3: "Search as I Move" Toggle
- **Files**: `src/features/map/ui/ViewportSearch.tsx` (new)
- **What**: Checkbox to refresh results on map pan
- **Impact**: Dynamic exploration
- **Lines**: ~80

#### Slice 23.4: Filter Overlay Panel
- **Files**: `src/features/map/ui/FilterPanel.tsx` (new)
- **What**: "Open Now", "Has Cafe", "PYO", "Organic" toggles
- **Impact**: Contextual filtering
- **Lines**: ~120

#### Slice 23.5: Cluster Animation Easing
- **Files**: `src/features/map/utils/map-animations.ts` (new)
- **What**: Smooth zoom transitions with cubic-bezier
- **Impact**: Premium feel
- **Lines**: ~60

---

### Queue 24: Homepage Transformation
**Goal**: From static page to "Daily Dashboard".

#### Slice 24.1: Dynamic Seasonal Headline
- **Files**: `src/components/homepage/SeasonalHeadline.tsx` (new)
- **What**: "It's January. Time for hearty stews and crisp kale."
- **Impact**: Temporal relevance
- **Lines**: ~60

#### Slice 24.2: "Find Shops Open Now" CTA
- **Files**: `src/components/homepage/OpenNowCTA.tsx` (new)
- **What**: Geolocation-triggered primary action
- **Impact**: Immediate utility
- **Lines**: ~80

#### Slice 24.3: Weekend Planner Module
- **Files**: `src/components/homepage/WeekendPlanner.tsx` (new)
- **What**: "Planning a Sunday Roast? Best butchers within 10 miles"
- **Impact**: Intent-based discovery
- **Lines**: ~150

#### Slice 24.4: Social Proof Ticker
- **Files**: `src/components/homepage/ActivityTicker.tsx` (new)
- **What**: "Sam verified opening hours for Darts Farm"
- **Impact**: Community activity signals
- **Lines**: ~100

#### Slice 24.5: Hero Video Background
- **Files**: `src/components/homepage/HeroVideo.tsx` (new)
- **What**: Slow-motion wheat/dew video with text overlay
- **Impact**: Emotional connection
- **Lines**: ~80

---

### Queue 25: "Harvest" Color System (Optional Theme)
**Goal**: Add earthy theme as alternative, not replacement.

#### Slice 25.1: Harvest Color Tokens
- **Files**: `src/styles/themes/harvest.ts` (new)
- **What**: Define soil, leaf, clay, sun, stone palettes
- **Impact**: Theme foundation
- **Lines**: ~80

#### Slice 25.2: Theme Provider
- **Files**: `src/components/providers/ThemeProvider.tsx` (new)
- **What**: Context for theme switching
- **Impact**: Theme infrastructure
- **Lines**: ~60

#### Slice 25.3: Theme Toggle Component
- **Files**: `src/components/ui/ThemeToggle.tsx` (new)
- **What**: Switch between Kinetic and Harvest themes
- **Impact**: User preference
- **Lines**: ~50

#### Slice 25.4: Harvest Button Variants
- **Files**: `src/components/ui/Button.tsx` (modify)
- **What**: Add harvest-primary, harvest-secondary variants
- **Impact**: Themed interactions
- **Lines**: ~40

#### Slice 25.5: Harvest Card Styles
- **Files**: `src/components/ui/Card.tsx` (modify)
- **What**: "Stamped" border effect option
- **Impact**: Tactile aesthetic
- **Lines**: ~30

---

### Queue 26: "Add Farm" Flow Improvement
**Goal**: Reduce friction in farm submission.

#### Slice 26.1: Address Autocomplete
- **Files**: `src/components/forms/AddressAutocomplete.tsx` (new)
- **What**: Google Places API integration for address lookup
- **Impact**: Fewer errors, faster submission
- **Lines**: ~150

#### Slice 26.2: Opening Hours Builder
- **Files**: `src/components/forms/OpeningHoursBuilder.tsx` (new)
- **What**: Visual time picker instead of 14 text fields
- **Impact**: Reduced abandonment
- **Lines**: ~180

#### Slice 26.3: Real-Time Validation
- **Files**: `src/components/forms/ValidationFeedback.tsx` (new)
- **What**: Inline validation for website, phone, postcode
- **Impact**: Error prevention
- **Lines**: ~100

#### Slice 26.4: Progress Indicator
- **Files**: `src/components/forms/FormProgress.tsx` (new)
- **What**: Step indicator showing completion percentage
- **Impact**: Encourages completion
- **Lines**: ~60

---

### Queue 27: Accessibility & Motion Polish
**Goal**: WCAG 2.1 AA+ and refined motion design.

#### Slice 27.1: Screen Reader Map Fallback
- **Files**: `src/features/map/ui/MapAccessibleList.tsx` (new)
- **What**: Hidden list view for screen readers
- **Impact**: Blind user accessibility
- **Lines**: ~100

#### Slice 27.2: Skip Links Enhancement
- **Files**: `src/components/accessibility/SkipLinks.tsx` (modify)
- **What**: Add "Skip to Map", "Skip to Results"
- **Impact**: Keyboard navigation
- **Lines**: ~30

#### Slice 27.3: Page Transition Animation
- **Files**: `src/components/motion/PageTransition.tsx` (new)
- **What**: Cross-dissolve with 10px slide-up
- **Impact**: Polished navigation
- **Lines**: ~60

#### Slice 27.4: Button Spring Physics
- **Files**: `src/components/ui/Button.tsx` (modify)
- **What**: Framer Motion spring on hover (scale 1.05)
- **Impact**: Tactile feel
- **Lines**: ~40

#### Slice 27.5: Loading State Animations
- **Files**: `src/components/ui/LoadingStates.tsx` (new)
- **What**: "Harvesting data..." skeleton states
- **Impact**: Branded waiting experience
- **Lines**: ~80

---

### Queue 28: SEO & Programmatic Pages
**Goal**: Long-tail search visibility.

#### Slice 28.1: Location+Produce URL Generator
- **Files**: `src/lib/seo/programmatic-urls.ts` (new)
- **What**: Generate /[county]/[town]/[produce] routes
- **Impact**: 1000s of landing pages
- **Lines**: ~80

#### Slice 28.2: Location+Produce Page Template
- **Files**: `src/app/[county]/[town]/[produce]/page.tsx` (new)
- **What**: Dynamic page showing shops + produce context
- **Impact**: Long-tail SEO
- **Lines**: ~150

#### Slice 28.3: LocalBusiness Schema Enhancement
- **Files**: `src/lib/seo/structured-data.ts` (modify)
- **What**: Add openingHours, priceRange, geo to shop pages
- **Impact**: Rich snippets
- **Lines**: ~60

#### Slice 28.4: FAQPage Schema
- **Files**: `src/lib/seo/faq-schema.ts` (new)
- **What**: FAQ structured data for about/support pages
- **Impact**: Google FAQ cards
- **Lines**: ~50

---

### Queue 29: Voice & Microcopy
**Goal**: Consistent "Knowledgeable Neighbor" tone.

#### Slice 29.1: Error Message Overhaul
- **Files**: `src/lib/microcopy/errors.ts` (new)
- **What**: Friendly error messages ("Lost in the fields?")
- **Impact**: Brand consistency
- **Lines**: ~60

#### Slice 29.2: Empty State Messages
- **Files**: `src/lib/microcopy/empty-states.ts` (new)
- **What**: "No shops matching that. Try a county or vegetable."
- **Impact**: Helpful guidance
- **Lines**: ~40

#### Slice 29.3: Loading Messages
- **Files**: `src/lib/microcopy/loading.ts` (new)
- **What**: "Harvesting data...", "Finding farms..."
- **Impact**: Branded waiting
- **Lines**: ~30

#### Slice 29.4: Success Messages
- **Files**: `src/lib/microcopy/success.ts` (new)
- **What**: "Thanks! We're reviewing your farm now."
- **Impact**: Positive confirmation
- **Lines**: ~30

---

## Priority Order (Immediate Value First)

### Phase 1: Quick Wins (Week 1-2)
1. **Queue 18.1**: Open Status Badge
2. **Queue 18.2**: Distance Display
3. **Queue 18.3**: In Season Now Module
4. **Queue 18.4**: Amenity Icons
5. **Queue 22.1**: Verification Badge
6. **Queue 22.2**: Operating Status

### Phase 2: Navigation Enhancement (Week 3-4)
7. **Queue 19.1**: Location Context
8. **Queue 19.2**: Enhanced Bottom Nav
9. **Queue 19.5**: Command Palette (Cmd+K)
10. **Queue 24.1**: Seasonal Headline
11. **Queue 24.2**: Open Now CTA

### Phase 3: Seasonal Experience (Week 5-6)
12. **Queue 20.1**: Seasonal Data Structure
13. **Queue 20.2**: Produce Card
14. **Queue 20.3**: Seasonality Bar
15. **Queue 20.5**: Find Stockists Link

### Phase 4: Geographic Experience (Week 7-8)
16. **Queue 21.1**: UK SVG Map
17. **Queue 21.2**: Density Coloring
18. **Queue 21.3**: County Tooltips
19. **Queue 21.5**: County Landing Enhancement

### Phase 5: Map Polish (Week 9-10)
20. **Queue 23.2**: Category Pins
21. **Queue 23.4**: Filter Panel
22. **Queue 23.5**: Animation Easing

### Phase 6: Shop Experience (Week 11-12)
23. **Queue 22.3**: Seasonal Availability
24. **Queue 22.4**: Location Card
25. **Queue 22.5**: Farm Story
26. **Queue 22.6**: Related Farms

### Phase 7: Forms & Submission (Week 13-14)
27. **Queue 26.1**: Address Autocomplete
28. **Queue 26.2**: Opening Hours Builder

### Phase 8: Theme & Polish (Week 15-18)
29. **Queue 25**: Harvest Theme (all slices)
30. **Queue 27**: Accessibility & Motion
31. **Queue 29**: Microcopy

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Lighthouse Performance | 95+ | 100 | Lighthouse CI |
| Time to First Interaction | ~2s | <1s | Core Web Vitals |
| Bounce Rate | Unknown | <40% | Analytics |
| Session Duration | Unknown | >3min | Analytics |
| Add Farm Completion Rate | Unknown | >60% | Form analytics |
| Search to Shop Click | Unknown | <2 clicks | Event tracking |

---

## Risk Mitigation

1. **Feature Flags**: New features behind flags until verified
2. **A/B Testing**: Theme changes tested with subset
3. **Rollback Plan**: Git tags at each queue completion
4. **Mobile-First Testing**: All slices verified on iPhone SE first
5. **Lighthouse CI**: Block merge if score drops

---

## Starting Point

**Begin with Queue 18, Slice 1: Open Status Badge**

This slice:
- Adds immediate user value
- Requires no breaking changes
- Is self-contained (~120 lines)
- Sets pattern for future slices

Ready to implement on command.
