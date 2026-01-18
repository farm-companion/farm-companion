# FarmCompanion Design System
**Version 1.0 • Apple-Level Product Design Standards**

---

## Philosophy

### Design Principles

**1. Clarity Above All**
Every element serves a purpose. Remove anything that doesn't directly help users find farms or understand produce availability. Clarity beats cleverness.

**2. Depth Through Restraint**
Use subtle elevation, gentle motion, and purposeful color. Trust whitespace. Let content breathe.

**3. Felt, Not Seen**
Great design is invisible. Users should feel guided, not manipulated. Interactions should feel inevitable.

**4. Accessibility Is Non-Negotiable**
WCAG AAA touch targets (48px). WCAG AA contrast minimum. Keyboard navigation. Screen readers. No exceptions.

**5. Performance Is Design**
Fast is a feature. Skeleton states over spinners. Instant feedback. Perceived performance matters more than actual.

---

## Visual Language

### Color System

#### Semantic Architecture

Colors communicate meaning, not decoration. Use semantic tokens exclusively.

```tsx
// ❌ NEVER: Hardcoded utility classes
<button className="bg-teal-500 hover:bg-teal-600">

// ✅ ALWAYS: Semantic tokens
<button className="bg-brand-primary hover:bg-brand-primary/90">
```

#### Brand Colors

**Primary (Serum Teal)** — `#00C2B2`
Actions, links, primary buttons, active states. Use sparingly for maximum impact.

```tsx
// Usage
className="bg-brand-primary text-white"
className="text-brand-primary" // Links
className="border-brand-primary" // Accents
```

**Accent (Solar Lime)** — `#D4FF4F`
Focus rings, highlights, success moments. Creates contrast against dark backgrounds.

```tsx
// Usage
className="ring-brand-accent" // Focus states
className="bg-brand-accent text-midnight" // High-contrast CTAs
```

**Danger (Sunset Red)** — `#FF5A5F`
Destructive actions, errors, critical warnings.

```tsx
// Usage
className="bg-brand-danger text-white" // Delete buttons
className="text-brand-danger" // Error text
```

#### Feedback Colors

Use semantic feedback colors for status communication.

**Success** (Green)
```tsx
// Light backgrounds
className="bg-success-light text-success-dark border border-success"

// Dark backgrounds
className="bg-success-dark text-success-light border border-success"

// Inline text
className="text-success"
```

**Warning** (Amber)
```tsx
className="bg-warning-light text-warning-dark border border-warning"
```

**Error** (Red)
```tsx
className="bg-error-light text-error-dark border border-error"
```

**Info** (Blue)
```tsx
className="bg-info-light text-info-dark border border-info"
```

#### Surface Colors

**Canvas** — Page backgrounds, app chrome
```tsx
className="bg-background-canvas" // Adapts to light/dark mode
```

**Surface** — Cards, elevated panels, dropdowns
```tsx
className="bg-background-surface" // Slight elevation from canvas
```

**Overlay** — Modals, sheets, scrim
```tsx
className="bg-black/60 backdrop-blur-sm" // iOS-style glass
```

#### Text Hierarchy

```tsx
// Headings (high contrast, attention-grabbing)
className="text-text-heading"

// Body text (comfortable reading)
className="text-text-body"

// Secondary text (labels, metadata)
className="text-text-muted"

// Links (interactive, brand-colored)
className="text-text-link hover:text-text-link/80"
```

#### Borders

```tsx
// Default borders (subtle, non-distracting)
className="border-border-default"

// Focus rings (high visibility, solar lime)
className="ring-2 ring-border-focus ring-offset-2"
```

### Typography

#### Font Stack

**Headings** — Satoshi/Clash Display
Modern geometric sans. High x-height. Excellent readability at all sizes.

**Body** — Inter
Workhorse text font. Optimized for screens. Extensive character set.

**Accent** — IBM Plex Sans
Technical details, code-like elements.

