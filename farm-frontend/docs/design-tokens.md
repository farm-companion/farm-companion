# Design Tokens Documentation

## Overview

This document defines the design token system for Farm Companion. All colors, typography, spacing, and other design primitives are centralized in `tailwind.config.js` for consistency and maintainability.

**Last Updated:** 2026-01-19

---

## Color System

### Brand Colors (Core Palette)

Our brand identity is built on these core colors:

| Token | Hex | Usage |
|-------|-----|-------|
| `obsidian` | #1E1F23 | Dark backgrounds, text |
| `serum` | #00C2B2 | Primary brand color (teal/turquoise) |
| `sandstone` | #E4E2DD | Light neutral backgrounds |
| `solar` | #D4FF4F | Accent color (lime green) |
| `midnight` | #121D2B | Deep dark blue backgrounds |

**Example:**
```jsx
<div className="bg-serum text-white">Branded button</div>
<div className="bg-obsidian text-sandstone">Dark card</div>
```

---

### Primary Color Scale

The primary scale (mapped to serum brand color) provides shades for hover states, focus rings, and interactive elements:

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | #E6F9F7 | Lightest backgrounds |
| `primary-100` | #CCF3EF | Very light backgrounds |
| `primary-200` | #99E7DF | Light backgrounds |
| `primary-300` | #66DBCF | Subtle borders |
| `primary-400` | #33CFBF | Muted interactive elements |
| `primary-500` | #00C2B2 | **DEFAULT** - Main brand color |
| `primary-600` | #009B8F | Hover states |
| `primary-700` | #00746B | Active/pressed states |
| `primary-800` | #004D48 | Dark contrast |
| `primary-900` | #002624 | Darkest contrast |

**Example:**
```jsx
<button className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700">
  Primary Button
</button>
<input className="focus:ring-2 focus:ring-primary-500" />
```

---

### Semantic Feedback Colors

