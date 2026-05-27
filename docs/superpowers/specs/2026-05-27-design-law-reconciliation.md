# Design Law — Reconciliation: DESIGN_BRIEF v1.0 ⟷ Pitti Press

**Status:** AUTHORITATIVE (2026-05-27). Supersedes conflicting clauses in both source documents per the rulings below.
**Method:** ecc:council (4 voices) + codebase ground-truth + claude-mem (on-disk decision record).
**Inputs:** `~/Downloads/DESIGN_BRIEF.md` (v1.0, English-editorial) and `docs/superpowers/specs/2026-05-19-pitti-press-design.md` + `2026-05-26-homepage-pitti-press-allight-redesign.md` (Italian-modernist).

## The finding

The two documents are ~90% the same. The brief itself keeps *"the existing Pitti Press style"* for Layer 1 illustration. They agree on: all-light, no shadows, no gradients, sparing single accent, hairline rules, type-does-the-work, the kill-list, and the farm-page typographic default. There are exactly **two hard conflicts**, and on both, the on-disk decision record shows the team already deciding *against* the brief.

## Rulings (law)

| # | Conflict | Brief | Pitti Press (mem) | Ruling |
|---|---|---|---|---|
| 1 | Accent palette | Oxblood `#6B1F1F` / newsprint `#ECEBE6` | Vermilion `#D33A2C` / cream `#F2EBDA` | **Pitti Press.** Decision log 2026-05-19 rejected oxblood by name ("too sombre"). Oxblood/newsprint chrome also clashes with the ~1,400 vermilion/sea-ink/cream illustrations the brief itself keeps; re-skinning would force a full library regen for no gain. |
| 2 | Type | Caslon + Cabinet Grotesk | Clash Display + Manrope + IBM Plex | **Pitti Press.** Serif "purged" 2026-05-26; Caslon (English old-style) fights the Cassandre/Vignelli soul the illustrations are built around. Clash already satisfies the brief's real requirement (distinctive, non-Inter). |
| 3 | Map | Rewrite to react-map-gl / Mapbox custom style | Reskin Stadia/MapLibre at runtime (§4) | **Pitti Press.** Reskinning ~5,000 working lines beats a rewrite. Both want a printed-map look. |

## Adopted from the brief (improvements → law)

- **Farm detail pages: typographic default; AI illustrations never hero a farm page.** Only a real submitted photograph earns the photo-led hero (brief §6, Layers 2/3). Corrects a live credibility problem (Apothecary/Pitti were served bare, uncaptioned, full-bleed as if documentary).
- **Four-layer imagery governance** (1 brand-hero / 2 typographic / 3 submitted-photo / 4 decorative). Pitti illustration relocates *off* farm heroes onto homepage / county / seasonal / journal (Layer 1) and small motifs (Layer 4).
- **Homepage: 5 sections**, editorial voice, ≤65–68ch prose, the full §11 kill-list (teal incl. favicon/theme-color, pure-white canvas, all box-shadow, Site Statistics / How-It-Works / Taste-the-Difference, two-CTA hero, button-styled "view all").
- **Editorial tone** for farm copy (already seeded: 3,512/3,512 farms have fact-grounded descriptions as of 2026-05-25).

## Net model

**Pitti Press = the skin** (palette, type, illustration style, map cartography, all-light).
**DESIGN_BRIEF = the structure & governance** (farm-typographic default, imagery law, homepage cut, editorial voice).

## Open (operator) — unchanged from brief §15

- Photo-submission upgrade path (`/claim`) is **not built**: no route, `/add` is a stub, `ImageUpload` upload is a base64 placeholder, not wired to S3/Hetzner. Layer 3 ("page upgrades when a farm submits photos") is currently inert until this is built.
- Caslon/oxblood "English-editorial" pivot remains available if the operator wants to override rulings 1–2 (more expensive: contradicts two recent locked decisions + forces illustration-library regen).

## Slice queue (revised)

1. **Farm typographic-default hero** — strip AI (Apothecary + Pitti) from `/shop/[slug]` hero; render Pitti Press typographic hero; photo-led only for real photos. *(this slice)*
2. Convert remainder of `/shop/[slug]` (detail bar, sidebar, gallery, footer) to all-light Pitti Press tokens; remove `dark:`/white/shadow/rounded-2xl.
3. Suppress legacy `ai_generator` fake-photo rows + `ai_pitti` from card thumbnails on listings/map list (Layer 4 category marks instead).
4. Homepage 5-section cut + kill-list sweep.
5. Strip teal `#00C2B2` (globals.css, favicon, theme-color) sitewide.
6. Map: Pitti Press cartography reskin (Stadia paint overrides) + vermilion pins.