**Serif** — Crimson Pro
Pull quotes, editorial content.

#### Type Scale

Fluid typography using `clamp()` for responsive sizing without breakpoints.

```tsx
// Display (Hero headings)
className="text-5xl font-bold" // 48px → 64px

// Title (Page headings)
className="text-3xl font-semibold" // 30px → 40px

// Heading (Section headings)
className="text-2xl font-semibold" // 24px → 32px

// Subheading
className="text-xl font-medium" // 20px → 24px

// Body Large
className="text-lg" // 18px → 20px

// Body (Default)
className="text-base" // 16px → 18px

// Body Small
className="text-sm" // 14px → 16px

// Caption
className="text-xs text-text-muted" // 12px → 14px
```

#### Line Height

```tsx
// Tight (Headings)
className="leading-tight" // 1.1

// Normal (Body)
className="leading-normal" // 1.5 (default)

// Relaxed (Long-form)
className="leading-relaxed" // 1.75
```

#### Font Weight

```tsx
className="font-normal"    // 400 - Body text
className="font-medium"    // 500 - Emphasis
className="font-semibold"  // 600 - Subheadings
className="font-bold"      // 700 - Headings
```

### Spacing

#### 4px Baseline Grid

All spacing must use multiples of 4. Creates visual rhythm and alignment.

```tsx
// Common spacing values
0    // 0px
1    // 4px   - Tight internal padding
2    // 8px   - Default gap between related elements
3    // 12px  - Comfortable internal padding
4    // 16px  - Standard padding/margin
6    // 24px  - Section spacing
8    // 32px  - Major section breaks
12   // 48px  - Page-level spacing
16   // 64px  - Hero spacing
```

**Usage Examples:**
```tsx
// Card internal padding
className="p-6" // 24px all sides

// Stack of elements
className="space-y-4" // 16px vertical gap

// Button padding
className="px-4 py-3" // 16px horizontal, 12px vertical

// Section margins
className="mb-8" // 32px bottom margin
```

#### Container Widths

```tsx
// Reading-optimized (prose, forms)
className="max-w-2xl" // 672px

// Standard content
className="max-w-5xl" // 1024px

// Wide layouts (dashboards)
className="max-w-7xl" // 1280px

// Full bleed
className="max-w-full"
```

### Elevation (Shadows)

Use elevation sparingly. More elevation = more cognitive load.

```tsx
// Subtle (Default cards)
className="shadow-premium"
// → 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)

// Medium (Hover states, dropdowns)
className="shadow-premium-lg"
// → 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)

// Strong (Modals, high-priority overlays)
className="shadow-premium-xl"
// → 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)

// No shadow (Flush elements)
className="shadow-none"
```

**Hover Progression:**
```tsx
className="shadow-premium hover:shadow-premium-lg transition-shadow duration-150"
```

### Border Radius

Consistent rounding creates cohesive visual language.

```tsx
// Sharp (Data tables, technical UI)
className="rounded-none" // 0

// Subtle (Small buttons, badges)
className="rounded-md" // 8px

// Default (Cards, panels)
className="rounded-lg" // 16px

// Prominent (Hero cards, features)
className="rounded-2xl" // 24px

// Circular (Avatars, icons)
className="rounded-full" // 9999px
```

**Consistency Rules:**
- Buttons: `rounded-md` (8px)
- Input fields: `rounded-md` (8px)
- Cards: `rounded-lg` (16px)
- Modal containers: `rounded-2xl` (24px)
- Badges/pills: `rounded-full`

### Motion

#### Philosophy

Motion should feel physical, not digital. Objects have weight. Transitions have momentum.

#### Duration Scale

```tsx
// Instant (Micro-interactions)
className="duration-[50ms]"  // Checkbox toggle, switch

// Fast (Interactive feedback)
className="duration-150"      // Hover states, focus rings

// Base (Standard transitions)
className="duration-200"      // Color changes, opacity

// Deliberate (Complex animations)
className="duration-300"      // Layout shifts, accordion
```

