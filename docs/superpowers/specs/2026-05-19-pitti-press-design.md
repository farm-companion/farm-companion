# Pitti Press — Design Spec

> Status: **CANONICAL.** Supersedes `2026-05-19-the-field-edition-design.md` (Hedgerow / Rapeseed / Vellum harvest palette).
>
> Last updated: 2026-05-19. Author: FlowCoder. Slice family: `1.1.2*`.

---

## §1 Reference and intent

Pitti Press is a UK farm directory designed as if Massimo Vignelli set it for a 1962 Italian railway-poster series. Confident slab typography, four flat colours laid down like ink ribbons, no gradients, printed-map cartography. The product reads as a designed *object* — something a person would screenshot and pin to a moodboard, not "another directory."

### 1.1 Reference canon

| Reference | What we steal |
| --- | --- |
| **A.M. Cassandre** — Nord Express, Étoile du Nord (1927–32) | Geometric slab typography used at full confidence. Two-or-three flat colours, no soft transitions. |
| **Massimo Vignelli** — NYC Subway map (1972), American Airlines, Knoll posters | Grid discipline. Vermilion as a statement. The "design is one, design is forever" doctrine. |
| **Italo Calvino book covers** (Einaudi, late-Bompiani) | Single-image-on-paper composition. Hairline rules. Typographic restraint with one chromatic moment. |
| **Pitti Uomo trade-fair signage** (Florence, Fortezza da Basso) | Ribbon section dividers, sequence numerals, large typographic year/edition stamps. |
| **Otl Aicher** — Munich 1972 Olympics | Pictogram clarity. Hairline grids made architectural. |
| **Dieter Rams — 10 Principles** | Delete more than we add. Non-negotiable. |

### 1.2 Operating principles

1. **Four flat colours.** No gradients. No 3-stop blends. If a surface needs depth it gets a hairline rule, not a shadow.
2. **One vermilion stamp per screen.** Vermilion is *rare* — like an editor's red pencil. Expected coverage <8% of any given screen. Used for: primary CTA, single-marker pin on the map, "Open Now" badge, hero anchor word.
3. **The map is a printed map, not a satellite photo.** Cream land, sea-ink water, hairline Loam roads. Looks lithographed.
4. **Type does the work that chrome would do in a typical SaaS site.** No big shadows, no fancy borders — type weight, size, and tracking carry hierarchy.
5. **All product imagery is Runware-generated.** No stock photography. No commissioned illustration. The same linocut style for every farm header, every county vignette, every seasonal crop. The style itself becomes the brand.
6. **Mechanics earn their place.** One signature interaction (ribbon section dividers); the rest is invisible.

---

## §2 Colour system

### 2.1 The four colours

| Name | Token | Light hex | Dark hex | Tailwind peg | Used for |
| --- | --- | --- | --- | --- | --- |
| **Loam ink** (primary text) | `--ink` | `#0F0E0C` | `#F4F1EA` | Custom warm near-black / warm near-white | Body text, primary chrome, map roads, headlines |
| **Cream paper** (page canvas) | `--paper` | `#F2EBDA` | `#15120D` | Custom aged-cream / warm near-black | Page canvas, map land, modal backdrops |
| **Vermilion** (anchor / stamp) | `--brand` | `#D33A2C` | `#FF6B5B` | Custom Cassandre red / salmon-vermilion | Primary CTA fill, hero anchor word, single-marker pin, "Open Now" badge |
| **Sea ink** (info accent) | `--accent` | `#1F3A5F` | `#6FA0D9` | Custom denim ink / sky denim | Map water, info badges, link colour, secondary CTA stroke |

**Vermilion** is the Cassandre / Vignelli statement red. It is the only warm chromatic on the page. Never used for body text on Cream (fails AA for normal text). Always used as a fill or a single large display character.

**Sea ink** is the Italian-poster blue — the colour of the Mediterranean on a Cassandre Nord Express poster. Cooler than royal blue, warmer than navy. Used for water on the map and for info-class affordances (links, secondary actions).

**Loam ink** is a warm near-black with a hint of olive — not pure `#000`. Pure black on cream paper looks synthetic. Loam reads as letterpress ink on aged paper.

