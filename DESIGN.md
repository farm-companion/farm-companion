---
name: Farm Companion
description: UK farm shop directory, set like a 1962 Italian railway poster.
colors:
  vermilion: "#D33A2C"
  sea-ink: "#1F3A5F"
  loam-ink: "#0F0E0C"
  cream-paper: "#F2EBDA"
  surface-white: "#FFFFFF"
  surface-raised: "#FAFAF9"
  ink-muted: "#57534E"
  ink-subtle: "#78716C"
  border-hairline: "#E7E5E4"
  destructive: "#B91C1C"
typography:
  display:
    fontFamily: "Clash Display, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Clash Display, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3.5vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(0.875rem, 1.5vw, 1rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans Condensed, system-ui, sans-serif"
    fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.04em"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "12px"
  lg: "16px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  section: "128px"
components:
  button-primary:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.surface-white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "#B82E22"
    textColor: "{colors.surface-white}"
  button-secondary:
    backgroundColor: "{colors.sea-ink}"
    textColor: "{colors.surface-white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  badge-open:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.surface-white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.loam-ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.loam-ink}"
    rounded: "{rounded.md}"
    height: "44px"
---

# Design System: Farm Companion

## 1. Overview

**Creative North Star: "Pitti Press, the 1962 Italian Railway Poster"**

Farm Companion is a UK farm shop directory designed as if Massimo Vignelli set it for a 1962 Italian railway-poster series. Confident slab typography, four flat colours laid down like ink ribbons, no gradients, a printed-map cartography. The product reads as a designed object, something a person screenshots and pins to a moodboard, not "another directory." The reference canon is explicit: Cassandre's Nord Express posters, Vignelli's NYC Subway map and Knoll work, Italo Calvino's Einaudi covers, Pitti Uomo trade-fair signage, Otl Aicher's Munich 1972 pictograms, and Dieter Rams' principle of deleting more than you add.

Vibrancy comes from one source, Vermilion, used like an editor's red pencil. Freshness comes from editorial restraint on warm Cream paper, not from clutter or novelty. Seasonality is real to this product, but it lives in the content and in the linocut imagery (the hero crop changes with the season), never in the chrome. The palette never shifts green or honey to signal "harvest." That move was tried in the prior Field Edition and rejected in review as artisanal-twee rather than aspirational. The `/best` top-picks pages are the canonical reference surface: when in doubt about how Pitti Press should feel on a new screen, match `/best`.

This system explicitly rejects four looks, carried verbatim from PRODUCT.md: the generic SaaS dashboard (cards everywhere, the big-number hero-metric template, corporate navy-and-teal); the cluttered Yelp or aggregator directory; the twee rustic-farm cliche (chalkboard scripts, kraft-paper and barnwood, a green-and-honey harvest re-theme); and cold sterile minimalism (gray-on-white, clinical, no personality).

**Key Characteristics:**
- Four flat colours, no gradients. Depth is a hairline rule, never a soft shadow.
- One Vermilion stamp per screen, under 8% coverage. Rarity is the point.
- Type carries hierarchy. Weight, size, and tracking do the work chrome does elsewhere.
- The map is a printed map: cream land, sea-ink water, hairline Loam roads, one red pin.
- Imagery is a single linocut style across every surface. The style is the brand.

## 2. Colors

A four-colour ink-ribbon palette: warm near-black on aged cream, with one warm chromatic stamp and one cool ink accent.

### Primary
- **Vermilion** (`#D33A2C` light, `#FF6B5B` dark): The Cassandre / Vignelli statement red and the only warm chromatic on the page. Fill only: primary CTA, the single map pin, the "Open Now" badge, a hero anchor word. At `#D33A2C` it hits 4.7:1 on Cream, AA-large, enough for buttons and stamps but never body text.

### Secondary
- **Sea Ink** (`#1F3A5F` light, `#6FA0D9` dark): The desaturated denim of an Italian-poster ocean, cooler than royal blue and warmer than navy. Used for links, info and secondary actions, and for water on the map. 9.4:1 on Cream, AAA.

### Neutral
- **Loam Ink** (`#0F0E0C` light, `#F4F1EA` dark): Warm near-black with a hint of olive, not pure black, so it reads as letterpress ink on aged paper. Body text, primary chrome, map roads, headlines. 16.8:1 on Cream, AAA.
- **Cream Paper** (`#F2EBDA` light, `#15120D` dark): The page canvas and the map's land. Printer's aged stock, more yellow than pink. In dark mode it becomes a warm dark brown, not OLED black: "the warehouse lights are off and you read the printed page by table-lamp."
- **Surface White** (`#FFFFFF`) and **Surface Raised** (`#FAFAF9`, Stone-50): Cards lift above the Cream page; raised surfaces (modals, popovers) lift again.
- **Ink Muted** (`#57534E`, Stone-600) and **Ink Subtle** (`#78716C`, Stone-500): Secondary and placeholder text.
- **Border Hairline** (`#E7E5E4`, Stone-200): The warm Stone hairline that replaces shadows for separation.
- **Destructive** (`#B91C1C`): The single literal red exception reserved for genuinely destructive actions.