#### Easing

```tsx
// Default (Most transitions)
// Uses Tailwind's default ease-in-out

// Gentle spring (Premium feel)
className="ease-[cubic-bezier(0.2,0.8,0.2,1)]"

// Sharp entry (Appears quickly, exits slowly)
className="ease-out"

// Sharp exit (Appears slowly, exits quickly)
className="ease-in"
```

#### Transition Properties

Always specify what's transitioning. Avoid `transition-all` (performance).

```tsx
// Color changes
className="transition-colors duration-150"

// Shadow changes
className="transition-shadow duration-150"

// Transform (scale, translate)
className="transition-transform duration-150"

// Opacity
className="transition-opacity duration-200"

// Multiple properties (use sparingly)
className="transition-[background,border-color,box-shadow] duration-150"
```

#### Interaction Patterns

**Hover (Desktop)**
```tsx
// Lift (Cards, buttons)
className="hover:-translate-y-0.5 transition-transform duration-150"

// Darken (Primary buttons)
className="hover:bg-brand-primary/90 transition-colors duration-150"

// Lighten (Dark buttons)
className="hover:bg-white/10 transition-colors duration-150"

// Shadow increase
className="hover:shadow-premium-lg transition-shadow duration-150"
```

**Active/Press States**
```tsx
// Scale down (Tactile feedback)
className="active:scale-[0.98] transition-transform duration-[50ms]"

// Opacity reduction
className="active:opacity-80 transition-opacity duration-[50ms]"
```

**Focus States**
```tsx
// Always include visible focus ring
className="focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
```

#### Reduced Motion

Respect user preferences. Disable animations for motion-sensitive users.

```tsx
// Conditional animation
className="motion-safe:animate-fade-in"

// Reduced motion alternative
className="motion-reduce:transition-none"
```

---

## Component Patterns

### Buttons

#### Primary Button (Main Actions)

```tsx
<button className={cn(
  // Base styles
  "inline-flex items-center justify-center",
  "rounded-md font-medium text-sm",

  // Sizing (WCAG AAA: 48px minimum)
  "h-12 px-4",

  // Colors
  "bg-brand-primary text-white",

  // Interactive states
  "hover:bg-brand-primary/90",
  "active:scale-[0.98]",

  // Focus (keyboard navigation)
  "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",

  // Disabled state
  "disabled:opacity-50 disabled:pointer-events-none",

  // Motion
  "transition-colors duration-150"
)}>
  Submit
</button>
```

#### Secondary Button (Alternative Actions)

```tsx
<button className={cn(
  "inline-flex items-center justify-center",
  "rounded-md font-medium text-sm",
  "h-12 px-4",

  // Different visual weight
  "border border-border-default",
  "bg-background-surface text-text-body",
  "hover:bg-background-canvas",

  "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",
  "disabled:opacity-50 disabled:pointer-events-none",
  "transition-colors duration-150"
)}>
  Cancel
</button>
```

#### Ghost Button (Tertiary Actions)

```tsx
<button className={cn(
  "inline-flex items-center justify-center",
  "rounded-md font-medium text-sm",
  "h-12 px-4",

  "text-text-body",
  "hover:bg-background-surface",

  "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",
  "transition-colors duration-150"
)}>
  Learn More
</button>
```

#### Destructive Button

```tsx
<button className={cn(
  "inline-flex items-center justify-center",
  "rounded-md font-medium text-sm",
  "h-12 px-4",

  "bg-brand-danger text-white",
  "hover:bg-brand-danger/90",

  "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",
  "transition-colors duration-150"
)}>
  Delete
</button>
```

#### Icon Button

```tsx
<button className={cn(
  "inline-flex items-center justify-center",
  "rounded-md",

  // Square touch target
  "h-12 w-12",

  "text-text-body",
  "hover:bg-background-surface",

  "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",
  "transition-colors duration-150"
)}>
  <Icon className="h-5 w-5" />
</button>
```

