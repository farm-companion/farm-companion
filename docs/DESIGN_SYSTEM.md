# Farm Companion Design System

## God-Tier Design Standards

This document defines the precise design parameters for achieving Apple-level, Awwwards-grade frontend quality. Every component, color, spacing, and interaction must meet these standards.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Component Standards](#component-standards)
6. [Accessibility Requirements](#accessibility-requirements)
7. [Motion and Animation](#motion-and-animation)
8. [Quality Checklist](#quality-checklist)

---

## Design Philosophy

### Core Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Clarity First** | Content must be immediately readable | WCAG AAA contrast (7:1 minimum for body text) |
| **No Truncation** | Key information never hidden | Full names, descriptions visible at all times |
| **Obvious Affordance** | Interactive elements look interactive | Buttons have solid fills/borders, clear hover states |
| **Generous Spacing** | Breathing room creates premium feel | 8px baseline grid, minimum 48px touch targets |
| **Purposeful Motion** | Animation serves function, not decoration | 150-400ms transitions, ease-out curves |
| **Scannable Hierarchy** | Users understand layout in 2 seconds | Clear heading/body/caption distinction |

### Reference Standards

Study these exemplars:
- **Apple Design Resources** - Visual polish, interaction patterns
- **Stripe Dashboard** - Data presentation, form design
- **Linear App** - Micro-interactions, keyboard navigation
- **Vercel** - Dark mode, minimal aesthetic

---

## Color System

### WCAG AAA Contrast Requirements

All text must meet these contrast ratios on their intended backgrounds:

| Text Type | Minimum Ratio | Our Standard |
|-----------|---------------|--------------|
| Body text (small) | 7:1 (AAA) | 8:1+ |
| Large text (18px+) | 4.5:1 (AA) | 5:1+ |
| UI components | 3:1 (AA) | 4:1+ |
| Decorative only | No requirement | N/A |

### Primary Palette

```
Light Mode (on white #ffffff):
------------------------------
Headings:    slate-900  #0f172a  (16.8:1) - Maximum legibility
Body:        slate-800  #1e293b  (12.6:1) - Comfortable reading
Muted:       slate-600  #475569  (7.0:1)  - WCAG AAA small text
Subtle:      slate-500  #64748b  (4.5:1)  - Large text only

Dark Mode (on slate-900 #0f172a):
---------------------------------
Headings:    slate-50   #f8fafc  (15.3:1)
Body:        slate-200  #e2e8f0  (11.7:1)
Muted:       slate-400  #94a3b8  (7.0:1)
Subtle:      slate-500  #64748b  (4.5:1)
```

### Brand Colors

```
Serum (Primary - Teal):
-----------------------
serum.DEFAULT  #0d9488  Teal 600  (4.5:1) - Large text, icons, buttons
serum.dark     #0f766e  Teal 700  (5.9:1) - Small text on white
serum.text     #115e59  Teal 800  (8.2:1) - Body text, AAA compliant

Solar (Accent - Lime):
----------------------
solar.DEFAULT  #4d7c0f  Lime 700  (5.5:1) - AA compliant
solar.light    #84cc16  Lime 500  (2.3:1) - DECORATIVE ONLY, never text
solar.text     #3f6212  Lime 800  (7.3:1) - AAA compliant text
solar.dark     #365314  Lime 900  (10.4:1) - Maximum contrast
```

### Semantic Feedback Colors

```
Success:  #15803d  Green 700   (5.1:1)  - Text: #14532d (9.4:1)
Warning:  #a16207  Yellow 700  (5.0:1)  - Text: #713f12 (8.6:1)
Error:    #b91c1c  Red 700     (5.6:1)  - Text: #7f1d1d (9.2:1)
Info:     #1d4ed8  Blue 700    (5.5:1)  - Text: #1e3a8a (9.8:1)
```

### Background Colors

```
Light Mode:
-----------
canvas:    #ffffff  - Page background
surface:   #f8fafc  - Card backgrounds (slate-50)
elevated:  #f1f5f9  - Dropdowns, modals (slate-100)
hover:     #e2e8f0  - Interactive hover (slate-200)

Dark Mode:
----------
canvas:    #0f172a  - Page background (slate-900)
surface:   #1e293b  - Card backgrounds (slate-800)
elevated:  #334155  - Dropdowns, modals (slate-700)
hover:     #475569  - Interactive hover (slate-600)
```

### Border Colors

```
Light Mode:
-----------
default:   #e2e8f0  - Standard borders (slate-200)
subtle:    #f1f5f9  - Faint dividers (slate-100)
strong:    #cbd5e1  - Emphasized borders (slate-300)
focus:     #0d9488  - Focus rings (teal-600)

Dark Mode:
----------
default:   #334155  - Standard borders (slate-700)
subtle:    #1e293b  - Faint dividers (slate-800)
strong:    #475569  - Emphasized borders (slate-600)
focus:     #2dd4bf  - Focus rings (teal-400)
```

---

## Typography

### Font Stack

```css
--font-primary: 'Clash Display'  /* Headings, brand text */
--font-body: 'Manrope'           /* Body text, UI labels */
--font-accent: 'IBM Plex Sans Condensed'  /* Buttons, filters */
```

### Semantic Type Scale

Use ONLY these 5 semantic sizes. Legacy sizes (xs, sm, lg, xl) are deprecated.

| Scale | Size Range | Line Height | Use Case |
|-------|------------|-------------|----------|
| `display` | 48px - 64px | 1.1 | Hero headlines only |
| `heading` | 24px - 32px | 1.3 | Page/section titles |
| `body` | 16px - 18px | 1.6 | Main content, paragraphs |
| `caption` | 14px - 16px | 1.5 | Supporting text, labels |
| `small` | 12px - 14px | 1.5 | Fine print, timestamps |

### Implementation

```tsx
// CORRECT - Semantic scales
<h1 className="text-display">Hero Title</h1>
<h2 className="text-heading">Section Title</h2>
<p className="text-body">Main content paragraph.</p>
<span className="text-caption">Supporting information</span>
<small className="text-small">Fine print</small>

// INCORRECT - Legacy arbitrary sizes
<h1 className="text-4xl">...</h1>  // Don't use
<p className="text-lg">...</p>     // Don't use
```

### Font Weights

| Weight | Value | Use Case |
|--------|-------|----------|
| Regular | 400 | Body text |
| Medium | 500 | Emphasized body, buttons |
| Semibold | 600 | Headings, important labels |
| Bold | 700 | Display text, strong emphasis |

---

## Spacing System

### 8px Baseline Grid

All spacing must be multiples of 8px for consistent vertical rhythm.

| Token | Value | Use Case |
|-------|-------|----------|
| `1` | 8px | Micro gaps, icon padding |
| `2` | 16px | Tight spacing, inline elements |
| `3` | 24px | Comfortable element spacing |
| `4` | 32px | Card padding, section gaps |
| `5` | 40px | Component spacing |
| `6` | 48px | Touch targets, comfortable gaps |
| `8` | 64px | Section spacing |
| `12` | 96px | Section breaks |
| `16` | 128px | Major page sections |
| `24` | 192px | Hero spacing |

### Component Spacing Standards

```
Card padding:       p-5 (40px)
Card gap:           gap-6 (48px)
Section padding:    py-16 md:py-24 (128px/192px)
Button padding:     h-11 px-4 (44px height, 16px horizontal)
Form field height:  h-11 (44px) - iOS minimum
Touch target:       min-48px (iOS recommends 44px)
```

---

## Component Standards

### Cards

**Required Properties:**
- Border: `border-2 border-slate-200 dark:border-slate-700`
- Radius: `rounded-2xl` (16px)
- Background: `bg-white dark:bg-slate-900`
- Shadow on hover: `hover:shadow-xl`
- Transition: `transition-all duration-200`

**Content Requirements:**
- NO text truncation on primary content (names, titles)
- Full padding: `p-5` minimum
- Clear visual hierarchy: heading > body > caption

### Buttons

**Primary Button:**
```tsx
className="h-11 px-4 rounded-xl bg-slate-900 dark:bg-slate-50
           text-white dark:text-slate-900 text-sm font-semibold
           hover:bg-slate-800 dark:hover:bg-white hover:shadow-md
           active:scale-[0.98] transition-all duration-200"
```

**Secondary Button:**
```tsx
className="h-11 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-600
           text-slate-700 dark:text-slate-300 text-sm font-semibold
           hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400
           active:scale-[0.98] transition-all duration-200"
```

**Button Requirements:**
- Minimum height: 44px (h-11)
- Minimum touch width: 44px
- Text: Always uppercase for accent font, or semibold for body font
- Icon + text: Include label, not icon-only (unless tooltip provided)
- Active state: `active:scale-[0.98]` for press feedback

### Form Inputs

```tsx
className="h-11 px-4 rounded-xl border-2 border-slate-300
           text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-900
           placeholder:text-slate-500
           focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20
           transition-colors duration-150"
```

### Section Headers

```tsx
// Icon badge
<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                bg-primary-100 dark:bg-primary-900/30 mb-6">
  <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
</div>

// Heading - slate-900 for maximum contrast
<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold
               text-slate-900 dark:text-slate-50 mb-4">
  Section Title
</h2>

// Description - slate-700 for high contrast
<p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
  Section description with comfortable reading contrast.
</p>
```

---

## Accessibility Requirements

### WCAG 2.1 Level AAA Targets

| Requirement | Standard | Our Implementation |
|-------------|----------|-------------------|
| Text contrast | 7:1 (AAA) | 8:1+ for body, 16:1+ for headings |
| Large text contrast | 4.5:1 (AA) | 5:1+ |
| Touch targets | 44x44px (AAA) | 48x48px minimum |
| Focus indicators | 2px visible | 2px ring with offset |
| Color independence | No color-only info | Icons + labels always |
| Motion | Respect prefers-reduced-motion | All animations optional |

### Focus States

```css
.focus-ring:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 8px;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support

```tsx
// Hidden but accessible text
<span className="sr-only">Description for screen readers</span>

// Skip link for keyboard navigation
<a href="#main" className="skip-to-content">Skip to main content</a>
```

---

## Motion and Animation

### Timing Standards

| Duration | Token | Use Case |
|----------|-------|----------|
| 50ms | `instant` | Micro-feedback (active states) |
| 150ms | `fast` | Button hovers, focus changes |
| 250ms | `base` | Card transitions, panel opens |
| 400ms | `slow` | Page transitions, complex animations |

### Easing Functions

```css
/* Apple-style spring easing - use for most transitions */
transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);

/* Standard ease-out - use for exits */
transition-timing-function: ease-out;
```

### Animation Classes

```tsx
// Hover lift effect
className="hover-lift"  // translateY(-4px) + shadow on hover

// Press feedback
className="active:scale-[0.98]"  // Subtle shrink on click

// Page enter
className="animate-page-enter"  // Fade up from 8px

// Staggered children
className="stagger-1"  // 50ms delay
className="stagger-2"  // 100ms delay
className="stagger-3"  // 150ms delay
```

### Motion Principles

1. **Purposeful** - Animation must serve a function (feedback, orientation, delight)
2. **Quick** - Most transitions under 250ms
3. **Subtle** - Movement distances under 20px
4. **Interruptible** - User can cancel mid-animation
5. **Accessible** - Respects prefers-reduced-motion

---

## Quality Checklist

Before shipping any component, verify ALL items:

### Contrast

- [ ] Body text is slate-800+ on light / slate-200+ on dark
- [ ] Headings are slate-900 on light / slate-50 on dark
- [ ] All text passes WCAG AAA (7:1) when tested
- [ ] Buttons have clear boundaries (border-2 or solid fill)

### Content

- [ ] No text truncation on primary content (names, titles)
- [ ] Full information visible without interaction
- [ ] Key info scannable in 2 seconds

### Interactivity

- [ ] All interactive elements have visible hover state
- [ ] Touch targets are minimum 44x44px
- [ ] Focus rings visible on keyboard navigation
- [ ] Active/pressed state provides feedback

### Spacing

- [ ] Consistent with 8px grid
- [ ] Card padding minimum p-5 (40px)
- [ ] Section padding py-16 md:py-24

### Typography

- [ ] Using semantic scale (display/heading/body/caption/small)
- [ ] Line heights comfortable (1.5-1.6 for body)
- [ ] Font weights intentional (400/500/600/700 only)

### Motion

- [ ] Transitions are 150-400ms
- [ ] Using ease-out or spring easing
- [ ] Respects prefers-reduced-motion
- [ ] No jarring or distracting animations

### Dark Mode

- [ ] All colors tested in dark mode
- [ ] Contrast maintained in dark mode
- [ ] No pure white (#fff) on dark backgrounds
- [ ] Borders visible in dark mode

---

## Quick Reference

### Most Common Classes

```tsx
// Text colors (light mode)
text-slate-900   // Headings (16.8:1)
text-slate-800   // Body (12.6:1)
text-slate-700   // Description (8.6:1)
text-slate-600   // Muted (7.0:1)

// Backgrounds
bg-white         // Cards, surfaces
bg-slate-50      // Subtle elevation
bg-slate-100     // Section backgrounds
bg-slate-900     // Primary buttons

// Borders
border-2 border-slate-200   // Visible card borders
border-2 border-slate-300   // Button borders
border-slate-300            // Subtle borders

// Spacing
p-5              // Card padding (40px)
gap-6            // Card grid gap (48px)
py-16 md:py-24   // Section padding
h-11             // Button/input height (44px)

// Radius
rounded-xl       // Buttons (12px)
rounded-2xl      // Cards (16px)

// Shadows
shadow-xl        // Hover state
shadow-premium   // Subtle depth
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial god-tier design system documentation |

---

*This document is the single source of truth for Farm Companion's design standards. All new components must comply with these specifications.*