### Named Rules
**The One Vermilion Stamp Rule.** Vermilion covers under 8% of any screen. One stamp: a primary CTA, or the map pin, or an "Open Now" badge, or a hero anchor word. If two things both want to be Vermilion, one of them is wrong.

**The No-Gradient Rule.** Four flat colours. No gradients, no 3-stop blends, no glass. If a surface needs depth it gets a hairline rule, not a shadow.

**The Seasonal-Is-Content Rule.** Season changes the imagery and the produce content, never the palette. Never re-theme the chrome green or honey for "harvest." That is the twee trap this system was built to escape.

**The Two-Chromatic Rule.** Feedback states collapse to two hues, not four. Vermilion carries attention, warning, and error. Sea Ink carries info and success (success reads as calm confirmation, not celebration).

## 3. Typography

**Display Font:** Clash Display (with system-ui fallback)
**Body Font:** Manrope (with system-ui fallback)
**Label Font:** IBM Plex Sans Condensed (with system-ui fallback)
**Mono Font:** IBM Plex Mono (numbers, coordinates, distances)

**Character:** Architectural display weight over a clean geometric body, with tight condensed uppercase for functional labels. The pairing reads as confident editorial signage, not as a SaaS UI kit. (Direction note: the Pitti Press spec queues a move to GT Cinetype or Söhne Schmal for display and Tiempos Text for body in Slice 1.1.2e; until that ships, Clash Display and Manrope are the live stack and the source of truth.)

### Hierarchy
- **Display** (Clash Display 600, `clamp(1.75rem, 4vw, 2.5rem)`, line-height 1.15, tracking -0.02em): Page-level headlines and hero anchor lines.
- **Headline** (Clash Display 600, `clamp(1.5rem, 3.5vw, 2rem)`, line-height 1.15): Section headings.
- **Title** (Clash Display 600, `clamp(1.25rem, 3vw, 1.5rem)`): Card and block titles.
- **Body** (Manrope 400, `clamp(0.875rem, 1.5vw, 1rem)`, line-height 1.6): Running text. Cap line length at 65 to 75 characters.
- **Label** (IBM Plex Sans Condensed 600, `clamp(0.75rem, 1.5vw, 0.875rem)`, uppercase, tracking 0.04em): Buttons, filters, eyebrows, badges. Reserve uppercase for these short labels only.
- **Mono** (IBM Plex Mono 400, `0.75rem`): Coordinates, distances, and sequence numerals. Mono in cream and ink reads as a printer's measurement.

### Named Rules
**The Type-Does-The-Work Rule.** Hierarchy comes from weight, size, and tracking, not from boxes, shadows, or coloured chrome. If a heading needs a background panel to stand out, the type is too timid.

**The Uppercase-Labels-Only Rule.** ALL CAPS is for short labels (4 words or fewer), eyebrows, and badges. Never set sentences or body copy in uppercase.

## 4. Elevation

Flat by default. The system conveys depth with hairline Stone rules and tonal layering (Cream page, White card, Raised surface), not with heavy shadows. Light mode keeps a restrained Apple-style shadow scale (`--shadow-xs` through `--shadow-xl`) for genuinely floating elements like the map preview card and bottom sheets, but a hairline is always the first choice. Dark mode disables shadows entirely (`--shadow-strength: 0`): elevation is expressed by luminance (lighter surface equals higher) and by a one-pixel specular top-edge gradient that simulates an overhead light.

### Shadow Vocabulary (light mode, use sparingly)
- **Resting surface** (no shadow, `1px` Stone hairline border): The default for cards and panels.
- **Floating** (`box-shadow: 0 4px 20px rgba(0,0,0,0.12)`): Map preview cards, bottom sheets, things that genuinely hover over the map.
- **Modal** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1)`): Dialogs and the marker action sheet.

### Named Rules
**The Hairline-Not-Shadow Rule.** Reach for a `1px` Stone-200 hairline before reaching for a shadow. Shadows are reserved for elements that literally float above the map.

**The Border-Luminance Rule (dark mode).** In dark mode there are no shadows. Separation comes from `rgba(255,255,255,0.08)` borders and a faint top-edge highlight. Do not add dark-mode shadows.

## 5. Components

### Buttons
- **Shape:** Gently rounded (12px, `--radius`). Label type is IBM Plex Sans Condensed, uppercase, tracking 0.04em.
- **Primary:** Vermilion fill (`#D33A2C`), white label, padding `12px 24px`. This is the screen's one stamp; there is rarely more than one primary button in view.
- **Secondary:** Sea Ink (`#1F3A5F`) fill or stroke, white label. For the second action when one is needed.
- **Hover / Focus:** Background shifts to `#B82E22` on hover with `transition` on the `--ease-out-strong` curve (`cubic-bezier(0.23, 1, 0.32, 1)`). Focus shows a visible Vermilion ring (`--ring`), 2px, with offset.

