# Farm Pipeline Enrichment - God-Tier Implementation Plan

## Executive Summary

Complete the data pipeline to flow: **Pipeline JSON → PostgreSQL → Live Site**
with hybrid image support (Google Photos + Runware AI fallback).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOD-TIER DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  FARM-PIPELINE                              FARM-FRONTEND
  ─────────────                              ─────────────
       │                                          │
       ▼                                          │
┌──────────────────┐                              │
│ google_places_   │                              │
│ fetch.py         │                              │
│ ────────────────  │                              │
│ • Farm data      │                              │
│ • photo_reference│                              │
│ • opening_hours  │                              │
│ • offerings      │                              │
└────────┬─────────┘                              │
         │                                        │
         ▼                                        │
┌──────────────────┐     ┌──────────────────┐     │
│ farms.uk.json    │────▶│ import-farms.ts  │     │
│ (enriched)       │     │ ───────────────── │     │
└──────────────────┘     │ • Upsert farms   │     │
                         │ • Map categories │     │
                         │ • Create images  │     │
                         └────────┬─────────┘     │
                                  │               │
                                  ▼               │
                         ┌──────────────────┐     │
                         │   PostgreSQL     │     │
                         │   (Supabase)     │◀────┘
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              ┌─────────┐  ┌───────────┐  ┌──────────┐
              │ /map    │  │ /shop/... │  │ /api/... │
              └─────────┘  └───────────┘  └──────────┘
```

---

## Phase 1: Database Schema Migration

### New Fields for Image Table

```prisma
model Image {
  // ... existing fields ...

  // New: Image source tracking
  source            String   @default("upload") @db.VarChar(20)
  // Values: 'google', 'runware', 'upload'

  // New: Google Photos support
  googlePhotoRef    String?  @db.VarChar(500)
  googleAttribution String?  @db.Text

  // New: Expiry tracking for Google URLs
  urlExpiresAt      DateTime?
}
```

### Migration File

```sql
-- Add source column
ALTER TABLE images ADD COLUMN source VARCHAR(20) DEFAULT 'upload';

-- Add Google photo reference
ALTER TABLE images ADD COLUMN google_photo_ref VARCHAR(500);
ALTER TABLE images ADD COLUMN google_attribution TEXT;
ALTER TABLE images ADD COLUMN url_expires_at TIMESTAMP;

-- Update existing AI-generated images
UPDATE images SET source = 'runware' WHERE uploaded_by = 'ai_generator';

-- Create index for efficient queries
CREATE INDEX images_source_idx ON images(source);
```

---

## Phase 2: Pipeline Fixes

### 2.1 Fix City Extraction

**File:** `farm-pipeline/src/google_places_fetch.py`

Add `postal_town` type check:

```python
elif "postal_town" in types:
    result["city"] = long_name
elif "locality" in types or "sublocality" in types:
    if not result["city"]:  # Don't override postal_town
        result["city"] = long_name
```

### 2.2 Fix Postcode Fallback

Remove the fallback that assigns "UK" as postcode:

```python
# Before: result["postcode"] = parts[-1].strip()  # Could be "UK"
# After: Only assign if it matches UK postcode pattern
import re
UK_POSTCODE = r'^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$'
if re.match(UK_POSTCODE, parts[-1].strip(), re.I):
    result["postcode"] = parts[-1].strip()
```

### 2.3 Store Photo References

Instead of fetching photo URLs, store the reference:

```python
# Current: Fetches URL (expires)
images = await get_place_images(client, place_id, photos, max_images)

# New: Store references
photo_refs = []
for photo in photos[:max_images]:
    photo_refs.append({
        "reference": photo.get("photo_reference"),
        "width": photo.get("width"),
        "height": photo.get("height"),
        "attributions": photo.get("html_attributions", [])
    })
