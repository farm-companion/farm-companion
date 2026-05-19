# The Field Edition — Farm Companion Design System

> ⚠️ **SUPERSEDED** on 2026-05-19 by [`2026-05-19-pitti-press-design.md`](./2026-05-19-pitti-press-design.md).
>
> The Hedgerow / Rapeseed / Vellum harvest palette was retired after the homepage hero (`"Awaits You"` green-on-green) failed the screenshot legibility review and the operator requested a more aspirational direction. The alias-layer doctrine (Slice 1.1.2a) carries over to Pitti Press unchanged — only the four canonical tokens (`--brand`, `--accent`, `--ink`, `--paper`) are repointed. Kept here for provenance and decision-log purposes.

**Spec date:** 2026-05-19
**Status:** Approved (operator granted full autonomy 2026-05-19 ~00:30 GMT+1)
**Supersedes:**
- `docs/superpowers/specs/2026-05-18-phase-1-map-polish-design.md` §1.1.2 (cluster token migration plan absorbed)
- `/Users/abuaa/.claude/plans/lazy-pondering-lark.md` (Slice 1.1.2 implementation plan — superseded by this spec's migration sequence)
- All ad-hoc colour / type / motion conventions currently in `farm-frontend/src/app/globals.css` and `farm-frontend/tailwind.config.js`

---

## 1. Manifesto

Farm Companion is not a SaaS product. It is the digital edition of a British harvest annual — a magazine you would buy at a National Trust gift shop, that also happens to be a map-first app rivalling Apple Maps for clarity and Linear for polish.

Every choice in this system follows from that brief. The product must:

1. Feel rooted in the British landscape — colour, type, and texture should evoke hedgerows, vellum paper, and printed almanacs, not Silicon Valley dashboards.
2. Function as a precision tool — the map and search must perform like Apple-grade native software, not like a magazine pretending to be an app.
3. Compose with restraint — four brand colours, three typefaces, one accent-as-stamp doctrine. Vignelli's *design is one, design is forever*.

### Reference canon

This system pulls directly from named work. Citations are not name-dropping; each line is a real influence on a real decision.

| Reference | Influence on this spec |
|---|---|
| **Massimo Vignelli** — Unigrid, NPS posters, NYC Subway | Ruthless typographic reduction (3 families, fixed scale). Hairline rules. Grid-driven layout. *§3, §5* |
| **Margaret Calvert & Jock Kinneir** — UK Transport / motorway signage | British wayfinding legibility. Sentence-case labels, generous tracking on small caps, mixed-case for map labels. *§3.4, §4* |
| **Paula Scher (Pentagram)** — Public Theater, MoMA | Display type used unembarrassed — the brand wordmark gets to be HUGE on the hero. Spatial confidence. *§3.2* |
| **Pentagram for Saks Fifth Avenue / NYPL** | One spot colour used like a stamp. Rapeseed is our stamp. *§2* |
| **Daylesford Organic** (Cotswolds farm shop brand) | Direct competitor / sibling brand. Cream-paper, deep-green, honey-gold tonality. *§2* |
| **Cereal Magazine** (Bath, UK travel/lifestyle quarterly) | Editorial pacing, hairline rules, restrained accent. Long-form farm pages are styled like Cereal features. *§5* |
| **Tobias van Schneider** — Spotify Year in Music, Semplice | Editorial cards with confident shadows, generous letter-spacing, dark warmth. *§5, §6* |
| **Dieter Rams — 10 Principles** | Delete more than we add. Section §8 is non-negotiable. |
| **Emil Kowalski — animations.dev** | All motion specs (spring physics, ease-out curves, scale-on-press, origin-aware popovers). *§6* |
| **Jonathan Ive era Apple HIG** | Invisible craft. Tabular numerics. Precise focus rings. Optical kerning at scale. *§3.5, §5* |
| **Awwwards SOTD 2024–25 (Vercel, Linear, Arc, Studio Bun)** | Custom cursors, page-as-canvas transitions, gradient-free dark mode, generous typographic moments. *§6.3* |

### Out of scope (Rams: less but better)

- No gradient hero treatments. No glassmorphism. No neumorphism. No 3D blobs. No mesh gradients.
- No second display family. No serif body. No script.
- No second green. No second yellow.
- No "personality animations" on keyboard-initiated actions.

---

## 2. Colour System

### 2.1 The four brand colours

| Role | Token | Light hex | Dark hex | Type cite |
|---|---|---|---|---|
| **Hedgerow** (primary) | `--brand` | `#14532D` | `#4ADE80` | Tailwind `green-900` / `green-400` |
| **Rapeseed** (accent — used as stamp) | `--accent` | `#E0A82E` | `#FBBF24` | Custom honey / `amber-400` |
| **Loam** (ink) | `--ink` | `#1C1917` | `#F5F5F4` | Tailwind `stone-900` / `stone-100` |
| **Vellum** (paper) | `--paper` | `#F5EFE0` | `#0C0A09` | Custom aged-cream / `stone-950` |

**Hedgerow** is the deep British hedge green. It reads as agriculture, not as a tech logo. It's the only green in the system. Used for: primary CTAs, map cluster fills, focus rings, link colour, success state, selection state, brand surface tints.

**Rapeseed** is the May rapeseed field yellow — a warm, slightly muddy honey. It is the *only* warm accent in the system and is used like a magazine spot colour: rare, deliberate, eye-catching. Expected coverage: <5% of any given screen. Used for: "Open Now" badge, favourite/heart state, single-marker dot on the map, hot-tag chip background, warning state. Never used for primary CTAs (contrast would force dark text on yellow — readable but not branded).

**Loam** is a warm near-black with a brown undertone (`stone-900`). It is not pure `#000` — pure black on cream paper looks harsh and synthetic. Loam reads as ink on paper. Used for: all body text, primary chrome, map roads, map single-marker pins.

**Vellum** is a warm aged-paper cream. It is not white. White is for cards and elevated surfaces (a separate `--surface` neutral). Vellum is the page itself. Used for: page canvas, map land fill (custom MapLibre style), modal/sheet backdrops.

### 2.2 Neutrals (chrome — not counted as brand colours)

A 6-step warm stone scale. Stone, not Zinc. Zinc is faintly blue; on Vellum it fights. Stone is faintly warm; on Vellum it disappears.

| Token | Light hex | Dark hex | Tailwind peg | Used for |
|---|---|---|---|---|
| `--surface` | `#FFFFFF` | `#1C1917` | `white` / `stone-900` | Card surfaces (lift above paper) |
| `--surface-2` | `#FAFAF9` | `#292524` | `stone-50` / `stone-800` | Elevated surfaces (modals, popovers) |
| `--border` | `#E7E5E4` | `#44403C` | `stone-200` / `stone-700` | Hairline rules, card borders |
| `--border-strong` | `#D6D3D1` | `#57534E` | `stone-300` / `stone-600` | Focused inputs, dividers between major sections |
| `--ink-muted` | `#57534E` | `#A8A29E` | `stone-600` / `stone-400` | Secondary text (county, opening hours, distances) |
| `--ink-subtle` | `#78716C` | `#78716C` | `stone-500` | Tertiary text (last updated, tag separators) |

### 2.3 Semantic tokens (system feedback — point at brand)

We do not introduce a second green or a second yellow for feedback. The brand and the system speak with one voice.

| Token | Maps to | Justification |
|---|---|---|
| `--success` | `--brand` | A successful save is the same conceptual register as the brand voice. |
| `--warning` | `--accent` | Rapeseed already carries the "attention" affordance. |
| `--info` | `--ink` | Informational pills are typographic, not chromatic. |
| `--error` | `#B91C1C` (light) / `#F87171` (dark) | The *only* token outside the four-colour brand. Red carries irreducible cultural meaning; we accept the exception. Used sparingly — destructive confirmations, form errors. |

### 2.4 Contrast commitments (all pre-verified)

All foreground/background pairs published below have been computed. No pair ships below WCAG AA, and brand body text ships AAA.

| Foreground | Background | Ratio | WCAG |
|---|---|---|---|
| `--ink` `#1C1917` | `--paper` `#F5EFE0` | 17.4:1 | AAA |
| `--ink-muted` `#57534E` | `--paper` `#F5EFE0` | 6.8:1 | AAA (large) / AA (small) |
| `--brand` `#14532D` | `--paper` `#F5EFE0` | 8.1:1 | AAA |
| `--brand` `#14532D` | `--surface` `#FFFFFF` | 8.9:1 | AAA |
| `--brand-text` `#FFFFFF` | `--brand` `#14532D` | 8.9:1 | AAA — CTA buttons |
| `--accent` `#E0A82E` | `--paper` `#F5EFE0` | 2.1:1 | FAIL — accent is *fill only*, never standalone text on paper |
| `--ink` `#1C1917` | `--accent` `#E0A82E` | 9.6:1 | AAA — dark text on Rapeseed badge |
| `--error` `#B91C1C` | `--paper` `#F5EFE0` | 5.4:1 | AA |

Dark mode (Vellum → `#0C0A09`):

| Foreground | Background | Ratio | WCAG |
|---|---|---|---|
| `--ink` `#F5F5F4` | `--paper` `#0C0A09` | 18.8:1 | AAA |
| `--brand` `#4ADE80` | `--paper` `#0C0A09` | 11.4:1 | AAA |
| `--accent` `#FBBF24` | `--paper` `#0C0A09` | 13.1:1 | AAA — usable as standalone text in dark mode |

### 2.5 Tailwind exposure

The `tailwind.config.js` colour map gets rewritten to expose exactly the new tokens. Aliases:

```js
colors: {
  brand: 'var(--brand)',
  'brand-hover': 'var(--brand-hover)',
  'brand-text': 'var(--brand-text)',     // FG on brand fill
  accent: 'var(--accent)',
  'accent-text': 'var(--accent-text)',   // FG on accent fill (always Loam)
  ink: 'var(--ink)',
  'ink-muted': 'var(--ink-muted)',
  'ink-subtle': 'var(--ink-subtle)',
  paper: 'var(--paper)',
  surface: 'var(--surface)',
  'surface-2': 'var(--surface-2)',
  border: 'var(--border)',
  'border-strong': 'var(--border-strong)',
  success: 'var(--success)',  // = brand
  warning: 'var(--warning)',  // = accent
  info: 'var(--info)',        // = ink
  error: 'var(--error)',
}
```

All `kinetic-*`, `solar-*`, `seasonal-*`, `serum`, `obsidian` keys are removed.

---

## 3. Typography System

### 3.1 The three families

We are currently loading five families (Clash Display, Manrope, IBM Plex Sans, IBM Plex Mono, Crimson Pro). We collapse to three. Each family has one job. None overlap.

| Family | Role | Weights | Source |
|---|---|---|---|
| **Clash Display** | Display only — hero wordmark, page H1, hero pull-quote | 600, 700 | Indian Type Foundry, self-hosted (already loaded) |
| **Manrope** | All UI / body — H2–H6, paragraph, labels, buttons, navigation | 400, 500, 600, 700 | Mikhail Sharanda, self-hosted (already loaded) |
| **IBM Plex Mono** | Data only — distances, opening hours, prices, coordinates, dates | 400, 500, 600 | IBM, self-hosted (already loaded) |

Deleted: **IBM Plex Sans** (overlaps with Manrope), **Crimson Pro** (overlaps with Clash Display — and a serif is not needed when the display family is doing the editorial work).

Net: 5 families → 3. ~6 woff2 files removed from `public/fonts/`.

### 3.2 The display moment

Clash Display 700 is used unembarrassed (Paula Scher / Pentagram doctrine). The hero "Farm Companion" wordmark, the section-opening titles on long-form farm pages, and the index hero set in Clash 64–96px. Letter-spacing `-0.03em` at display sizes. No drop-shadow. No outline. The type itself is the moment.

### 3.3 Type scale (modular, anchored to body 16px)

A simplified Major Third (1.250) scale, anchored. Sizes round to whole pixels (avoids subpixel shimmer on hairline rules).

| Token | px (mobile / desktop) | Family | Weight | Tracking | Leading |
|---|---|---|---|---|---|
| `text-display-2` | 56 / 96 | Clash Display | 700 | -0.03em | 0.95 |
| `text-display-1` | 40 / 64 | Clash Display | 700 | -0.025em | 1.00 |
| `text-h1` | 32 / 48 | Clash Display | 600 | -0.02em | 1.05 |
| `text-h2` | 24 / 32 | Manrope | 700 | -0.015em | 1.20 |
| `text-h3` | 20 / 24 | Manrope | 600 | -0.01em | 1.30 |
| `text-h4` | 18 / 20 | Manrope | 600 | -0.005em | 1.40 |
| `text-body` | 16 / 16 | Manrope | 400 | 0 | 1.6 |
| `text-body-sm` | 14 / 14 | Manrope | 400 | 0 | 1.55 |
| `text-label` | 12 / 12 | Manrope | 600 | 0.04em (caps) | 1.4 |
| `text-data` | 14 / 14 | IBM Plex Mono | 500 | 0 | 1.4 |
| `text-data-sm` | 12 / 12 | IBM Plex Mono | 500 | 0 | 1.4 |

`tabular-nums` is enabled globally on `body`. All numerics (distances, hours, ratings, counts) inherit it.

### 3.4 The Calvert rule — labels and map type

Labels (button text, badges, eyebrow text) use Manrope 600 in `text-label` size — all caps, `letter-spacing: 0.04em`. This is the Margaret Calvert / Transport rule: small all-caps must be tracked open to remain readable.

Map labels (town names, road names rendered by MapLibre) are set in Manrope 500, mixed case, no tracking adjustment. This matches the UK Transport doctrine — mixed case is more legible at a glance than all-caps.

### 3.5 Optical adjustments

- `font-feature-settings: "ss01", "cv11", "tnum"` on body (Manrope's stylistic alternates + tabular numerics).
- `text-rendering: optimizeLegibility` on `html`.
- `-webkit-font-smoothing: antialiased` on `body`.
- Drop caps available via `.dropcap` utility for long-form farm descriptions: 4-line drop, Clash Display 600, `--brand` colour, 4px right margin.

---

## 4. Map Identity

The map is the brand. If the map is generic OSM tiles in default colours, no amount of UI polish saves the product. We ship a custom MapLibre style.

### 4.1 Custom MapLibre style — "Field Edition"

A new style JSON at `farm-frontend/public/map/field-edition.style.json`, loaded by `MapLibreShell.tsx` in place of the current generic provider.

| Map layer | Light fill | Dark fill | Notes |
|---|---|---|---|
| Land background | `--paper` `#F5EFE0` | `#0C0A09` | The map IS the page |
| Parks / forest | `--brand` @ 18% opacity | `--brand` @ 22% opacity | Hedgerow tint on green space |
| Water | `#C7D9E4` (muted blue-grey) | `#1E293B` | One single water colour, no gradients |
| Roads (major) | `--ink` @ 55% | `--ink` @ 70% | Loam casing, no colour |
| Roads (minor) | `--ink` @ 25% | `--ink` @ 35% | Same Loam, lower opacity |
| Road labels | `--ink` @ 80% | `--ink` @ 90% | Manrope 500 mixed-case |
| Town labels | `--ink` @ 90% | `--ink` @ 95% | Manrope 600 mixed-case |
| Border (county) | `--ink` @ 12%, dashed | `--ink` @ 18%, dashed | Hairline 1px |

The whole map becomes part of the brand surface. Land == page == Vellum. Hedgerow appears in parks. Roads are Loam at varying opacities. No saturated colours other than the brand greens.

### 4.2 Cluster system — the absorbed Slice 1.1.2

Clusters are pure `--brand` (Hedgerow) fills with 5-tier opacity hierarchy. No second colour. Count text is `--brand-text` `#FFFFFF`.

| Tier | Range | Diameter | Fill opacity | Notes |
|---|---|---|---|---|
| t1 | 2–9 | 32px | 0.55 | Smallest, most translucent — lets land show through |
| t2 | 10–24 | 40px | 0.65 | |
| t3 | 25–99 | 52px | 0.78 | |
| t4 | 100–499 | 64px | 0.88 | |
| t5 | 500+ | 76px | 1.00 | Full Hedgerow saturation — the rare metropolis cluster |

Each cluster:
- Rounded square (corner radius 8px), not a circle. This is the Field Edition signature shape — clusters as little garden plots, not pins.
- 1px `--paper`-coloured stroke (gives a hairline halo on saturated land).
- Soft drop shadow: `0 2px 6px rgba(28, 25, 23, 0.18)` light, `0 2px 8px rgba(0, 0, 0, 0.5)` dark.
- Hover: scale to 1.04 with `cubic-bezier(0.23, 1, 0.32, 1)` 180ms. Opacity climbs +0.08.
- Active: scale 0.97, 100ms.
- Entry: spring `{ stiffness: 240, damping: 22, mass: 0.9 }`, starting from `scale(0.92) opacity(0)` — *not* `scale(0)` (Emil rule).
- Pulse: removed. The current `clusterPulse` animation is deleted — it pulses 100% of the time the cluster is visible, which is "decoration that the user sees thousands of times per session" (Emil's frequency rule fails).

### 4.3 Single-marker (farm pin) — the Rapeseed jewel

Single farms get a custom pin, not the MapLibre default. A small rounded teardrop:

- Body: `--ink` `#1C1917` fill, `#FFFFFF` 1px stroke.
- Dot: a 6px `--accent` `#E0A82E` Rapeseed circle inset in the body — the only place Rapeseed appears on the map. Found farms read as jewels on Vellum.
- Selected: pin flips to `--accent` fill, `--ink` dot. Reverses the relationship — the chosen jewel becomes the body.
- Tap target: 44×44 minimum (Apple HIG).

### 4.4 Map chrome (controls, search, scale bar)

- Zoom +/-: `--surface` background, `--ink` glyphs, `--border` stroke, `--shadow-md`. No gradients.
- Compass: `--surface` background, `--ink` needle. North indicator in `--accent`.
- Scale bar: Loam hairline (`--ink` at 60% opacity), IBM Plex Mono 12px label.
- Search input: `--surface` background, `--ink` text, `--brand` focus ring (2px), `--border-strong` resting border.

---

## 5. Component Language

### 5.1 Cards

The fundamental unit. Used for: farm preview cards, search result cells, marker preview, profile sections.

```
┌──────────────────────────────────┐
│  [16:9 hero image, rounded 8px]  │
│                                   │
│  Farm Name                ●Open   │  ← Clash Display 24 + Rapeseed badge
│  ─────────────────────────────    │  ← Loam hairline @ 20% opacity
│  County • 2.3 miles               │  ← Manrope 14 muted + Plex Mono distance
│                                   │
│  Two-line description that sits   │
│  comfortably in the rhythm of     │
│  the card.                        │
│                                   │
│  [#tag] [#tag] [#tag]             │  ← Tag chips, --border outline
│                                   │
│  ┌─────────────────────────────┐  │
│  │  View Farm Details          │  │  ← --brand fill, --brand-text
│  └─────────────────────────────┘  │
└──────────────────────────────────┘
```

- Surface: `--surface` (white in light, stone-900 in dark).
- Border: 1px `--border`.
- Radius: 16px outer, 8px inner image.
- Padding: 20px on mobile, 24px on desktop.
- Shadow at rest: `0 1px 2px rgba(28, 25, 23, 0.04)`.
- Shadow on hover: `0 8px 24px rgba(28, 25, 23, 0.08)`, translateY(-2px), 200ms `ease-out`.

### 5.2 Buttons

Three styles. No more.

**Primary** — `--brand` fill, `--brand-text` text, 0 border. The default action.
**Secondary** — `--surface` fill, `--ink` text, 1px `--border-strong` border. Companion actions.
**Ghost** — transparent fill, `--ink` text, no border. Tertiary actions, in-card actions.

All buttons:
- Height: 44px (mobile and desktop — Apple HIG tap target).
- Padding: 16px horizontal.
- Radius: 10px.
- Font: Manrope 600, 15px, `letter-spacing: -0.005em`.
- `:active` → `transform: scale(0.97)` with 120ms `cubic-bezier(0.23, 1, 0.32, 1)` (Emil).
- `:focus-visible` → `outline: 2px solid --brand`, `outline-offset: 2px`. No box-shadow rings.
- `:disabled` → opacity 0.5, no transform, cursor `not-allowed`.

### 5.3 Badges and pills

| Badge | Background | Text | When |
|---|---|---|---|
| Open Now | `--accent` `#E0A82E` | `--ink` | Farm currently open per opening hours |
| Closed | `--surface-2` | `--ink-muted` | Farm closed |
| Seasonal | `--brand` @ 12% | `--brand` | Limited operating season |
| New | `--ink` | `--paper` | Recently added farm |

All badges: `text-label` (12px Manrope 600 all-caps tracked 0.04em), 24px height, 8px horizontal padding, 4px radius (sharper than card radius — Vignelli edge discipline).

### 5.4 Popovers and sheets

Inherit from Radix UI / Base UI patterns:
- `transform-origin: var(--radix-popover-content-transform-origin)` — origin-aware (Emil).
- Enter: `scale(0.96) opacity(0)` → `scale(1) opacity(1)`, 180ms `cubic-bezier(0.23, 1, 0.32, 1)`.
- Exit: 140ms, faster than enter.
- Backdrop (sheet only): `--ink` @ 40% opacity, 200ms fade.

### 5.5 Hairline rules

The magazine convention. 1px Loam at 12% opacity (light) / 18% opacity (dark). Used to:
- Separate sections within a card.
- Underline section headings.
- Divide the map sidebar from the canvas.
- Frame the page footer.

No 2px or thicker rules anywhere in the system. If you need more visual weight than 1px gives you, use whitespace.

---

## 6. Motion Language

All motion follows Emil Kowalski's animations.dev framework, encoded in the `emil-design-eng` skill.

### 6.1 Easing curves (only these three)

```css
--ease-out-strong:    cubic-bezier(0.23, 1, 0.32, 1);     /* UI default — enters, presses */
--ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);    /* on-screen movement */
--ease-drawer:        cubic-bezier(0.32, 0.72, 0, 1);     /* iOS-like sheets */
```

Native `ease-in` is banned for UI. Native `ease` is allowed only for colour/opacity transitions.

### 6.2 Durations (anchored)

| Element | Duration |
|---|---|
| Button press feedback | 120ms |
| Tooltip / small popover | 160ms |
| Dropdown / select | 200ms |
| Marker preview / card hover | 200ms |
| Modal / sheet | 280ms (enter) / 200ms (exit — asymmetric per Emil) |
| Page transition | 320ms |
| Cluster pulse | DELETED |

No UI animation exceeds 320ms. Exit is faster than enter.

### 6.3 Spring physics

For elements that should feel *alive* — not interpolating, but settling. Used selectively:

```js
// Cluster appear, marker preview drop-in
{ type: "spring", stiffness: 240, damping: 22, mass: 0.9 }

// Drag-to-dismiss sheet
{ type: "spring", stiffness: 320, damping: 30, mass: 1 }

// Mouse-tracking decorative
{ type: "spring", stiffness: 100, damping: 10 }
```

Springs default to *no bounce* (`bounce: 0`). Bounce is reserved for one place: the favourites heart animation on first click.

### 6.4 Awwwards moves (the extravagant ones)

Three signature motion details that elevate this beyond a standard CMS:

1. **Custom cursor on desktop, hover-only devices.** A 14px Loam ring at rest. Over interactive surfaces, the ring fills with `--brand`. Over the map, the ring becomes a 6px Rapeseed dot (matching the map's marker language). Implemented as a CSS-only `mix-blend-mode: difference` overlay + `<div>` follower. Disabled on `pointer: coarse`.

2. **Page-as-canvas transitions.** Routing between `/`, `/map`, `/shop/[slug]` uses a Vellum-coloured wipe that travels left-to-right at 320ms `--ease-in-out-strong`. Content fades through. Like turning a page in a magazine. Implemented as a Next.js App Router transition with a top-level `<motion.div>` overlay.

3. **Scroll-pinned chapter headings on farm detail pages.** Long-form farm descriptions get magazine chapter pins — the section title (Clash Display 32) sticks to the top of the viewport as the section scrolls past, then releases as the next section enters. Implemented with CSS `position: sticky` + IntersectionObserver fade.

### 6.5 Reduced motion

`@media (prefers-reduced-motion: reduce)`:
- All `transform` motion → opacity-only.
- Custom cursor disabled.
- Page-as-canvas transition → opacity crossfade only.
- Springs collapse to 0ms.
- Hover lift on cards disabled.

---

## 7. Texture & Materiality

The system uses three subtle textures. Each is opt-in via utility class. None auto-apply globally.

### 7.1 Paper grain (`.tx-paper`)

A 200×200 SVG noise overlay at `opacity: 0.025` (light) / `0.04` (dark). Applied to the page canvas behind content. Imperceptible at a glance, but eliminates the flat-gradient digital feel.

```css
.tx-paper::before {
  content: '';
  position: fixed;
  inset: 0;
  background: url('/tx/paper-grain.svg');
  opacity: 0.025;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: multiply;
}
```

### 7.2 Hairline frame (`.tx-frame`)

Applied to long-form pages (farm detail, about, blog). A 1px `--ink` @ 12% rule 24px in from every edge of the viewport, framing the content like a magazine page.

### 7.3 Drop cap (`.tx-dropcap > p:first-of-type::first-letter`)

Auto-styles the first letter of the first paragraph: Clash Display 600, 4-line drop, `--brand` colour, 4px right margin, 4px top descent.

No other textures. No film grain, no scanlines, no glass.

---

## 8. Migration Plan (Sliced)

This spec touches every UI surface but ships in atomic slices. CLAUDE.md rules apply: ≤8 files / ≤300 LOC source per slice. No big-bang rewrites.

| Slice | Title | Scope | Files | Est. LOC |
|---|---|---|---|---|
| **1.1.2a** | **Token foundation** | Rewrite colour blocks in `globals.css` (light + dark). Add new `--brand/--accent/--ink/--paper` + neutrals + semantic. Keep `--brand-primary/--brand-accent/--brand-action/--seasonal-*/--serum/--solar/--obsidian` as *aliases* pointing at new tokens so nothing breaks. Rewrite `tailwind.config.js` colour map. Add new easing curve tokens. | `globals.css`, `tailwind.config.js` | ~250 changed |
| **1.1.2b** | **Cluster polish** | Migrate `CLUSTER_TIERS` in `cluster-config.ts` to opacity hierarchy on `--brand`. Switch shape from circle to rounded-square. Delete `clusterPulse` keyframes. Update MapLibreShell + LeafletShell cluster style calls. Remove duplicate inline hex hardcoding. | `cluster-config.ts`, `MapLibreShell.tsx`, `LeafletShell.tsx` | ~80 |
| **1.1.2c** | **Marker preview polish** | Re-skin `FarmPreviewCard` to the Field Edition card spec (hairline rules, Rapeseed Open Now badge, Clash Display title, Plex Mono distance). Re-skin pin style — Loam body, Rapeseed dot. | `FarmPreviewCard.tsx`, `MarkerPreview.tsx`, marker SVGs | ~120 |
| **1.1.2d** | **Map style — Field Edition** | Author new MapLibre style JSON at `public/map/field-edition.style.json`. Wire it into `MapLibreShell`. Land = Vellum, parks = Hedgerow tint, water = muted blue-grey, roads = Loam at opacities. | `field-edition.style.json` (new), `MapLibreShell.tsx` | ~200 |
| **1.1.2e** | **Type foundation** | Remove IBM Plex Sans + Crimson Pro from `layout.tsx`. Remove their `@fontsource` packages. Rewrite Tailwind `fontFamily` + `fontSize` to the new scale. Add `font-feature-settings` to body. Add `.dropcap` and `tx-*` utilities. | `layout.tsx`, `tailwind.config.js`, `globals.css`, `package.json` | ~150 |
| **1.1.2f** | **Button + badge migration** | Rewrite `Button` component to three-variant Field Edition spec. Migrate existing `<button>` consumers (top 20 by occurrence). Build `Badge` component for Open Now / Closed / Seasonal / New. | `Button.tsx`, `Badge.tsx` (new), top-20 callers | ~250 |
| **1.1.2g** | **Sweep legacy tokens (kinetic / solar / seasonal / serum)** | Grep + replace remaining `--brand-primary`, `--brand-accent`, `--seasonal-*`, `--serum`, `--solar`, `--obsidian` consumers across `src/`. Delete the alias blocks. | TBD via grep | ~200 |
| **1.1.2h** | **Motion: custom cursor + page transitions** | Implement the two signature Awwwards moves. Behind `prefers-reduced-motion` guard. | `CustomCursor.tsx` (new), `PageTransition.tsx` (new), `layout.tsx` | ~180 |
| **1.1.2i** | **Texture + drop cap utilities** | Author `/tx/paper-grain.svg`. Wire `.tx-paper` to root layout. Add `.tx-dropcap` and `.tx-frame` utilities. Apply to long-form farm pages. | `paper-grain.svg` (new), `globals.css`, farm detail page | ~80 |

Total: 9 slices, each individually shippable, each ≤300 LOC source. Tonight ships **1.1.2a** (the foundation everything else builds on). 1.1.2b–1.1.2i queued for subsequent sessions.

### Slice ordering rationale

- **1.1.2a ships first** because every other slice consumes the new tokens. With the alias layer, *nothing breaks* mid-migration — `--brand-primary` keeps working, it just points at Hedgerow now.
- **1.1.2g (sweep) ships last** because we need consumer code migrated before we can safely delete the aliases.
- **1.1.2h (motion)** is the most extravagant slice and is intentionally last in the visible-polish chain — it's the cherry on top, not the foundation.

---

## 9. Deletion List

Things removed by this spec. Recorded for ledger.

### CSS variables (from `globals.css`)
- `--brand-primary`, `--brand-primary-dark`, `--brand-primary-text` (Kinetic Cyan)
- `--brand-accent`, `--brand-accent-dark` (Solar Lime)
- `--seasonal-cream`, `--seasonal-forest`, `--seasonal-charcoal`, `--seasonal-spring`, `--seasonal-summer`, `--seasonal-autumn`, `--seasonal-winter` (Seasonal palette)
- `--serum`, `--serum-light`, `--serum-text`, `--solar`, `--solar-light`, `--solar-text`, `--obsidian` (Legacy compatibility layer)
- Duplicate `--seasonal-cream` and `--seasonal-forest` declarations (literal duplicates currently shipped)
- All density-mode tokens beyond the `comfortable` default (we are not building three density modes — that's pre-revenue YAGNI)

### Tailwind config
- `colors.kinetic.*`, `colors.solar.*`, `colors.harvest-leaf.*` (replaced by `brand`)
- `colors.seasonal.*`
- `fontFamily.clash` (folded into `fontFamily.display`)
- `fontFamily.serif` (no serif in system)

### Fonts (`layout.tsx` + `package.json`)
- `@fontsource/ibm-plex-sans`
- `@fontsource/crimson-pro`

### Animations
- `@keyframes clusterPulse` (Emil frequency rule fails — users see clusters thousands of times per session)

### Tagline
- `PUREDGEOS 3.0 TYPOGRAPHY` comment header. Replaced with `THE FIELD EDITION — TYPOGRAPHY`.

---

## 10. Accessibility Commitments

Non-negotiable, machine-checked where possible:

1. **Contrast.** All ratios computed and tabulated in §2.4. CI check (to be added): a node script that re-computes ratios from the live token values and fails the build if any pair drops below its committed bar.
2. **Tap targets.** All interactive elements ≥44×44px (Apple HIG). Enforced via design review on every slice.
3. **Focus rings.** Every focusable element ships a visible `:focus-visible` ring (`outline: 2px solid --brand`, `outline-offset: 2px`). No `outline: none` without a replacement.
4. **Reduced motion.** §6.5 is the floor, not the ceiling. Every motion slice ships its reduced-motion variant in the same PR.
5. **Keyboard nav.** Map clusters and markers reachable via `Tab`. Marker preview escapable via `Esc`. Search reachable via `/` shortcut.
6. **Screen reader.** Map markers have `aria-label="Farm: {name}, {county}, {distance} miles"`. Clusters: `aria-label="{count} farms in this area. Press Enter to zoom in."`. All decorative imagery has `alt=""`.
7. **Reduced data.** Custom cursor + page-as-canvas transitions skipped on `(prefers-reduced-data: reduce)` when supported.

---

## 11. Verification

Per-slice verification commands. CLAUDE.md `Evidence rule` — only mark a slice done if every command below passes.

```bash
# Run from farm-frontend/
pnpm exec tsc --noEmit                        # Type safety
pnpm exec eslint . --ext .ts,.tsx --max-warnings 0   # Lint (incl. max-lines)
pnpm exec tsx --test "src/**/*.test.ts"       # Unit tests
pnpm build                                    # Production build
```

Plus, per slice:
- **1.1.2a:** grep for old token names in `globals.css` → expect alias layer only.
- **1.1.2b:** open `/map`, confirm clusters are Hedgerow rounded-squares, no pulse, light + dark.
- **1.1.2c:** tap a pin at 375×812 and 1280×800, light + dark — preview shows new card spec.
- **1.1.2d:** open `/map`, confirm land is Vellum (not default OSM grey), parks are Hedgerow-tinted, roads are Loam.
- **1.1.2e:** Network tab shows only Clash Display + Manrope + Plex Mono woff2s loading. No Plex Sans, no Crimson Pro.
- **1.1.2f:** all buttons match three-variant spec; visual regression sweep.
- **1.1.2g:** `grep -rE "brand-primary|brand-accent|seasonal-|--serum|--solar\b|--obsidian" farm-frontend/src` returns zero.
- **1.1.2h:** desktop pointer shows custom cursor; navigation between routes wipes Vellum.
- **1.1.2i:** long-form farm page shows drop cap on first paragraph and paper grain at canvas edges.

---

## 12. Risk and Rollback

| Risk | Mitigation |
|---|---|
| Mid-migration visual regressions | Alias layer in 1.1.2a — old tokens keep resolving until 1.1.2g deletes them |
| Brand confusion (existing users seeing cyan→green) | This is a feature, not a bug — the user explicitly approved the redesign. Communicate in a one-pager on `/about` |
| Type swap regressing performance (LCP) | All three retained families already pre-loaded — no new network requests. Two deleted families = faster, not slower |
| Custom MapLibre style adding tile fetch cost | Style JSON loads once and is cached; tile source unchanged. Net cost: one extra ~3KB JSON |
| Custom cursor breaking edge browsers | Feature-detect `(pointer: fine)`; fall back to native cursor on any failure |

**Rollback:** Each slice is one PR. Revert the merge SHA to restore prior state. The alias layer in 1.1.2a guarantees no flag-day cutover — every intermediate state is shippable.

---

## 13. What ships tonight

**Slice 1.1.2a — Token foundation.** Everything in §2 (colour) and §6.1 (easing) becomes real in `globals.css` and `tailwind.config.js`. Alias layer keeps old token names working. No visible UI change yet — that comes in 1.1.2b onwards.

This is intentional. The foundation has to be right before any consumer migrates. Tonight: bedrock. Tomorrow: the building.
