# Architecture — FarmCompanion

## Design Principles
1. **Feature-first folders**: Group by domain (farms, map, search), not tech layer
2. **Colocation**: Keep UI, models, API routes, and utils together per feature
3. **Explicit dependencies**: Features import from `shared`, never sibling features
4. **Progressive enhancement**: Server components by default, 'use client' explicit
5. **Zero runtime config**: All config at build time via env vars

## Folder Structure (Target)
```
src/
├── app/                    # Next.js App Router (public URLs)
│   ├── map/                # → uses features/map
│   ├── shop/[slug]/        # → uses features/farms
│   ├── categories/[slug]/  # → uses features/search
│   └── api/                # → delegates to features/*/api
├── features/
│   ├── farms/              # Farm entities, detail pages, CRUD
│   │   ├── api/            # API route handlers (Next.js route handlers)
│   │   ├── model/          # Types, schemas, validation
│   │   ├── ui/             # Farm-specific React components
│   │   └── lib/            # Business logic, data fetching
│   ├── map/                # Interactive map, markers, clustering
│   │   ├── ui/             # MapShell, MapSearch, MarkerActions
│   │   ├── model/          # Marker types, cluster config
│   │   └── lib/            # Map utilities, bounds calculation
│   ├── search/             # Filtering, full-text, faceted search
│   │   ├── model/          # Search params, filter state
│   │   ├── lib/            # Search algorithms, Meilisearch client
│   │   └── ui/             # Search input, filter chips
│   └── locations/          # Geolocation, counties, regions
│       ├── model/          # Location types, UK counties
│       ├── lib/            # Haversine, PostGIS queries, geocoding
│       └── ui/             # LocationTracker, county selectors
├── shared/
│   ├── ui/                 # Radix UI wrappers, Button, Card, Modal
│   ├── lib/                # Generic utils (dates, strings, validation)
│   └── config/             # Constants, env var accessors
└── types/                  # Global TypeScript types
```

## Data Flow
1. **Page**: Next.js route fetches data (Server Component)
2. **Feature**: Page imports from `features/*/index.ts` barrel
3. **Feature lib**: Business logic, Prisma queries, external APIs
4. **Feature model**: Type definitions, Zod schemas
5. **Feature UI**: Client components, hooks, animations
6. **Shared**: Cross-cutting concerns (geo utils, UI primitives)

## Current State (Before Migration)
- Flat `/src/components` with 80+ files
- Map logic in `MapShell.tsx` (1,112 lines)
- Haversine formula duplicated 5x
- No feature boundaries, tight coupling

## Migration Strategy
- **Phase 1**: Create skeleton + barrel exports (this slice)
- **Phase 2**: Move map feature (MapShell, MapSearch, clustering)
- **Phase 3**: Extract farms feature (FarmCard, detail page)
- **Phase 4**: Extract search + locations features
- **Phase 5**: Remove old `/src/components` duplicates