### Cards

#### Standard Card

```tsx
<article className={cn(
  // Container
  "rounded-lg",
  "border border-border-default",
  "bg-background-surface",

  // Elevation
  "shadow-premium",

  // Padding
  "p-6",

  // Interactive (if clickable)
  "hover:shadow-premium-lg",
  "transition-shadow duration-150"
)}>
  <h3 className="text-lg font-semibold text-text-heading mb-2">
    Card Title
  </h3>
  <p className="text-sm text-text-muted">
    Card description text.
  </p>
</article>
```

#### Interactive Card (Clickable)

```tsx
<Link href="/farm/slug" className={cn(
  "block rounded-lg",
  "border border-border-default",
  "bg-background-surface",
  "shadow-premium",
  "p-6",

  // Hover states
  "hover:shadow-premium-lg",
  "hover:border-brand-primary/20",

  // Focus
  "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",

  // Motion
  "transition-[shadow,border-color] duration-150",

  // Group for child hover effects
  "group"
)}>
  <h3 className="text-lg font-semibold text-text-heading group-hover:text-brand-primary transition-colors duration-150">
    Interactive Card
  </h3>
</Link>
```

#### Feature Card (Hero Style)

```tsx
<div className={cn(
  "rounded-2xl", // More prominent radius
  "border border-border-default",
  "bg-gradient-to-br from-background-surface to-background-canvas",
  "shadow-premium-lg",
  "p-8" // More generous padding
)}>
  {/* Content */}
</div>
```

### Input Fields

#### Text Input

```tsx
<input
  type="text"
  className={cn(
    // Sizing (48px minimum)
    "h-12 px-3",
    "w-full",

    // Appearance
    "rounded-md",
    "border border-border-default",
    "bg-background-canvas",

    // Typography
    "text-sm text-text-body",
    "placeholder:text-text-muted",

    // Focus state
    "focus:outline-none",
    "focus:ring-2 focus:ring-border-focus",
    "focus:border-transparent",

    // Disabled state
    "disabled:opacity-50 disabled:cursor-not-allowed",

    // Motion
    "transition-[border-color,box-shadow] duration-150"
  )}
  placeholder="Enter text..."
/>
```

#### Select Dropdown

```tsx
<select className={cn(
  "h-12 px-3 pr-10", // Extra right padding for chevron
  "w-full",
  "rounded-md",
  "border border-border-default",
  "bg-background-canvas",
  "text-sm text-text-body",
  "focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent",
  "transition-[border-color,box-shadow] duration-150",

  // Custom appearance
  "appearance-none",
  "bg-[url('data:image/svg+xml;base64,...')] bg-no-repeat bg-right"
)}>
  <option>Select option</option>
</select>
```

#### Checkbox

```tsx
<label className="inline-flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    className={cn(
      // Size (minimum 24px for WCAG AA)
      "h-6 w-6",

      // Appearance
      "rounded-md",
      "border-2 border-border-default",

      // Checked state
      "checked:bg-brand-primary checked:border-brand-primary",

      // Focus
      "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",

      // Motion
      "transition-colors duration-[50ms]"
    )}
  />
  <span className="text-sm text-text-body">
    Accept terms
  </span>
</label>
```

### Badges

```tsx
// Success badge
<span className={cn(
  "inline-flex items-center gap-1",
  "px-2 py-0.5",
  "rounded-full",
  "bg-success-light text-success-dark",
  "border border-success",
  "text-xs font-medium"
)}>
  <CheckCircle className="h-3 w-3" />
  Verified
</span>

// Info badge
<span className={cn(
  "inline-flex items-center gap-1",
  "px-2 py-0.5",
  "rounded-full",
  "bg-info-light text-info-dark",
  "border border-info",
  "text-xs font-medium"
)}>
  <Info className="h-3 w-3" />
  New
</span>
```

### Modals & Overlays

