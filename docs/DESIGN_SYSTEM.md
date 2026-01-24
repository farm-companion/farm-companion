# Farm Companion Design System

## God-Tier Design Standards

This document defines the precise design parameters for achieving Apple-level, Awwwards-grade frontend quality. Every component, color, spacing, and interaction must meet these standards.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Information Density Grid](#information-density-grid)
6. [Component Standards](#component-standards)
7. [Accessibility Requirements](#accessibility-requirements)
8. [Motion and Animation](#motion-and-animation)
9. [Micro-Haptics and Audio Cues](#micro-haptics-and-audio-cues)
10. [Focus-First Navigation](#focus-first-navigation)
11. [Quality Checklist](#quality-checklist)

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

> **Design Philosophy:** Zinc is the material of the future. By moving from Slate (blue-heavy) to Zinc (neutral-warm), we allow the Kinetic Cyan to pop without looking like a children's toy. This is industrial-grade frontend.

### WCAG AAA Contrast Requirements

All text must meet these contrast ratios on their intended backgrounds:

| Text Type | Minimum Ratio | Our Standard |
|-----------|---------------|--------------|
| Body text (small) | 7:1 (AAA) | 8:1+ |
| Large text (18px+) | 4.5:1 (AA) | 5:1+ |
| UI components | 3:1 (AA) | 4:1+ |
| Decorative only | No requirement | N/A |

---

### The Obsidian & Kinetic Palette

We replace generic Slate with **Zinc-based Neutrals** (slight warm undertones) and introduce **Kinetic Cyan** (high-vibrancy, electric feel).

#### Neutral Foundations (The Obsidian Stack)

| Layer | Light Mode (Zinc) | Dark Mode (Obsidian) | Contrast | Use |
|-------|-------------------|----------------------|----------|-----|
| **Canvas** | `#FFFFFF` | `#09090B` (Deepest Ink) | Infinite | Page background |
| **Surface** | `#FAFAFA` (zinc-50) | `#18181B` (zinc-900) | 18:1 | Card backgrounds |
| **Elevated** | `#F4F4F5` (zinc-100) | `#27272A` (zinc-800) | 12:1 | Modals, dropdowns |
| **Muted** | `#E4E4E7` (zinc-200) | `#3F3F46` (zinc-700) | 8:1 | Hover states |
| **Border** | `#D4D4D8` (zinc-300) | `#52525B` (zinc-600) | UI | Borders, dividers |

#### Text Colors (WCAG AAA Verified)

```
Light Mode (on #FFFFFF):
------------------------
Headings:    zinc-900   #18181B  (17.4:1) - Maximum legibility
Body:        zinc-800   #27272A  (14.2:1) - Comfortable reading
Muted:       zinc-600   #52525B  (7.2:1)  - WCAG AAA small text
Subtle:      zinc-500   #71717A  (5.0:1)  - Large text only

Dark Mode (on #09090B):
-----------------------
Headings:    zinc-50    #FAFAFA  (19.2:1) - Maximum legibility
Body:        zinc-200   #E4E4E7  (14.8:1) - Comfortable reading
Muted:       zinc-400   #A1A1AA  (7.4:1)  - WCAG AAA small text
Subtle:      zinc-500   #71717A  (4.6:1)  - Large text only
```

#### Brand Accents (Kinetic & Iris)

| Role | Name | Hex | Contrast | Why |
|------|------|-----|----------|-----|
| **Primary** | Kinetic Cyan | `#06B6D4` | 4.5:1 | Cuts through dark backgrounds like a laser |
| **Primary Dark** | Deep Cyan | `#0891B2` | 5.8:1 | Small text on white |
| **Primary Text** | Cyan 800 | `#155E75` | 8.1:1 | AAA body text |
| **Secondary** | Iris Violet | `#6366F1` | 4.5:1 | Ghost states, subtle depth |
| **Secondary Dark** | Deep Violet | `#4F46E5` | 5.9:1 | Small text |
| **Accent** | Solar Lime | `#84CC16` | 2.3:1 | Decorative only |
| **Accent Text** | Lime 800 | `#3F6212` | 7.3:1 | AAA text |

#### Semantic Feedback (Elevated)

| State | Color | Hex | Text Hex | Contrast |
|-------|-------|-----|----------|----------|
| **Success** | Emerald | `#10B981` | `#064E3B` | 9.8:1 |
| **Warning** | Amber | `#F59E0B` | `#78350F` | 8.2:1 |
| **Error** | Rose/Ember | `#F43F5E` | `#881337` | 8.9:1 |
| **Info** | Sky | `#0EA5E9` | `#0C4A6E` | 9.1:1 |

---

### CSS Variable Implementation

```css
:root {
  /* Obsidian Neutrals - Light Mode */
  --obsidian-canvas: #FFFFFF;
  --obsidian-surface: #FAFAFA;
  --obsidian-elevated: #F4F4F5;
  --obsidian-muted: #E4E4E7;
  --obsidian-border: #D4D4D8;

  /* Text - Light Mode */
  --text-heading: #18181B;
  --text-body: #27272A;
  --text-muted: #52525B;
  --text-subtle: #71717A;

  /* Kinetic Accents */
  --kinetic: #06B6D4;
  --kinetic-dark: #0891B2;
  --kinetic-text: #155E75;
  --kinetic-glow: rgba(6, 182, 212, 0.15);

  /* Iris Secondary */
  --iris: #6366F1;
  --iris-dark: #4F46E5;
  --iris-glow: rgba(99, 102, 241, 0.15);
}

.dark {
  /* Obsidian Neutrals - Dark Mode */
  --obsidian-canvas: #09090B;
  --obsidian-surface: #18181B;
  --obsidian-elevated: #27272A;
  --obsidian-muted: #3F3F46;
  --obsidian-border: #52525B;

  /* Text - Dark Mode */
  --text-heading: #FAFAFA;
  --text-body: #E4E4E7;
  --text-muted: #A1A1AA;
  --text-subtle: #71717A;

  /* Kinetic - Brighter on dark */
  --kinetic: #22D3EE;
  --kinetic-dark: #06B6D4;
  --kinetic-glow: rgba(34, 211, 238, 0.2);
}
```

---

### The "God-Tier" Active State

Instead of flat background colors, we use **Glassmorphism Gradients** for selected states:

```tsx
// Active/Selected item styling
className={`
  ${isSelected
    ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-l-[3px] border-l-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
  }
`}
```

**Components:**
- **Background:** Linear gradient `from-cyan-500/10 to-transparent`
- **Left Border:** 3px Kinetic Cyan with rounded caps
- **Glow:** Subtle `shadow-[0_0_15px_rgba(6,182,212,0.1)]`

---

### Film Grain Texture (Better Than Apple)

Apple uses pure blurs. We add **Film Grain** to prevent gradient banding:

```css
.grain {
  position: relative;
}

.grain::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: overlay;
}
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

## Information Density Grid

**The Problem with Apple:** Apple often wastes space. A god-tier system optimizes for **Scan Speed**.

### The Two-Scroll Rule

> If a user has to scroll more than twice to see primary data, the density is too low.

### Density Modes

We implement three density modes that adjust spacing systemwide:

| Mode | Card Padding | Grid Gap | Section Padding | Use Case |
|------|--------------|----------|-----------------|----------|
| **Comfortable** | `p-5` (40px) | `gap-6` (48px) | `py-16 md:py-24` | Marketing, landing pages |
| **Compact** | `p-3` (24px) | `gap-4` (32px) | `py-8 md:py-12` | Dashboards, data tables |
| **Dense** | `p-2` (16px) | `gap-3` (24px) | `py-6 md:py-8` | Admin panels, power users |

### CSS Variables

```css
:root {
  /* Comfortable (default) */
  --density-card-padding: 40px;
  --density-grid-gap: 48px;
  --density-section-y: 128px;
}

.density-compact {
  --density-card-padding: 24px;
  --density-grid-gap: 32px;
  --density-section-y: 64px;
}

.density-dense {
  --density-card-padding: 16px;
  --density-grid-gap: 24px;
  --density-section-y: 48px;
}
```

### Implementation

```tsx
// Apply density mode to a container
<div className="density-compact">
  <Card className="p-[var(--density-card-padding)]">
    {/* Content automatically adjusts */}
  </Card>
</div>

// Or use Tailwind classes directly
<div className="p-5 compact:p-3 dense:p-2">
  {/* Responsive density */}
</div>
```

### Scan Speed Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to First Data | < 0.5s | User sees meaningful content |
| Scroll Depth to Primary Action | < 1 scroll | CTA visible without scrolling |
| Information per Viewport | 3-5 key items | Not overwhelming, not sparse |
| Visual Parsing Time | < 2 seconds | User understands layout |

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

## Micro-Haptics and Audio Cues

**The Sixth Sense:** Apple excels at haptic feedback, but most web apps ignore it entirely. We treat sensory feedback as a first-class citizen.

### Haptic Feedback Standards

| Event | Haptic Type | Duration | Intensity |
|-------|-------------|----------|-----------|
| Button Press | `light` | 10ms | Low |
| Success Action | `medium` | 20ms | Medium |
| Error/Warning | `heavy` | 30ms | High |
| Toggle Switch | `selection` | 5ms | Minimal |
| Long Press | `impactHeavy` | 50ms | High |

### Implementation

```tsx
// Haptic utility function
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
      selection: [5]
    };
    navigator.vibrate(patterns[type]);
  }
}

// Usage in components
<Button onClick={() => {
  triggerHaptic('light');
  handleClick();
}}>
  Submit
</Button>
```

### Audio Cue Standards

All audio is **optional** and respects user preferences. Implemented via the `useSoundFeedback` hook.

| Event | Sound | Duration | Frequency |
|-------|-------|----------|-----------|
| Success | `tink` | 40ms | 1200Hz (high) |
| Error | `bonk` | 80ms | 400Hz (low) |
| Notification | `ping` | 60ms | 880Hz (mid) |
| Navigation | `swoosh` | 100ms | Sweep |

### Implementation

```tsx
// Sound feedback hook
import { useSoundFeedback } from '@/hooks/useSoundFeedback';

function MyComponent() {
  const { playSuccess, playError } = useSoundFeedback();

  const handleSubmit = async () => {
    try {
      await submitForm();
      playSuccess(); // 40ms tink at 1200Hz
    } catch {
      playError();   // 80ms bonk at 400Hz
    }
  };
}
```

### Error Shake Animation

Every error state must include a shake animation:

```css
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

.animate-error-shake {
  animation: error-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
```

### User Preferences

```tsx
// Respect user preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const soundEnabled = localStorage.getItem('sound-feedback') !== 'disabled';

// Only play if both conditions are met
if (!prefersReducedMotion && soundEnabled) {
  playSound();
  triggerHaptic('medium');
}
```

---

## Focus-First Navigation

**The Problem with Apple:** Apple is mouse-centric. A god-tier system is **Keyboard-First**.

### The Tab Rule

> Every interactive element must be reachable via Tab key in logical order.

### Focus Ring Standards

| State | Ring Width | Offset | Color |
|-------|------------|--------|-------|
| Default focus | 2px | 2px | `primary-600` |
| Error focus | 2px | 2px | `error-700` |
| Success focus | 2px | 2px | `success-700` |

### Implementation

```css
/* God-tier focus ring */
.focus-ring {
  outline: none;
}

.focus-ring:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 8px;
}

/* Ensure focus is ALWAYS visible */
*:focus-visible {
  outline: 2px solid var(--border-focus) !important;
  outline-offset: 2px !important;
}
```

### Command Palette (CMD+K)

A Command Palette is a **core component**, not an afterthought.

**Requirements:**
- Trigger: `CMD+K` (Mac) / `Ctrl+K` (Windows)
- Response time: < 50ms to open
- Search: Fuzzy matching with highlighted results
- Categories: Navigation, Actions, Recent, Settings

**Command Palette Structure:**

```tsx
interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  category: 'navigation' | 'action' | 'recent' | 'settings';
  onSelect: () => void;
}

// Example commands
const commands: CommandItem[] = [
  { id: 'map', label: 'Go to Map', shortcut: 'G M', category: 'navigation', icon: <Map />, onSelect: () => router.push('/map') },
  { id: 'search', label: 'Search Farms', shortcut: '/', category: 'action', icon: <Search />, onSelect: openSearch },
  { id: 'theme', label: 'Toggle Dark Mode', shortcut: 'T', category: 'settings', icon: <Moon />, onSelect: toggleTheme },
];
```

**Visual Design:**

```tsx
// Command Palette styling
<div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

  {/* Palette */}
  <div className="relative w-full max-w-lg bg-white dark:bg-slate-900
                  rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700
                  overflow-hidden">
    {/* Search input */}
    <input
      className="w-full h-14 px-5 text-lg bg-transparent border-b-2
                 border-slate-200 dark:border-slate-700
                 placeholder:text-slate-500 focus:outline-none"
      placeholder="Type a command or search..."
      autoFocus
    />

    {/* Results */}
    <div className="max-h-80 overflow-y-auto p-2">
      {/* Command items */}
    </div>
  </div>
</div>
```

### Keyboard Shortcuts

| Action | Mac | Windows | Scope |
|--------|-----|---------|-------|
| Command Palette | `CMD+K` | `Ctrl+K` | Global |
| Search | `/` | `/` | Global |
| Go to Map | `G M` | `G M` | Global |
| Go to Home | `G H` | `G H` | Global |
| Toggle Theme | `T` | `T` | Global |
| Close Modal | `Escape` | `Escape` | Modal |
| Submit Form | `CMD+Enter` | `Ctrl+Enter` | Form |
| Next Item | `J` or `Down` | `J` or `Down` | List |
| Previous Item | `K` or `Up` | `K` or `Up` | List |

### Skip Links

```tsx
// Always include skip links at the top of the page
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
             focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:rounded-lg
             focus:shadow-lg focus:text-slate-900 focus:font-semibold"
>
  Skip to main content
</a>
```

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

### Information Density

- [ ] Primary data visible within 2 scrolls
- [ ] Density mode appropriate for context (comfortable/compact/dense)
- [ ] Scan speed under 2 seconds

### Keyboard Navigation

- [ ] All interactive elements reachable via Tab
- [ ] Logical tab order (top-to-bottom, left-to-right)
- [ ] Escape closes modals and overlays
- [ ] Command palette accessible via CMD+K

### Sensory Feedback

- [ ] Success states have haptic + optional audio
- [ ] Error states have shake animation
- [ ] Respects prefers-reduced-motion
- [ ] Sound can be disabled via settings

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
| 1.1.0 | 2026-01-24 | Added Information Density Grid, Micro-Haptics, Focus-First Navigation |
| 1.0.0 | 2026-01-24 | Initial god-tier design system documentation |

---

*This document is the single source of truth for Farm Companion's design standards. All new components must comply with these specifications.*