place['google_photos'] = photo_refs
```

### 2.4 Extract Offerings from Google Types

```python
TYPE_TO_OFFERINGS = {
    "bakery": ["Bakery", "Baked Goods"],
    "cafe": ["Cafe", "Coffee"],
    "restaurant": ["Restaurant", "Food"],
    "grocery_or_supermarket": ["Groceries"],
    "florist": ["Flowers", "Cut Flowers"],
    "pet_store": ["Pet Supplies"],
    "liquor_store": ["Alcohol", "Wine", "Cider"],
}

def extract_offerings(types: List[str], scraped_content: str) -> List[str]:
    offerings = set()

    # From Google types
    for t in types:
        if t in TYPE_TO_OFFERINGS:
            offerings.update(TYPE_TO_OFFERINGS[t])

    # From scraped content keywords
    KEYWORDS = {
        "vegetables": "Vegetables",
        "fruit": "Fruit",
        "meat": "Meat",
        "butcher": "Butchery",
        "cheese": "Cheese",
        "eggs": "Eggs",
        "honey": "Honey",
        "organic": "Organic",
        "pick your own": "Pick Your Own",
        "pyo": "Pick Your Own",
    }

    content_lower = scraped_content.lower()
    for keyword, offering in KEYWORDS.items():
        if keyword in content_lower:
            offerings.add(offering)

    return list(offerings)
```

---

## Phase 3: Import Script

### File: `farm-frontend/src/scripts/import-farms.ts`

```typescript
#!/usr/bin/env tsx
/**
 * Import farms from pipeline JSON to PostgreSQL
 *
 * Usage:
 *   pnpm tsx src/scripts/import-farms.ts [options]
 *
 * Options:
 *   --source=url|file   Source: URL or local file path
 *   --dry-run           Preview changes without writing
 *   --limit=N           Process only N farms
 *   --force             Overwrite existing data
 */

import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema matching pipeline output
const PipelineFarmSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    city: z.string().optional(),
    county: z.string(),
    postcode: z.string(),
  }),
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
  }),
  offerings: z.array(z.string()).optional(),
  hours: z.array(z.object({
    day: z.string(),
    open: z.string(),
    close: z.string(),
  })).optional(),
  rating: z.number().optional(),
  user_ratings_total: z.number().optional(),
  place_id: z.string().optional(),
  types: z.array(z.string()).optional(),
  google_photos: z.array(z.object({
    reference: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    attributions: z.array(z.string()).optional(),
  })).optional(),
})

// Category mapping from offerings to category slugs
const OFFERING_TO_CATEGORY: Record<string, string> = {
  'Vegetables': 'vegetable-farms',
  'Fruit': 'fruit-farms',
  'Meat': 'meat-producers',
  'Butchery': 'meat-producers',
  'Cheese': 'cheese-makers',
  'Dairy': 'dairy-farms',
  'Eggs': 'free-range-eggs',
  'Honey': 'honey-beekeeping',
  'Organic': 'organic-farms',
  'Pick Your Own': 'pick-your-own',
  'Cafe': 'farm-cafes',
  'Coffee': 'farm-cafes',
  'Bakery': 'bakeries-flour-mills',
  'Flowers': 'cut-flowers',
  'Wine': 'vineyards',
  'Cider': 'cider-apple-juice',
}

async function importFarms() {
  // Implementation details...
}
```

---

## Phase 4: Frontend Image Handling

### 4.1 Google Photo URL Fetcher

**File:** `farm-frontend/src/lib/google-photos.ts`

```typescript
const GOOGLE_PHOTOS_CACHE = new Map<string, { url: string; expires: number }>()

export async function getGooglePhotoUrl(
  photoReference: string,
  maxWidth: number = 800
): Promise<string | null> {
  // Check cache
  const cached = GOOGLE_PHOTOS_CACHE.get(photoReference)
  if (cached && cached.expires > Date.now()) {
    return cached.url
  }

  // Fetch from Google (server-side only)
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  const url = `https://maps.googleapis.com/maps/api/place/photo?` +
    `maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`

  // Cache for 23 hours (Google URLs last ~24h)
  GOOGLE_PHOTOS_CACHE.set(photoReference, {
    url,
    expires: Date.now() + 23 * 60 * 60 * 1000
  })

  return url
}
```

### 4.2 Image Priority Logic

**File:** `farm-frontend/src/lib/farm-images.ts`

```typescript
type ImageSource = 'owner' | 'user' | 'google' | 'runware' | 'upload'

