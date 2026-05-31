# Map Redesign: Komoot-class discovery in the Pitti Press brand

- Date: 2026-05-31
- Status: Approved (direction, priorities, base-map path, CC policy all confirmed by operator)
- Surface: `farm-frontend` `/map`
- Reference: Komoot Discover map (`komoot.com/discover/.../tours?...&map=true`)

## Goal

Bring `/map` to or beyond Komoot's discovery quality, expressed in the existing
Pitti Press editorial brand (not Komoot's green/outdoors look). The architecture
is already a Komoot-class split list+map view; the gap is finish and feel, not
structure.

Operator priorities (all four selected): map look/feel, photo-rich result cards,
pin + hover choreography, in-context detail.

## Success criteria

- Base map reads as a custom branded artifact (Cream land, Loam labels), not a
  generic third-party style.
- Result cards lead with imagery and a tight stat row; feel like discovery.
- Pins have crafted default/hover/selected/open-now states; list and map sync
  both directions; `flyTo` only on explicit selection.
- Selecting a farm enriches in place (photo/hours/offerings/CTA) instead of
  bouncing to `/shop`.
- Every slice: `impeccable detect` clean, `next build` green, no SEO/route change.

## Governing constraints (from the codebase, not invented)

### Imagery law (`lib/farm-hero-image.ts`, design-law-reconciliation 2026-05-27)
An image must never imply "this is what this farm looks like" unless it is a real
owner/admin/user submitted photo. Branded illustration (Pitti/Apothecary) is
explicitly allowed on cards/popovers, never as a farm-page hero.

### CC imagery is already wired
`scripts/pipeline/stages/05-images.ts` attaches CC photos from Geograph +
Wikimedia, fetched by coordinate, filtered to `MAX_KM = 0.5` of the farm and
ranked by proximity (`score = 1000 - round(km*1000)`). Each requires non-empty
`license + attribution + sourceUrl`. `uploadedBy` distinguishes owner vs CC. The
current `FarmList` already shows `images[0]` as a 72px thumbnail.

### CC policy decision: hybrid by confidence (coarse tier)
- owner/admin/user photo -> full documentary imagery ("this is the farm")
- CC photo (already passed the 0.5km pipeline bar) -> full imagery, tagged as
  locale, with visible attribution
- none -> Pitti/Apothecary illustration -> typographic fallback

The fine numeric threshold (e.g. full imagery only under 150m, else illustration)
needs the raw `score` persisted as a DB column, which the schema lacks today. It
is a migration (Queue 5). Deferred unless live QA shows the 0.5km bar is too
loose.

## Brand palette -> map recolor (from design-system inventory)

Tokens are CSS vars that flip light/dark in `harvest-theme.css`.

| Map element       | Token            | Light     | Dark                  |
|-------------------|------------------|-----------|-----------------------|
| Land/background   | `--paper`        | `#F2EBDA` | `#15120D`             |
| Water             | `--accent` (muted)| `#1F3A5F`| `#6FA0D9`             |
| Major roads       | `--ink-muted`    | `#57534E` | `#A8A29E`             |
| Minor roads/hairl | `--border`       | `#E7E5E4` | `rgba(255,255,255,.08)`|
| Parks (NOT green) | `--map-park`     | `#E8E1D0` | `#23201A`             |
| Label text        | `--ink`          | `#0F0E0C` | `#F4F1EA`             |
| Label halo        | `--paper`        | `#F2EBDA` | `#15120D`             |
| Selected/active   | `--brand`        | `#D33A2C` | `#FF6B5B`             |

Rules: no green parks (warm stone tint), hairlines not shadows, one Vermilion
stamp (the selected pin is the only chromatic moment). Water lightness tuned in
live QA (deep Sea Ink may be too heavy as a fill).

## Base-map approach (operator chose "premium vector + brand recolor")

Use **OpenFreeMap** (Positron vector style) plus a runtime recolor that walks
`map.getStyle().layers` and repaints by role using the palette above. No API key,
no request caps, OSM attribution only. Re-run recolor on light/dark theme flip.
Leaflet fallback keeps raster with a light brand tint.

Recolor routing matches OpenMapTiles-schema layer ids (`water`, `landcover`,
`landuse`, `transportation`, `building`, `place`/`poi`). Guard `text-color` sets
behind presence of `text-field` (setting text-color on an icon-only layer
throws). Do not re-read `getStyle()` to verify a paint change (known stale-read
quirk); trust the render.

Graduation path (not now): self-hosted Protomaps UK PMTiles extract + authored
style for pixel-level control.

## UI patterns to adopt (from research)

- Cards: large image, one bold anchor stat (distance), 2-3 supporting stats max,
  one elevation tier applied only on hover/selected, resting cards flat.
- Pins: two-tier (labelled/branded for in-view farms, plain dots for the long
  tail); four states default/hover-lift/selected/open-now; selected persists on
  top across zoom/pan.
- Sync: list hover lifts pin; pin hover scrolls card into view; debounce
  `moveend` ~200-300ms for search-as-I-move; animate `flyTo` only on click.

## Slices (each CLAUDE.md-compliant: <=8 files, <=300 lines, shippable)

### M0 - Expose image provenance + attribution in `/api/farms` (prerequisite)
- Extend the per-image payload from `{ url, alt }` to
  `{ url, alt, uploadedBy, attribution, sourceUrl, license }`.
- Update `FarmImage` type (and any consumer typing) to match.
- Unit test the route's image mapping (provenance + attribution surfaced;
  backward-compatible for images lacking CC metadata).