### Chips and Badges
- **Open Now badge:** Vermilion fill, white uppercase label, 4px radius, padding `2px 8px`. The status stamp.
- **Status:** Open uses Sea Ink or green-600 paired with white; Closed uses the destructive red; Unknown uses Stone. Each background carries a pre-verified 4.5:1 text colour (see the map marker semantic pairs in `harvest-theme.css`).

### Cards / Containers
- **Corner Style:** 12px radius (`--radius`).
- **Background:** White (`--surface`) on the Cream page; Raised (`--surface-2`) for popovers and modals.
- **Shadow Strategy:** Flat by default with a Stone-200 hairline border. Floating shadow only when the card hovers over the map. See Elevation.
- **Internal Padding:** Density-driven: 40px comfortable (marketing), 24px compact (dashboards), 16px dense (admin).

### Inputs / Fields
- **Style:** White background, Stone-200 (`--input`) hairline border, 12px radius, minimum height 44px.
- **Focus:** Border shifts to brand and a 2px Vermilion ring appears with 2px offset. Inputs keep at least 16px font size to prevent iOS zoom.
- **Placeholder:** Ink Subtle (`#78716C`), which still must clear 4.5:1.

### Navigation
- **Style:** 64px header (`--header-h`), type-led, Cream or White surface with a single Stone hairline beneath. Active item carries `aria-current="page"` and a Loam-ink weight shift, not a coloured pill.
- **Mobile:** A floating, glass-free search bar over the map; the map bottom sheet uses the `--ease-drawer` curve.

### Signature Components
- **The Printed Map:** Cream land, Sea Ink water at 0.18 fill, parks as a faint Loam tint at 0.06 (never green), Loam roads at 0.45 / 0.30 / 0.18 line weights, labels in Loam with a Cream halo. A single Vermilion pin is the only chromatic moment; clusters use Vermilion with an opacity ladder.
- **Ribbon Section Divider:** A Vermilion ribbon between major sections that visibly wraps off-screen on one side, suggesting an Italian-poster die-cut. Pure CSS, pure decoration.
- **Sequence Numerals:** Sections numbered `01`, `02` in mono small caps inside a Loam-ink stamp box on Cream, signalling that the page is composed, not auto-generated.

## 6. Do's and Don'ts

### Do:
- **Do** treat Vermilion as a rare stamp, under 8% of any screen. One stamp per view.
- **Do** convey depth with a 1px Stone-200 hairline first; reserve shadows for elements floating over the map.
- **Do** let type weight, size, and tracking carry hierarchy.
- **Do** keep the map a printed map: Cream land, Sea-Ink water, Loam roads, no green parks, one red pin.
- **Do** express season through imagery and produce content (the linocut hero changes with the season), not through the palette.
- **Do** use literal hex for load-bearing colour fills that take an opacity. Production breaks `oklch`/`var()`-with-opacity in some fills; literal hex is the documented fix (see the design git history).
- **Do** generate all product imagery in the single Runware linocut style, seeded by `hash(slug + version)` for determinism.
- **Do** give every animation a `prefers-reduced-motion` alternative and keep interactions operable by keyboard with a visible Vermilion focus ring.

### Don't:
- **Don't** build a generic SaaS dashboard: cards everywhere, the big-number hero-metric template, identical icon-heading-text grids, corporate navy-and-teal.
- **Don't** make it a cluttered Yelp or aggregator directory: dense ad-heavy listings, banner clutter, a low-trust scraped feel.
- **Don't** go twee rustic-farm: chalkboard scripts, kraft-paper or barnwood textures, folksy badges, or a green-and-honey harvest re-theme. This is the exact look Pitti Press replaced.
- **Don't** go cold sterile minimal: gray-on-white, clinical, no personality.
- **Don't** use gradients, glass or blur effects, Lottie animations, 3D illustrations, hero video backgrounds, custom cursors, scroll-driven typography, or page transitions longer than 200ms.
- **Don't** set Vermilion as body text on Cream; it only clears AA-large, so it is for fills and single display characters.
- **Don't** use stock photography or commissioned illustration. The single linocut style is the brand.
- **Don't** add a second chromatic for success or info; Sea Ink carries both. Don't invent a separate error hue; Vermilion is the error red.