const SOURCE_PRIORITY: ImageSource[] = ['owner', 'user', 'google', 'runware', 'upload']

export function getHeroImage(images: Image[]): Image | null {
  const approved = images.filter(i => i.status === 'approved')

  for (const source of SOURCE_PRIORITY) {
    const img = approved.find(i =>
      i.source === source && i.isHero
    )
    if (img) return img
  }

  // Fallback to any approved image
  return approved[0] || null
}
```

---

## Phase 5: Integration Flow

### GitHub Actions Enhancement

**File:** `farm-frontend/.github/workflows/sync-farms.yml`

Add database import step:

```yaml
- name: Import to database
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    GOOGLE_PLACES_API_KEY: ${{ secrets.GOOGLE_PLACES_API_KEY }}
  run: |
    pnpm tsx src/scripts/import-farms.ts \
      --source=public/data/farms.uk.json

- name: Generate missing images
  env:
    RUNWARE_API_KEY: ${{ secrets.RUNWARE_API_KEY }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    pnpm tsx src/scripts/generate-farm-images.ts \
      --limit=50 \
      --upload
```

---

## Execution Order

| Step | Action | Files Changed | Risk |
|------|--------|---------------|------|
| 1 | Schema migration | prisma/schema.prisma | Low |
| 2 | Pipeline: Fix city/postcode | google_places_fetch.py | Low |
| 3 | Pipeline: Add photo refs | google_places_fetch.py | Low |
| 4 | Pipeline: Extract offerings | google_places_fetch.py | Low |
| 5 | Build import script | src/scripts/import-farms.ts | Medium |
| 6 | Test import locally | - | Low |
| 7 | Frontend: Image priority | src/lib/farm-images.ts | Low |
| 8 | Frontend: Google fetcher | src/lib/google-photos.ts | Low |
| 9 | Run pipeline + import | - | Medium |
| 10 | Verify on live site | - | Low |

---

## Verification Commands

```bash
# After pipeline run
cd farm-pipeline
python3 -c "
import json
with open('dist/farms.uk.json') as f:
    farms = json.load(f)
    with_photos = sum(1 for f in farms if f.get('google_photos'))
    with_city = sum(1 for f in farms if f.get('location', {}).get('city'))
    with_offerings = sum(1 for f in farms if f.get('offerings'))
    print(f'Farms with Google photos: {with_photos}/{len(farms)}')
    print(f'Farms with city: {with_city}/{len(farms)}')
    print(f'Farms with offerings: {with_offerings}/{len(farms)}')
"

# After import
cd farm-frontend
pnpm tsx -e "
import { prisma } from './src/lib/prisma'
async function check() {
  const farms = await prisma.farm.count({ where: { status: 'active' } })
  const images = await prisma.image.count({ where: { status: 'approved' } })
  const googleImages = await prisma.image.count({
    where: { source: 'google', status: 'approved' }
  })
  console.log('Active farms:', farms)
  console.log('Approved images:', images)
  console.log('Google images:', googleImages)
}
check()
"
```

---

## Rollback Plan

1. **Schema**: Columns are additive, no breaking changes
2. **Import**: Can re-run with `--force` to reset
3. **Images**: Runware fallback always available
4. **Frontend**: Feature flags can disable Google photos

---

## Success Criteria

- [ ] 100% of farms have valid city (up from 73%)
- [ ] 100% of farms have valid postcode (up from 61%)
- [ ] 80%+ of farms have offerings mapped to categories
- [ ] 60%+ of farms have Google photo references
- [ ] 100% of farms have at least one image (Google or Runware)
- [ ] Live site displays correct data from database