#### Modal Container

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div
    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
    onClick={onClose}
  />

  {/* Modal */}
  <div className={cn(
    "relative z-10",
    "max-w-lg w-full",
    "rounded-2xl",
    "border border-border-default",
    "bg-background-canvas",
    "shadow-premium-xl",
    "p-6",

    // Animation
    "animate-in fade-in-0 zoom-in-95 duration-200"
  )}>
    {/* Modal content */}
  </div>
</div>
```

### Empty States

```tsx
<div className="flex flex-col items-center justify-center p-12 text-center">
  {/* Icon container */}
  <div className={cn(
    "flex items-center justify-center",
    "w-16 h-16",
    "rounded-full",
    "bg-background-surface",
    "mb-4"
  )}>
    <Icon className="w-8 h-8 text-text-muted" />
  </div>

  {/* Heading */}
  <h3 className="text-lg font-semibold text-text-heading mb-2">
    No farms found
  </h3>

  {/* Description */}
  <p className="text-sm text-text-muted max-w-sm mb-6">
    Try adjusting your search or filters to find what you're looking for.
  </p>

  {/* Primary action */}
  <button className={cn(
    "inline-flex items-center justify-center",
    "h-12 px-6",
    "rounded-md",
    "bg-brand-primary text-white",
    "hover:bg-brand-primary/90",
    "focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",
    "transition-colors duration-150"
  )}>
    Clear filters
  </button>
</div>
```

### Loading States

#### Skeleton

```tsx
<div className="space-y-4">
  {/* Title skeleton */}
  <div className="h-8 w-48 bg-background-surface rounded animate-pulse" />

  {/* Paragraph skeletons */}
  <div className="space-y-2">
    <div className="h-4 bg-background-surface rounded animate-pulse" />
    <div className="h-4 w-5/6 bg-background-surface rounded animate-pulse" />
  </div>
</div>
```

#### Spinner

```tsx
<div className="flex items-center justify-center p-8">
  <div className={cn(
    "w-8 h-8",
    "border-2 border-border-default",
    "border-t-brand-primary",
    "rounded-full",
    "animate-spin"
  )} />
</div>
```

---

## Accessibility Standards

### Touch Targets

**WCAG AAA Requirement: 48×48px minimum**

All interactive elements must meet this standard.

```tsx
// ❌ FAIL: Too small
<button className="h-10 w-10">

// ✅ PASS: Meets standard
<button className="h-12 w-12">
```

For small visual elements, expand hitbox with padding:

```tsx
<button className="p-3"> {/* Creates 48px+ hitbox */}
  <Icon className="h-4 w-4" /> {/* Small visual */}
</button>
```

### Color Contrast

**WCAG AA Minimum Ratios:**
- Normal text: 4.5:1
- Large text (18px+): 3:1
- Interactive elements: 3:1

Test with browser DevTools or online tools.

```tsx
// ✅ PASS: High contrast
className="bg-background-canvas text-text-body" // ~16:1

// ⚠️ CHECK: May fail on some backgrounds
className="text-text-muted" // Ensure 4.5:1 on your canvas

// ❌ FAIL: Insufficient contrast
className="text-gray-400 on bg-gray-300" // ~2:1
```

### Focus Indicators

**Required on all interactive elements.**

```tsx
// ✅ Standard focus ring
className="focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"

// ✅ Custom focus style
className="focus:outline-none focus:border-brand-primary focus:shadow-[0_0_0_3px_rgba(212,255,79,0.5)]"

// ❌ NEVER: No visible focus
className="focus:outline-none" // Without replacement
```

### Keyboard Navigation

**Tab Order:**
- Interactive elements in logical sequence
- Skip links for main content
- Trapped focus in modals

```tsx
// Modal with focus trap
useEffect(() => {
  if (isOpen) {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements?.[0] as HTMLElement
    firstElement?.focus()
  }
}, [isOpen])
```

### Screen Readers

**Semantic HTML + ARIA when needed**

```tsx
// ✅ Semantic button
<button onClick={handleClick}>Submit</button>