**Cream paper** is more yellow than the previous Vellum was, less pink. It reads as printer's aged stock rather than as cream-coloured baking paper.

### 2.2 Dark mode

Dark mode is "the warehouse lights are off and you're reading the printed page by table-lamp." Paper goes to a warm dark brown (`#15120D`), not pure black. Ink goes to a warm cream-white (`#F4F1EA`). Vermilion and Sea ink saturate up slightly so they hold under low ambient luminance.

### 2.3 Contrast table (WCAG)

Light mode (Cream paper `#F2EBDA`):

| Foreground | On `--paper` | Ratio | Verdict |
| --- | --- | --- | --- |
| `--ink` `#0F0E0C` | Cream `#F2EBDA` | 16.8:1 | AAA |
| `--brand` `#D33A2C` | Cream `#F2EBDA` | 4.7:1 | AA-large only — fill, not body text |
| `--accent` `#1F3A5F` | Cream `#F2EBDA` | 9.4:1 | AAA |
| `#FFFFFF` | `--brand` `#D33A2C` | 4.5:1 | AA — usable as button label |

### 2.4 Semantic mapping

| Semantic | Resolves to | Why |
| --- | --- | --- |
| `--success` | `--accent` (Sea ink) | Success reads as confirmation, not celebration. Blue is calmer than red. |
| `--warning` | `--brand` (Vermilion) | Vermilion already is the attention colour. |
| `--info` | `--accent` (Sea ink) | Info pills are typographic, not chromatic. |
| `--error` | `--brand` (Vermilion) | Errors get the editor's-pencil red. No separate error hue. |

This collapses Field Edition's four-state colour table to two (vermilion = attention/error, sea ink = info/success). One fewer chromatic dimension, one more thing reads "designed."

---

## §3 Typography

Deferred to **Slice 1.1.2e — Type foundation.** Direction:

| Role | Family | Why |
| --- | --- | --- |
| Display headlines (≥36px) | **GT Cinetype** or **Söhne Schmal** — slab-stencil or condensed sans | Cassandre / Vignelli reads as architectural typography. |
| Body | **Tiempos Text** (or **Inter** as a free fallback) | Editorial serif body sets the printed-page tone. |
| Numbers / coordinates / distances | **IBM Plex Mono** (already bundled) | Mono in cream/ink reads as printer's coordinates. |
| Section labels / small caps | **Söhne Mono** small caps, tracked +0.08em | Italian-poster sequence numerals. |

Until 1.1.2e ships, headlines render with the system stack — fine, just unstamped.

---

## §4 Map cartography

The map is the centrepiece of the product. It must read as a *printed* map, not a satellite photo and not a Google Maps clone.

| Map element | Colour | Note |
| --- | --- | --- |
| Land (background) | `--paper` | Cream — same as page paper. Map sits on the page, not in a window. |
| Water (polygons + rivers) | `--accent` at 0.18 fill | Muted, not bright. |
| Parks / woods / forest | `--ink` at 0.06 fill | A faint warm tint — like a halftone screen — not green. |
| Roads (motorway) | `--ink` at 0.45 line | Loam ink at letterpress weight. |
| Roads (primary) | `--ink` at 0.30 line | |
| Roads (secondary / residential) | `--ink` at 0.18 line | |
| Buildings | `--ink` at 0.08 fill | Very subtle warm shade. |
| Labels | `--ink` text + `--paper` halo | Halo provides legibility against parks and water. |
| Single-farm marker | `--brand` (Vermilion) | The map's only chromatic moment. Rare → memorable. |
| Cluster markers | `--brand` (Vermilion) + opacity ladder | Slice 1.1.2b cluster work continues to apply — `--brand` now resolves to Vermilion not Hedgerow. |

Implementation: runtime theming pass over Stadia Maps' Alidade Smooth style (Slice **1.1.2d-α**, next). Standalone style.json deferred to **1.1.2d-β**.

---

## §5 Mechanics

### 5.1 Ribbon section dividers (signature)

Between major page sections, a `--brand`-coloured ribbon. Not a full bar — a *ribbon* that visibly wraps off-screen on one side, suggesting an Italian-poster die-cut. Pure CSS. Pure decoration. Slice **1.1.2h**.

