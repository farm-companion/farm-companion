# FarmCompanion Design Guidelines

## Philosophy
Apple-level polish with accessibility-first thinking. Every interaction should feel inevitable, not clever.

## Enforcement Strategy

### 1. Required Classes (Always Use These)
Never use raw Tailwind utilities for these. Always use semantic tokens.

#### Colors
```tsx
// ❌ WRONG
<div className="bg-green-100 text-green-700">

// ✅ CORRECT
<div className="bg-success-light text-success-dark">
```

**Brand Colors:**
- `bg-brand-primary` (teal #00C2B2)
- `bg-brand-accent` (solar lime #D4FF4F)
- `bg-brand-danger` (red #FF5A5F)

**Semantic Feedback:**
- Success: `bg-success-light`, `bg-success`, `bg-success-dark`
- Warning: `bg-warning-light`, `bg-warning`, `bg-warning-dark`
- Error: `bg-error-light`, `bg-error`, `bg-error-dark`
- Info: `bg-info-light`, `bg-info`, `bg-info-dark`

**Surfaces:**
- `bg-background-canvas` (page background)
- `bg-background-surface` (cards, elevated elements)

**Text:**
- `text-text-body` (main text)
- `text-text-heading` (headings)
- `text-text-muted` (secondary text)
- `text-text-link` (links)

**Borders:**
- `border-border-default` (standard borders)
- `border-border-focus` (focus rings - solar lime)

#### Touch Targets
All interactive elements MUST meet 48px minimum (WCAG AAA).

```tsx
// ❌ WRONG
<button className="h-10 px-4">

// ✅ CORRECT
<button className="h-12 px-4">
```

**Standard Heights:**
- Small: `h-10` (40px - use sparingly, not for primary actions)
- Medium: `h-12` (48px - DEFAULT for all interactive elements)
- Large: `h-14` (56px - emphasized actions)
- XL: `h-16` (64px - hero CTAs)

#### Shadows
Never use arbitrary shadow values.

```tsx
// ❌ WRONG
<div className="shadow-lg">

// ✅ CORRECT
<div className="shadow-premium">
```

- `shadow-premium` - Cards, subtle elevation
- `shadow-premium-lg` - Hover states, dropdowns
- `shadow-premium-xl` - Modals, dialogs

#### Border Radius
```tsx
// ❌ WRONG
<div className="rounded-xl"> // Only if following design contract

// ✅ CORRECT - Use these specific values
```

- `rounded-md` (8px) - Buttons, badges, small elements
- `rounded-lg` (16px) - Cards, panels
- `rounded-2xl` (24px) - Hero cards only
- `rounded-full` (9999px) - Pills, avatars

#### Spacing
All spacing must use 4px baseline grid.

```tsx
// ❌ WRONG
<div className="p-3.5 gap-7">

// ✅ CORRECT
<div className="p-4 gap-6">
```

Common values: `0`, `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `12` (48px)

### 2. Component Patterns

#### Cards
```tsx
<div className="rounded-lg border border-border-default bg-background-surface shadow-premium p-6 hover:shadow-premium-lg transition-shadow duration-150">
```

#### Buttons (Primary)
```tsx
<button className="h-12 px-4 rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2">
```

#### Buttons (Secondary)
```tsx
<button className="h-12 px-4 rounded-md border border-border-default bg-background-surface text-text-body hover:bg-background-canvas transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2">
```

#### Input Fields
```tsx
<input className="h-12 px-3 rounded-md border border-border-default bg-background-canvas text-text-body placeholder:text-text-muted focus:ring-2 focus:ring-border-focus focus:border-transparent outline-none transition-all" />
```

#### Badges (Success)
```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success-light text-success-dark border border-success text-xs">
```

#### Empty States
```tsx
<div className="flex flex-col items-center justify-center p-12">
  <div className="w-16 h-16 rounded-full bg-background-surface flex items-center justify-center mb-4">
    <Icon className="w-8 h-8 text-text-muted" />
  </div>
  <h3 className="text-lg font-semibold text-text-heading mb-2">Empty State Title</h3>
  <p className="text-sm text-text-muted mb-6">Description of what's missing</p>
  <button className="h-12 px-6 rounded-md bg-brand-primary text-white">Primary Action</button>
</div>
```

### 3. Motion & Transitions

All transitions must use `transition-{property} duration-{timing}`.

**Durations:**
- `duration-150` (fast) - Hover states, focus
- `duration-200` (base) - Default transitions
- `duration-300` (slow) - Complex animations

**Properties:**
- `transition-colors` - Background, text, border color changes
- `transition-shadow` - Shadow changes on hover
- `transition-transform` - Scale, translate
- `transition-all` - Only when multiple properties change together

**Easing:**
- Default Tailwind easing is fine for most cases
- For custom: `ease-[cubic-bezier(0.2,0.8,0.2,1)]` (gentle spring)

### 4. Accessibility Requirements

#### Focus States
ALL interactive elements must have visible focus rings.

```tsx
focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2
```

#### Color Contrast
- Body text on canvas: WCAG AA minimum (4.5:1)
- Heading text: AAA preferred (7:1)
- Test with dark mode enabled

#### Reduced Motion
Respect `prefers-reduced-motion`:

```tsx
<div className="motion-safe:animate-fade-in">
```

### 5. Responsive Design

Mobile-first approach. Default styles = mobile, breakpoints = progressive enhancement.

```tsx
// ❌ WRONG (desktop-first)
<div className="grid-cols-4 md:grid-cols-2 sm:grid-cols-1">

// ✅ CORRECT (mobile-first)
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

**Breakpoints:**
- `xs: 320px` - iPhone SE
- `sm: 375px` - iPhone 13
- `md: 768px` - Tablets
- `lg: 1024px` - Desktop
- `xl: 1280px` - Large desktop

### 6. Dark Mode

Use semantic tokens exclusively. They auto-adapt.

```tsx
// ❌ WRONG
<div className="bg-white dark:bg-gray-900">

// ✅ CORRECT
<div className="bg-background-canvas">
```

## Linting Rules (Manual Enforcement)

Until automated linting is added, code reviewers must check:

1. ✅ No hardcoded hex colors in className strings
2. ✅ No `bg-green-*`, `bg-blue-*`, `bg-red-*` (use semantic)
3. ✅ No `bg-white` or `bg-black` (use semantic)
4. ✅ All buttons are `h-12` minimum (unless sm variant with justification)
5. ✅ All inputs are `h-12`
6. ✅ All focus states use `ring-border-focus`
7. ✅ All shadows use `shadow-premium` variants
8. ✅ All transitions specify property + duration

## Future: Automated Enforcement

Add to package.json:
```json
{
  "devDependencies": {
    "eslint-plugin-tailwindcss": "^3.x",
    "stylelint": "^16.x",
    "stylelint-config-tailwindcss": "^x"
  }
}
```

Configure `.eslintrc.json`:
```json
{
  "plugins": ["tailwindcss"],
  "rules": {
    "tailwindcss/no-custom-classname": "warn",
    "tailwindcss/classnames-order": "warn"
  }
}
```

## Component Library Standard

When creating new components, use CVA for variants:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
        secondary: 'border border-border-default bg-background-surface hover:bg-background-canvas'
      },
      size: {
        md: 'h-12 px-4',
        lg: 'h-14 px-6'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)
```

## Common Violations & Fixes

### Violation 1: Hardcoded Green for Success
```tsx
// ❌ BEFORE
<span className="bg-green-100 text-green-700">Verified</span>

// ✅ AFTER
<span className="bg-success-light text-success-dark">Verified</span>
```

### Violation 2: Button Too Small
```tsx
// ❌ BEFORE
<button className="h-10 px-4">Submit</button>

// ✅ AFTER
<button className="h-12 px-4">Submit</button>
```

### Violation 3: No Focus Ring
```tsx
// ❌ BEFORE
<button className="bg-brand-primary text-white">Submit</button>

// ✅ AFTER
<button className="bg-brand-primary text-white focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2">Submit</button>
```

### Violation 4: Arbitrary Shadow
```tsx
// ❌ BEFORE
<div className="shadow-xl">

// ✅ AFTER
<div className="shadow-premium-xl">
```

### Violation 5: Wrong Border Radius
```tsx
// ❌ BEFORE (inconsistent with design system)
<div className="rounded-2xl"> // Unless it's a hero card

// ✅ AFTER
<div className="rounded-lg"> // Cards use lg (16px)
```

## Design Review Checklist

Before merging any PR with UI changes:

- [ ] All colors use semantic tokens
- [ ] All interactive elements ≥48px height
- [ ] All focus states have visible rings
- [ ] All transitions specify duration
- [ ] All shadows use premium variants
- [ ] Dark mode works (semantic tokens auto-handle)
- [ ] Mobile-first responsive approach
- [ ] WCAG AA contrast verified
- [ ] Reduced motion respected
- [ ] No console errors in browser

## Reference

- Design Tokens: `farm-frontend/tailwind.config.js`
- Component Library: `farm-frontend/src/components/ui/`
- Product Audit: `docs/assistant/godtier-ledger.md`
