# Data Contract — FarmCompanion

## Primary Entity: Farm

### Required Fields
```typescript
{
  id: string              // UUID, immutable, primary key
  name: string            // Display name, min 2 chars, max 100
  slug: string            // URL-safe identifier, lowercase, hyphens, unique
  location: {
    lat: number           // WGS84 latitude, -90 to 90
    lng: number           // WGS84 longitude, -180 to 180
    address: string       // Street address, min 5 chars
    county: string        // UK county, standardized list
    postcode: string      // UK postcode format (e.g., "SW1A 1AA")
    city?: string         // Optional city/town
  }
}
```

### Optional Fields
```typescript
{
  images?: string[]       // Array of URLs (Vercel Blob or external)
  hours?: Array<{         // Opening hours, 7-day week
    day: string           // "Mon", "Tue", etc.
    open: string          // "09:00" 24h format
    close: string         // "17:00" 24h format
  }>
  offerings?: string[]    // Product categories (e.g., ["Vegetables", "Meat"])
  contact?: {
    phone?: string        // UK format, obfuscated on frontend
    email?: string        // Obfuscated on frontend
    website?: string      // Full URL with protocol
  }
  verified?: boolean      // Admin-verified farm
  description?: string    // Rich text, SEO-optimized, max 2000 chars
  updatedAt?: string      // ISO 8601 timestamp
  distance?: number       // Calculated field, km from user location
}
```

## Derived Fields (Runtime Only)
- `distance` — Haversine calculation from user geolocation
- `isOpen` — Calculated from `hours` + current time + timezone
- `categories` — Many-to-many via `FarmCategory` join table

## Data Sources
1. **Primary**: Prisma ORM → Supabase PostgreSQL
2. **Cache**: Vercel KV (Redis) for frequently accessed farms
3. **Search**: Meilisearch index (synced from database)
4. **Static**: JSON file at `/data/farms.json` (legacy, deprecating)

## Data Integrity Rules
- `slug` must be unique and immutable (generates SEO URLs)
- `lat`/`lng` required for map display
- `county` must match UK county list (validation via Zod)
- `postcode` must match UK regex pattern
- `images` URLs must be HTTPS, validated on upload

## Breaking Changes Policy
- Never remove required fields
- New required fields need default values + migration script
- Rename fields via database migration + compatibility layer
- Deprecated fields marked with `@deprecated` JSDoc

## Example Farm Entity
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Grange Farm Shop",
  "slug": "grange-farm-shop-essex",
  "location": {
    "lat": 51.7355,
    "lng": 0.4627,
    "address": "Hatfield Road, Chelmsford",
    "city": "Chelmsford",
    "county": "Essex",
    "postcode": "CM1 3RQ"
  },
  "images": ["https://farmcompanion.blob.core.windows.net/photos/grange-1.jpg"],
  "hours": [
    {"day": "Mon", "open": "09:00", "close": "17:00"},
    {"day": "Tue", "open": "09:00", "close": "17:00"}
  ],
  "offerings": ["Vegetables", "Eggs", "Meat"],
  "contact": {
    "phone": "01245 123456",
    "email": "info@grangefarm.co.uk",
    "website": "https://grangefarm.co.uk"
  },
  "verified": true,
  "description": "Family-run farm shop...",
  "updatedAt": "2025-01-17T10:30:00Z"
}
```