### 5.2 Sequence numerals

Sections are numbered (`01`, `02`, …) in Söhne Mono small caps. Each section's number is set in a Loam-ink stamp box on Cream. The numerals are persistent — they show that the page is composed, not auto-generated.

### 5.3 What we explicitly do NOT add

- Custom cursors.
- Page-transition animations longer than 200 ms.
- Scroll-driven typography.
- Gradient buttons.
- Glass / blur effects.
- Lottie animations.
- 3D illustrations.
- Hero video backgrounds.

Pitti Press deletes more than it adds.

---

## §6 Imagery pipeline (Runware)

All product imagery is generated via the [Runware](https://runware.ai/) image-generation API. No stock photography. No commissioned illustration. The same linocut style across every hero, every county vignette, every farm header, every seasonal crop — the style itself is the brand.

### 6.1 Model selection

| Use case | Runware model | Reasoning |
| --- | --- | --- |
| Hero / homepage / county vignettes (high-stakes, low-volume) | **FLUX.1 [dev]** — model id `runware:101@1` | Best prompt adherence + style coherence. ~30s per 1024×1024 generation. ~$0.0015 per image. Worth the latency for one-off masterpiece-tier renders. |
| Farm shop headers (high-volume, 1,299 farms) | **FLUX.1 [schnell]** — model id `runware:100@1` | 4-step generation; ~5s per image; cheaper. Quality dip vs `[dev]` is invisible at the linocut style we target. |
| Seasonal crop stamps (single-colour, ~30 images) | **FLUX.1 [dev]** with style LoRA | One-time generation; quality matters because they're reused across every seasonal page. |

Both Runware FLUX endpoints are stateless — we pass prompt, negative prompt, seed, dimensions, and any LoRAs. The API returns a CDN URL (TTL-bounded) which we download immediately and store in our own `public/images/` tree.

### 6.2 Style LoRAs

The flat-colour-ribbon linocut look is reinforced by LoRA stacking. Candidate LoRAs to evaluate during Slice 1.1.2k:

- `civitai:linocut-print-style` — gives the woodcut grain we want.
- `civitai:risograph-print` — punchier, single-pass print, more vermilion-saturated.
- `civitai:vintage-travel-poster` — closer to Cassandre / Vignelli architectural lithography.

We pick **one** during 1.1.2k. Style consistency across 1,300 images depends on *not* swapping LoRAs once the catalogue is generated.

### 6.3 Prompt templates

Templated, not hand-written per image, so every artefact comes off the same press.

```
HERO        vintage italian travel poster, UK countryside in {SEASON},
            rolling hills with stone walls, a single red tractor in
            the middle distance, Cassandre lithograph style, four
            flat colors only, no gradients, vermilion and sea-ink-
            blue on cream paper

COUNTY      vintage linocut illustration of {COUNTY_NAME} landscape,
            {COUNTY_KEY_FEATURE: rolling hills | cliffs | fells |
            heathland | moors}, italian railway poster style, two-
            color print, vermilion and sea-ink on cream paper, flat
            colors, no gradients

FARM HEAD   linocut illustration of a UK farm shop in {COUNTY}, the
            shop sells {TOP_3_OFFERINGS}, italian railway poster
            style, two-color print, vermilion and sea-ink on cream
            paper, flat colors, no photography

SEASONAL    linocut stamp of {CROP_NAME}, single-color woodcut,
            vermilion on cream paper, no gradients, vintage
            botanical print, italian poster style
```

Universal negative prompt:

```
photograph, photorealistic, 3d render, glossy, smooth gradient,
multiple colors beyond palette, text, watermark, signature,
modern digital illustration, vector art, clipart
```

### 6.4 Determinism and caching

- **Seed = `hash(slug + version)`** so the same farm renders the same image across deploys. The `version` integer is bumped only when we deliberately want a regeneration sweep.
- **One-time batch generation per release** via `scripts/generate-images.mjs`. Idempotent — only generates missing slugs.
- **Storage:** WebP at `public/images/{type}/{slug}.webp`. Linocut style compresses extraordinarily well — most outputs land at 20–60 KB.
- **Build behaviour:** generation is *not* on the Vercel build path. Generation is a developer-run script; results are committed.
- **Cost ceiling:** a full sweep of 1,300 farm headers + 85 counties + 30 seasonal crops + 8 hero variants = ~1,423 images. At FLUX [schnell] for the long tail (`$0.0008` per 768×1024), total cost ≈ **$1.20 per full regeneration**.

### 6.5 API key handling

`RUNWARE_API_KEY` is stored in `.env.local` (gitignored) and Vercel project env vars. The generation script reads it via `process.env.RUNWARE_API_KEY` and refuses to run if unset. Never bundled into client code — generation runs in Node, not the browser.

### 6.5a Existing infrastructure (Slice 1.1.2k-α addition)

A complete Runware integration was already present before this slice. It targets the *harvest* (Field Edition) photorealistic aesthetic — the direction Pitti Press supersedes. Pitti Press extends rather than replaces this infrastructure:

| File | Role | Pitti Press change |
| --- | --- | --- |
| `farm-frontend/src/lib/runware-client.ts` | Shared `RunwareClient` class, `HARVEST_STYLE`, `buildHarvestPrompt` | Slice 1.1.2k-α adds `RUNWARE_MODELS` (FLUX.1 dev/schnell ids), `PITTI_STYLE`, `buildPittiPrompt`. Adds optional `model` and `scheduler` fields to `RunwareImageRequest` so callers can opt out of the default Juggernaut Pro Flux. Legacy `HARVEST_STYLE` and `buildHarvestPrompt` are unchanged — kept for the retirement slice (1.1.2k-ζ). |
| `farm-frontend/src/scripts/generate-farm-images.ts` | Batch farm-header generation (~1,299 farms) | Still produces harvest photo style. Slice 1.1.2k-δ swaps prompt builder to `buildPittiPrompt` + FLUX.1 [schnell]. |
| `farm-frontend/src/scripts/generate-county-images.ts` | Batch county vignette generation (~85 counties) | Slice 1.1.2k-γ swaps prompt builder to `buildPittiPrompt` + FLUX.1 [dev]. |
| `farm-frontend/src/scripts/generate-produce-images.ts` | Batch seasonal/produce stamps (~30 crops) | Slice 1.1.2k-γ swap. |
| `farm-frontend/src/scripts/generate-pitti-image.ts` *(NEW)* | Single-image validation CLI for style iteration | Built in Slice 1.1.2k-α. Operator-driven. Saves to `public/images/pitti/`. |
| `farm-frontend/scripts/generate-farm-images-direct.ts` | Older direct-URL variant of the farm-batch generator | Stale — direction-mismatched + duplicated by the `src/scripts/` version. Queued for deletion in Slice 1.1.2k-ζ. |

The validation CLI exists because the batch generators have side effects (Prisma writes, blob uploads, ~30-minute runs). Iterating on prompts in a batch script wastes API spend. The single-image CLI lets the operator dial in a prompt + LoRA combo locally before committing to a 1,400-image regeneration.

### 6.5b Already-generated harvest imagery

If the harvest batch generators have been run in the past, photorealistic farm/county/produce imagery already exists in the production deployment (Vercel Blob, Hetzner S3, or `public/images/`). Slice 1.1.2k-α does **not** delete or invalidate it — the existing imagery remains until the batch generators are retooled and re-run (Slice 1.1.2k-γ/δ). During the transition the site shows a mix: Pitti Press chrome (palette, clusters, preview card from Slice 1.1.2a–d) over harvest-style imagery. Visually inconsistent but functional; the rollout converges as batches complete.

### 6.6 Operational decisions

- **Do not stream images at request time.** Latency would kill the printed-paper aesthetic. Always pre-generate.
- **Do not allow user-submitted prompts.** The brand is the style; we don't put per-farm prompt control in any operator hand.
- **Regenerate on style change, not on data change.** When `OFFERINGS` shifts on a farm, we keep the existing image. Re-generation costs are trivial but cumulative deployment noise is not.

---

## §7 Decision log

- **Why pivot from Field Edition.** "Awaits You" green text on a green-tomato photo was unreadable in screenshot review. The Hedgerow-and-Rapeseed harvest palette read as *artisanal-twee*, not *aspirational*. The user asked for "a site people aspire to copy" and rejected "stupid harvest time theme."
- **Why Vermilion not Tomato / Rust / Oxblood.** Vermilion is the specific Cassandre / Vignelli red — has a clear historical pedigree, instantly readable as "designed," and at `#D33A2C` it hits AA-large on Cream which is enough for buttons and stamps. Tomato is too cheerful; Rust is too earthy; Oxblood is too sombre.
- **Why Sea ink not navy / cobalt / cerulean.** `#1F3A5F` is the desaturated denim of an Italian poster ocean. Navy is too SaaS; cobalt is too tech; cerulean is too maritime-cliché.
- **Why all imagery via Runware (not stock, not commission).** Stock photography commits the site to a generic look — exactly the trap the redesign exists to escape. Illustrator commission would deliver consistency but at ~£50–£200 per image × 1,400 images = uneconomic. Generative imagery via Runware delivers a single-style 1,400-image set for ~£1 of API cost, regenerable on demand. The *style* of the imagery is what makes the brand recognisable; we'd rather own the style template than the individual frames.
- **Why FLUX.1 over SDXL.** FLUX (Black Forest Labs) is the current open-weights state of the art for style coherence and prompt adherence. SDXL is older and reads as obviously "AI-generated" at default settings; FLUX with a linocut LoRA reads as linocut.
- **Why we kept the alias layer doctrine from Field Edition.** Slice 1.1.2a's alias layer was the single best decision of the previous direction. It made *this* pivot a 30-LOC change in CSS. Keep doing this.
- **Why a fresh spec doc rather than editing the Field Edition one.** Provenance. Mark Field Edition superseded; keep it for posterity.

---

## §8 Migration plan

| Slice | Goal | Files | Status |
| --- | --- | --- | --- |
| **1.1.2d (this slice)** | Repoint `--brand`, `--accent`, `--ink`, `--paper` to Pitti Press values (light + dark). Add map water + park tokens. Mark Field Edition spec superseded. | `harvest-theme.css`, this spec, Field Edition spec, ledger | **shipping now** |
| **1.1.2d-α** | Runtime map theming pass (Stadia layer paint overrides) using the new tokens. | `map-theme.ts` (new), `MapLibreShell.tsx` | next |
| **1.1.2e** | Type foundation — load GT Cinetype / Tiempos, repoint Tailwind `fontFamily`. | `layout.tsx`, `tailwind.config.js` | queued |
| **1.1.2f** | Hero redesign — pull "Awaits You" off the photo. Compose with hairline-and-numeral system. Migrate Button / Badge. | `app/page.tsx`, `Button.tsx`, `Badge.tsx` | queued |
| **1.1.2g** | Sweep remaining legacy tokens. Delete alias layer. | grep-targeted | queued |
| **1.1.2h** | Ribbon section dividers — signature mechanic. | `RibbonDivider.tsx` (new) | queued |
| **1.1.2i** | Section sequence numerals + Pitti stamps. | layout primitives | queued |
| **1.1.2k** | Runware imagery pipeline — script, model + LoRA selection, batch generation of hero + county + farm header + seasonal images. | `scripts/generate-images.mjs` (new), `public/images/**`, `RUNWARE_API_KEY` setup | queued, blocked on operator providing `RUNWARE_API_KEY` |

---

## §9 What ships in this slice (1.1.2d)

- Repoint `--ink`, `--paper`, `--brand`, `--accent` in `harvest-theme.css` (light + dark blocks) to Pitti Press values.
- Add `--map-water`, `--map-park` tokens (used by Slice 1.1.2d-α next).
- This spec doc.
- Superseded-header on `2026-05-19-the-field-edition-design.md`.
- Ledger entry.

What does NOT ship in this slice: runtime map theming, type foundation, hero redesign, Button/Badge migration, ribbon dividers, imagery generation. Each is its own slice.

Verification: `tsc --noEmit`, `pnpm build`, visual smoke (map + homepage + preview card all auto-pick-up new palette via the alias layer).
