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

### Fluid Typography Scale

All font sizes use `clamp()` for responsive scaling:

| Token | Mobile → Desktop | Line Height | Usage |
|-------|------------------|-------------|-------|
| `text-xs` | 12px → 14px | 1.5 | Small labels |
| `text-sm` | 14px → 16px | 1.5 | Secondary text |
| `text-base` | 16px → 18px | 1.6 | Body text |
| `text-lg` | 18px → 20px | 1.6 | Large body |
| `text-xl` | 20px → 24px | 1.5 | Small headings |
| `text-2xl` | 24px → 32px | 1.4 | Headings |
| `text-3xl` | 30px → 40px | 1.3 | Large headings |
| `text-4xl` | 36px → 48px | 1.2 | Page titles |
| `text-5xl` | 48px → 64px | 1.1 | Hero titles |
| `text-6xl` | 60px → 80px | 1.0 | Extra large heroes |

---

## Spacing

### 4px Baseline Grid

All spacing follows a 4px baseline for vertical rhythm:

| Token | Size | Touch Target |
|-------|------|--------------|
| `1` | 4px | |
| `2` | 8px | |
| `3` | 12px | |
| `4` | 16px | |
| `6` | 24px | |
| `8` | 32px | |
| `11` | 44px | iOS minimum touch |
| `12` | 48px | **Standard touch target** |
| `14` | 56px | Spacious touch |

**Example:**
```jsx
<button className="px-6 py-3">Standard padding</button>
<div className="space-y-4">Consistent vertical rhythm</div>
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
<div className="p-[13px]">         {/* ❌ Use p-3 (12px) or p-4 (16px) */}
```

**After:**
```jsx
<div className="ring-primary-500"> {/* ✅ Uses design system */}
<div className="bg-primary-500">   {/* ✅ Semantic token */}
<div className="p-4">              {/* ✅ 4px baseline grid */}
```

---

## Changelog

### 2026-01-19 - Queue 8, Slice 1
- **ADDED:** Primary color scale (50-900) mapped to serum brand color
- **FIXED:** Components can now use `primary-500`, `primary-600`, etc.
- **DOCUMENTED:** Complete design token system

---

**Questions?** See `tailwind.config.js` for the source of truth.