- Files: `app/api/farms/route.ts`, `types/farm.ts`, one test.
- Verify: unit test green, `next build` green, existing 72px thumbnail unaffected.

### M2 - Editorial result cards (`FarmList`)
- Replace the off-brand green/rounded card (`#2D5016`, `#EDEDED`, `rounded-xl`)
  with a Pitti Press card: image-forward with the hybrid-by-confidence imagery
  hierarchy from M0, Clash title, mono stat row (distance / open-now / county),
  offerings as IBM Plex mono tags, one elevation tier on hover/selected, Vermilion
  selected hairline. CC images carry a subtle attribution affordance + "nearby"
  cue. Illustration/typographic fallback when no photo.
- Resolve the radius nuance by matching the just-shipped homepage cards; gate on
  `impeccable detect`.
- Files: `components/FarmList.tsx` (+ optional `FarmCard` extraction).
- Verify: `impeccable detect` clean, live QA desktop+mobile, `next build` green.

### M1 - Brand base map
- New `lib/map-theme.ts` (palette + `recolorMap(map, isDark)`); switch
  `map-config.ts` style source to OpenFreeMap Positron; call recolor on `load`
  and theme change in `MapLibreShell.tsx`. Leaflet tint fallback.
- Files: `lib/map-theme.ts` (new), `lib/map-config.ts`, `MapLibreShell.tsx`,
  `LeafletShell.tsx`.
- Verify: live QA light+dark, attribution present, `next build` green.

### M3 - Pins + clusters + hover choreography
- Rebrand `pin-icons.ts` (drop the 17-color non-brand palette; brand body +
  semantic open-now ring), two-tier pin/dot logic, selected-persist; recolor
  clusters in `MapLibreShell.tsx`/`cluster-config.ts` to brand density tiers;
  bi-directional hover/scroll sync.
- Files: `pin-icons.ts`, `cluster-config.ts`, `MapLibreShell.tsx`.
- Verify: live QA, keyboard nav intact, `impeccable detect` clean.

### M4 - In-context detail
- Consolidate `FarmPreviewCard`/`FarmPopup`/`FarmDetailSheet` into one branded
  inline detail reusing the M2 card system: image (M0 hierarchy + attribution),
  hours, offerings, amenities, directions/call CTA; `/shop` becomes the secondary
  "full details" link.
- Files: the preview/popup/sheet components + small wiring in `map/page.tsx`.
- Verify: live QA desktop popover + mobile sheet, focus-return intact.

Order: M0 -> M2 -> M1 -> M3 -> M4. M2 depends on M0; M3 best after M1.

## Risks / rollback

- Per slice: single-area presentation/data changes, each `git checkout`-revertible.
- Prod gotcha: avoid `bg-{token}/NN` opacity modifiers (break under prod build);
  verify every slice on a real `next build`.
- OpenFreeMap is a third-party tile host; if it degrades, the OSM-raster fallback
  in `map-config.ts` remains. Protomaps self-host is the escape hatch.

## Deferred / out of scope

- Persisting numeric proximity `score` for fine confidence (DB migration).
- PostGIS / geospatial index work (Queue 5).
- Protomaps self-hosted basemap.