#### Success (Green)
- `success-light` (#D1FAE5) - Light backgrounds for success messages
- `success` (#10B981) - Success buttons, icons, borders
- `success-dark` (#065F46) - Dark success text

#### Warning (Orange)
- `warning-light` (#FEF3C7) - Light backgrounds for warnings
- `warning` (#F59E0B) - Warning buttons, icons, borders
- `warning-dark` (#92400E) - Dark warning text

#### Error (Red)
- `error-light` (#FEE2E2) - Light backgrounds for errors
- `error` (#EF4444) - Error buttons, icons, borders
- `error-dark` (#991B1B) - Dark error text

#### Info (Blue)
- `info-light` (#DBEAFE) - Light backgrounds for info
- `info` (#3B82F6) - Info buttons, icons, borders
- `info-dark` (#1E40AF) - Dark info text

**Example:**
```jsx
<div className="bg-success-light text-success-dark border border-success">
  Farm added successfully!
</div>
<div className="bg-error-light text-error-dark border border-error">
  Please fix the errors below
</div>
```

---

### Semantic UI Colors (CSS Variables)

These use CSS custom properties for theme switching:

| Token | Usage |
|-------|-------|
| `background-canvas` | Main page background |
| `background-surface` | Card/panel backgrounds |
| `text-body` | Body text |
| `text-heading` | Headings |
| `text-muted` | Secondary/muted text |
| `text-link` | Link text |
| `border-default` | Default borders |
| `border-focus` | Focus state borders |

**Example:**
```jsx
<div className="bg-background-canvas text-text-body">
  <h1 className="text-text-heading">Heading</h1>
  <p className="text-text-muted">Supporting text</p>
</div>
```

---

## Typography

### Font Families

| Token | Fonts | Usage |
|-------|-------|-------|
| `font-primary` | System UI stack | Headings, UI elements |
| `font-body` | System UI stack | Body text |
| `font-accent` | System UI stack | Accent text |
| `font-serif` | Georgia, Cambria | Long-form content |
| `font-clash` | Clash Display | Hero headings (special) |

**Example:**
```jsx
<h1 className="font-clash text-6xl">Hero Title</h1>
<p className="font-body text-base">Body paragraph</p>
```

---

### Semantic Typography Scale (NEW - Queue 8, Slice 2)

**Apple-style semantic naming.** Use these instead of arbitrary sizes:

| Token | Mobile → Desktop | Line Height | Letter Spacing | Weight | Usage |
|-------|------------------|-------------|----------------|--------|-------|
| `text-display` | 48px → 64px | 1.1 | -0.02em | 700 | Hero text, landing pages |
| `text-heading` | 24px → 32px | 1.3 | -0.01em | 600 | Page titles, section headers |
| `text-body` | 16px → 18px | 1.6 | normal | 400 | Main content, paragraphs |
| `text-caption` | 14px → 16px | 1.5 | normal | 400 | Supporting text, labels |
| `text-small` | 12px → 14px | 1.5 | normal | 400 | Fine print, legal text |

**Example:**
```jsx
<h1 className="text-display">Welcome to Farm Companion</h1>
<h2 className="text-heading">Find Local Farm Shops</h2>
<p className="text-body">Discover fresh, seasonal produce from over 1,300 UK farms.</p>
<span className="text-caption">Updated daily</span>
<small className="text-small">© 2026 Farm Companion</small>
```

---

### Legacy Typography Scale (DEPRECATED)

**⚠️ These will be removed in future versions.** Migrate to semantic scales above:

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `text-xs` | `text-small` | Fine print |
| `text-sm` | `text-caption` | Supporting text |
| `text-base` | `text-body` | Main content |
| `text-lg` | `text-body` | Use body for consistency |
| `text-xl` | `text-heading` | Section headers |
| `text-2xl` | `text-heading` | Page titles |
| `text-3xl` | `text-heading` or `text-display` | Large headers |
| `text-4xl` | `text-display` | Hero text |
| `text-5xl` | `text-display` | Hero text |
| `text-6xl` | `text-display` | Hero text |

---

## Spacing

### 8px Baseline Grid (Apple Design Guidelines)

All spacing follows an 8px baseline grid for consistent visual rhythm. This matches Apple's design system and ensures precise alignment across all screen sizes.

| Token | Size | Usage |
|-------|------|-------|
| `0` | 0px | None |
| `1` | 8px | Micro spacing (icons, badges) |
| `2` | 16px | Tight spacing (form labels) |
| `3` | 24px | Comfortable spacing (card padding) |
| `4` | 32px | Section spacing (list items) |
| `5` | 40px | Component spacing |
| `6` | 48px | **Touch target / comfortable spacing** |
| `7` | 56px | Spacious touch target |
| `8` | 64px | Generous spacing |
| `10` | 80px | Large spacing |
| `12` | 96px | Section breaks |
| `16` | 128px | Major sections |
| `20` | 160px | Page sections |
| `24` | 192px | Hero spacing |
| `28` | 224px | Extra large |
| `32` | 256px | Maximum spacing |

**Why 8px?**
- Aligns with Apple's HIG (Human Interface Guidelines)
- Ensures consistent rhythm across breakpoints
- All values scale predictably (8, 16, 24, 32, 40, 48...)
- Reduces decision fatigue with clear increments

**Example:**
```jsx
<button className="px-6 py-3">48px x 24px padding (6 x 3 units)</button>
<div className="space-y-4">32px vertical rhythm (4 units)</div>
<section className="py-12">96px section spacing (12 units)</section>
```

---

## Border Radius

| Token | Size | Usage |
|-------|------|-------|
| `rounded-none` | 0 | Sharp corners |
| `rounded-sm` | 4px | Subtle rounding |
| `rounded-md` | 8px | Standard cards/inputs |
| `rounded-lg` | 16px | Large cards, modals |
| `rounded-full` | 9999px | Pills, avatars |

---

## Shadows

| Token | Usage |
|-------|-------|
| `shadow-premium` | Subtle elevation |
| `shadow-premium-lg` | Medium elevation (cards) |
| `shadow-premium-xl` | High elevation (modals) |

---

## Animation

### Duration

| Token | Time | Usage |
|-------|------|-------|
| `duration-instant` | 50ms | Micro-interactions |
| `duration-fast` | 150ms | Hovers, focus |
| `duration-base` | 250ms | **Standard** transitions |
| `duration-slow` | 400ms | Panels, drawers |

### Easing

| Token | Curve | Usage |
|-------|-------|-------|
| `ease-gentle-spring` | cubic-bezier(0.2, 0.8, 0.2, 1) | Smooth, natural motion |

**Example:**
```jsx
<div className="transition-all duration-base ease-gentle-spring hover:scale-105">
  Smooth hover effect
</div>
```

---

## Touch Targets

### Minimum Sizes (Mobile)

All interactive elements must meet these minimums:

| Token | Size | Standard |
|-------|------|----------|
| `min-w-touch` | 48px | Our standard |
| `min-h-touch` | 48px | Our standard |
| `min-w-touch-ios` | 44px | iOS minimum |
| `min-h-touch-ios` | 44px | iOS minimum |

**Example:**
```jsx
<button className="min-w-touch min-h-touch">
  Comfortable mobile button
</button>
```

---

## Safe Area (iOS Notch)

| Token | Usage |
|-------|-------|
| `p-safe` | All safe area insets |
| `pt-safe-top` | Top inset only |
| `pb-safe-bottom` | Bottom inset only |

**Example:**
```jsx
<header className="pt-safe-top">Header respects notch</header>
<footer className="pb-safe-bottom">Footer respects home bar</footer>
```

---

## Best Practices

### ✅ DO

- Use semantic tokens (`primary-500`, `text-body`) instead of raw hex values
- Use the spacing scale (multiples of 4px) for consistency
- Use fluid typography for responsive text
- Meet minimum touch target sizes (48px)
- Use `duration-base` for most transitions

### ❌ DON'T

- Don't use arbitrary hex colors (`bg-[#00C2B2]`)
- Don't use arbitrary spacing (`p-[13px]`)
- Don't create custom color shades outside the system
- Don't use transitions longer than 400ms (slow)
- Don't make touch targets smaller than 44px

---

## Migration Guide

If you find components using undefined tokens:

**Before:**
```jsx
<div className="ring-primary-500"> {/* ✅ Now defined! */}
<div className="bg-[#00C2B2]">     {/* ❌ Use bg-primary-500 */}
<div className="p-[13px]">         {/* ❌ Use p-2 (16px) or p-3 (24px) */}
<div className="space-y-5">        {/* ❌ Use space-y-4 (32px) or space-y-6 (48px) */}
```

**After:**
```jsx
<div className="ring-primary-500"> {/* ✅ Uses design system */}
<div className="bg-primary-500">   {/* ✅ Semantic token */}
<div className="p-3">              {/* ✅ 8px baseline grid (24px) */}
<div className="space-y-4">        {/* ✅ 8px baseline grid (32px) */}
```

---

## Changelog

### 2026-01-19 - Queue 8, Slice 3
- **CHANGED:** Spacing system migrated from 4px to 8px baseline grid
- **ALIGNED:** Spacing now follows Apple Human Interface Guidelines
- **IMPROVED:** All spacing values are multiples of 8 for consistent rhythm
- **UPDATED:** Spacing tokens: 1=8px, 2=16px, 3=24px, 4=32px, 5=40px, 6=48px, etc.
- **WHY:** Reduces decision fatigue, ensures predictable scaling, matches industry best practices

### 2026-01-19 - Queue 8, Slice 2
- **ADDED:** Semantic typography scale (display, heading, body, caption, small)
- **CHANGED:** Font sizes now use semantic naming instead of arbitrary sizes
- **DEPRECATED:** Legacy sizes (xs, sm, base, lg, xl, 2xl, etc.) - migrate to semantic scales
- **IMPROVED:** Typography includes proper letter-spacing and font-weight defaults

### 2026-01-19 - Queue 8, Slice 1
- **ADDED:** Primary color scale (50-900) mapped to serum brand color
- **ADDED:** Secondary color scale (50-900) mapped to solar accent color
- **ADDED:** Neutral color scale (50-900) for standardized grays
- **FIXED:** Components can now use `primary-500`, `primary-600`, etc.
- **DOCUMENTED:** Complete design token system

---

**Questions?** See `tailwind.config.js` for the source of truth.
