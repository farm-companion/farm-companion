# Homepage Redesign — Pitti Press, All-Light, Awwwards-tier

**Status:** Active. Branch `feat/homepage-pitti-press-redesign` (flagged, off master).
**Trigger:** homepage reads as 3 sites stitched together — dark/light ping-pong, ~5 heroes, 6 card languages, "NO IMAGE" placeholders, rogue palette, mixed type.
**Method:** ecc:council (direction) + ecc:frontend-design-direction + emil-design-eng. Root finding: the canonical **Pitti Press** token system already exists and is excellent; the failure is components bypassing it. This is enforcement + polish, not invention.

## Locked decisions (user, 2026-05-26)
1. **All-light. Zero dark mode.** Cream paper everywhere, including the hero. No `.dark` usage on the homepage. (Kills the ping-pong outright.)
2. **Type: distinctive, not vanilla** (awwwards-grade). Use the self-hosted **Clash Display** for display/headlines + **Manrope** for body + **IBM Plex Sans** for UI labels + **IBM Plex Mono** for data/metrics. Purge the rogue serif and the stale Satoshi/Inter tokens.
3. **Execution:** isolated branch + feature flag (`NEXT_PUBLIC_HOMEPAGE_REDESIGN`), top-down, screenshot-verified per section, nothing merged until the whole homepage is converted, then user review.

## The design law (Pitti Press, enforced)
- **Canvas:** `--paper` Cream `#F2EBDA`; **ink** `--foreground` Loam `#0F0E0C`; cards `--surface` `#FFFFFF`. Consume tokens via Tailwind utilities; never hardcode `#fff`/slate.
- **Accents (only):** `--brand` Vermilion `#D33A2C` (primary actions), `--accent` Sea-ink `#1F3A5F` (secondary). `--destructive` red reserved. **Banned:** coral, salmon, teal `#00C2B2`, lime `#D4FF4F`, olive gradients.
- **Type scale (Clash Display):** display 1 `clamp(2.5rem,6vw,5rem)`; section title `clamp(2rem,4vw,3.25rem)`; all display weight 500–600, tight leading (1.05), optical tracking `-0.02em`. Body Manrope 1rem/1.6. One H1 per page (the hero).
- **Heroes:** exactly **one** (`AnimatedHero`). Every other former "hero" becomes a standard editorial section (kicker + title + content), no full-bleed photo background competing for H1.
- **Two card components only:**
  - `MediaCard` — image (Pitti/Apothecary resolver) + title + meta + one action. Used by NearbyFarms, FeaturedGuides, SeasonalShowcase.
  - `ListRow` — thumbnail (resolver) + title + sub + link. Used by WeekendPlanner, SocialProof.
  - No cards inside cards (frontend-direction anti-pattern).
- **Empty state:** every farm media slot calls the existing hero-image resolver (`pittiFarmImageUrl` / Apothecary). **"NO IMAGE" text is banned at the component level.**
- **Motion:** `--motion` gentleSpring `cubic-bezier(0.2,0.8,0.2,1)`, durations 150–400ms, on hover/enter only; respect `prefers-reduced-motion`. No decorative leaf storms competing with content.
- **Awwwards polish (non-vanilla):** confident oversized Clash Display, generous whitespace on Cream, editorial asymmetric grids, Vermilion as a sparing punctuation accent, Pitti/Apothecary illustrations as the imagery (they sing on Cream), hairline Stone borders, high-signal micro-interactions. Avoid the generic-AI tells (purple gradients, blobs, vague hero copy, card-in-card).

## Per-section conversion (top-down order, one commit each, screenshot-verified)
| # | Component | Current problem | Target |
|---|---|---|---|
| 0 | globals + tailwind + fonts | 3 token generations; serif leak; stale teal/lime | Map Tailwind to Pitti Press vars; force light; Clash/Manrope; retire `design-tokens.json` teal/lime |
| 1 | `AnimatedHero` | dark full-bleed | the ONE hero, light Cream, Clash Display, Vermilion CTA, Pitti art |
| 2 | `SocialProofTicker` | tone | quiet Cream ticker, ink text |
| 3 | `AnimatedStats` | dark slab | Cream, Mono numerals, Sea-ink labels |
| 4 | `SeasonalShowcase` | white-box artifact over produce image | MediaCard, fix image, Cream |
| 5 | `FeaturedGuides` | dark photo hero #2 | editorial section, MediaCard trio, Cream |
| 6 | `CategoryGrid` | pure-white (off-canvas) | Cream `--paper`, CategoryIcon, hairline tiles |
| 7 | `NearbyFarms` | dark + colored-header cards | MediaCard with resolver imagery, Cream |
| 8 | `WeekendPlanner` | **"NO IMAGE"**, light slab | ListRow + resolver imagery, Cream |
| 9 | `AnimatedFeatures` | dark photo hero #3 | editorial 3-up, Cream |
| 10 | inline "How It Works" + footer | white, off-canvas | Cream, consistent footer |

## Migration discipline (council — Critic)
- One branch. New homepage composition gated behind `NEXT_PUBLIC_HOMEPAGE_REDESIGN`; live `/` unaffected until flip.
- Shared components (CategoryGrid, FarmCard, MediaCard) restyled toward all-light Pitti Press are correct site-wide.
- Screenshot every converted section (Playwright) before the next. Never merge a half-converted page to a public URL.
- After full conversion: user review → flip flag → merge → then propagate the same law to the rest of the site.

## Verification per section
`pnpm exec tsc --noEmit` clean · eslint clean · Playwright screenshot at 1440 + 390 widths · no `.dark`/hardcoded hex on the homepage · contrast AA.