// ✅ Icon button with label
<button aria-label="Close modal">
  <X className="h-5 w-5" />
</button>

// ✅ Loading state
<button aria-busy="true" disabled>
  <Spinner />
  Loading...
</button>

// ✅ Expanded state
<button
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
>
  Options
</button>
```

### Reduced Motion

```tsx
// Respect user preferences
<div className={cn(
  "motion-safe:animate-fade-in",
  "motion-reduce:opacity-100" // Instant appearance
)}>
  Content
</div>
```

---

## Responsive Design

### Mobile-First Approach

Default styles = mobile. Breakpoints = progressive enhancement.

```tsx
// ❌ WRONG: Desktop-first
<div className="grid-cols-4 md:grid-cols-2 sm:grid-cols-1">

// ✅ CORRECT: Mobile-first
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

### Breakpoints

```
xs:  320px  // iPhone SE
sm:  375px  // iPhone 13 (most common)
md:  768px  // iPad
lg:  1024px // Desktop
xl:  1280px // Large desktop
2xl: 1536px // Ultra-wide
```

### Touch Optimization

```tsx
// Increase tap area on mobile
<button className={cn(
  "h-12 px-4",      // Desktop
  "sm:h-14 sm:px-6" // Larger on mobile
)}>
```

### Safe Areas (iOS Notch)

```tsx
// Respect iOS safe areas
className="pb-safe-bottom" // env(safe-area-inset-bottom)
className="pt-safe-top"    // env(safe-area-inset-top)
```

---

## Performance Patterns

### Lazy Loading

```tsx
// Images
<img
  src={url}
  loading="lazy"
  className="..."
/>

// Components
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

### Skeleton States

Better than spinners. Show structure immediately.

```tsx
{isLoading ? (
  <CardSkeleton />
) : (
  <Card data={data} />
)}
```

### Optimistic UI

Update UI immediately, rollback on error.

```tsx
const handleLike = async () => {
  // Update UI immediately
  setIsLiked(true)

  try {
    await api.like(farmId)
  } catch (error) {
    // Rollback on error
    setIsLiked(false)
    toast.error('Failed to like farm')
  }
}
```

---

## Code Quality Standards

### Component Variant Architecture

Use `class-variance-authority` for typed variants:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  // Base styles (always applied)
  [
    'inline-flex items-center justify-center',
    'rounded-md font-medium',
    'focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'transition-colors duration-150'
  ],
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
        secondary: 'border border-border-default bg-background-surface hover:bg-background-canvas',
        ghost: 'text-text-body hover:bg-background-surface'
      },
      size: {
        sm: 'h-10 px-3 text-xs',
        md: 'h-12 px-4 text-sm',
        lg: 'h-14 px-6 text-base'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ variant, size, className, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

### Class Merging

Use `tailwind-merge` to handle conflicts:

```tsx
import { cn } from '@/lib/utils'

// cn = clsx + tailwind-merge
<div className={cn(
  'bg-red-500',  // Will be overridden
  'bg-blue-500'  // This wins
)} />
```

### Conditional Classes

```tsx
// ✅ CORRECT: Using cn()
className={cn(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class'
)}

// ❌ WRONG: Template literals (no deduplication)
className={`base-class ${isActive ? 'active-class' : ''}`}
```

---

## Anti-Patterns to Avoid

### ❌ Hardcoded Colors

```tsx
// WRONG
<div className="bg-green-100 text-green-700">

// CORRECT
<div className="bg-success-light text-success-dark">
```

### ❌ Arbitrary Values Without Justification

```tsx
// WRONG: Breaking the system
<div className="p-[13px] rounded-[9px]">

// CORRECT: Use system values
<div className="p-3 rounded-lg">
```

### ❌ Insufficient Touch Targets

```tsx
// WRONG: Too small
<button className="h-8 w-8">

// CORRECT: 48px minimum
<button className="h-12 w-12">
```

### ❌ Missing Focus States

```tsx
// WRONG
<button className="bg-brand-primary">

// CORRECT
<button className="bg-brand-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2">
```

### ❌ Using `transition-all`

```tsx
// WRONG: Performance impact
<div className="transition-all">

// CORRECT: Specific properties
<div className="transition-colors duration-150">
```

### ❌ Ignoring Dark Mode

```tsx
// WRONG: Only works in light mode
<div className="bg-white text-gray-900">

// CORRECT: Semantic tokens adapt
<div className="bg-background-canvas text-text-body">
```

---

## Design Review Checklist

Before shipping any UI changes:

**Visual Design**
- [ ] All colors use semantic tokens (no `bg-green-100`)
- [ ] Spacing follows 4px grid (no `p-[13px]`)
- [ ] Border radius is consistent (`rounded-md`, `rounded-lg`, etc.)
- [ ] Shadows use premium variants (`shadow-premium`, etc.)
- [ ] Typography uses type scale (no arbitrary sizes)

**Accessibility**
- [ ] All interactive elements ≥48×48px (WCAG AAA)
- [ ] Color contrast ≥4.5:1 for text (WCAG AA)
- [ ] Focus rings visible on all interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader labels present (`aria-label`, etc.)
- [ ] Reduced motion respected (`motion-safe:`, `motion-reduce:`)

**Interaction Design**
- [ ] Hover states provide feedback (`:hover`)
- [ ] Active/press states feel tactile (`:active`)
- [ ] Loading states prevent layout shift (skeletons > spinners)
- [ ] Error states are clear and actionable
- [ ] Success feedback is instant (optimistic UI)

**Performance**
- [ ] Images lazy-load (`loading="lazy"`)
- [ ] Heavy components code-split (`React.lazy()`)
- [ ] Transitions specify properties (no `transition-all`)
- [ ] No console errors or warnings

**Responsive Design**
- [ ] Mobile-first approach (default = mobile)
- [ ] Touch targets larger on mobile (`sm:h-14`)
- [ ] Safe areas respected (`pb-safe-bottom`)
- [ ] Tested on actual devices (not just DevTools)

**Dark Mode**
- [ ] All colors use semantic tokens
- [ ] Components tested in dark mode
- [ ] Images/icons have dark mode variants if needed

---

## Tools & Resources

### Linting & Formatting

**Run before committing:**
```bash
# Check for violations
pnpm lint

# Auto-fix formatting + order Tailwind classes
pnpm prettier --write src/
```

**VSCode Extensions:**
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

### Testing Tools

**Accessibility:**
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation

**Color Contrast:**
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools > Inspect > Accessibility

**Performance:**
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Built into Chrome
- [Web Vitals](https://web.dev/vitals/) - Performance metrics

### Design References

**Inspiration:**
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Vercel Design](https://vercel.com/design)
- [Linear App](https://linear.app/)
- [Stripe Docs](https://stripe.com/docs)

**Component Libraries:**
- [Radix UI](https://www.radix-ui.com/) - Unstyled primitives
- [shadcn/ui](https://ui.shadcn.com/) - Design system reference

---

## Updates & Versioning

**Current Version:** 1.0
**Last Updated:** 2026-01-18

**Changelog:**
- 2026-01-18: Initial design system documentation
- Semantic color token system
- 48px touch target standard
- Apple-level component patterns

**Future Considerations:**
- Animation library integration (Framer Motion patterns)
- Component storybook
- Design token JSON export
- Figma design kit sync

---

## Questions?

For design questions or clarifications:
1. Check this document first
2. Review existing components in `src/components/ui/`
3. Reference the product audit in `docs/assistant/godtier-ledger.md`
4. Ask in pull request reviews

**Remember:** Good design is invisible. If users notice the design instead of completing their task, we've failed.
