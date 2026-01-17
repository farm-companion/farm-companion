# Design Tokens

This document describes the design token system for Farm Companion. Design tokens provide a single source of truth for all design decisions including colors, typography, spacing, and motion.

## Overview

Design tokens are defined in `design-tokens.json` and synchronized with the Tailwind configuration. This ensures consistency across the entire application.

## Token Categories

### Colors

#### Brand Colors
- **Primary** (`brand-primary`, `serum`): `#00C2B2` - Main brand color
- **Accent** (`brand-accent`, `solar`): `#D4FF4F` - Highlight and emphasis
- **Danger** (`brand-danger`): `#FF5A5F` - Error and destructive actions

#### Semantic Feedback Colors
Success, warning, error, and info colors each have three shades:
- **Light**: Background tints for alerts and badges
- **Default**: Primary state color for buttons and icons
- **Dark**: Text color for strong emphasis

```tsx
// Usage example
<Alert variant="success">Operation successful</Alert>
<Badge className="bg-warning-light text-warning-dark">Pending</Badge>
```

#### Background Colors
- **Canvas**: Main page background (`background-canvas`)
- **Surface**: Card and component backgrounds (`background-surface`)
- **Overlay**: Modal backdrops

#### Text Colors
- **Body**: Regular paragraph text (`text-body`)
- **Heading**: Headlines and titles (`text-heading`)
- **Muted**: Secondary text (`text-muted`)
- **Link**: Hyperlinks (`text-link`)

### Typography

#### Font Families
- **Primary/Heading**: Satoshi (display) + Inter (fallback)
- **Body**: Inter (optimized for readability)

#### Font Sizes
Enhanced readability scale (larger than typical):
- `xs`: 14px (was 12px)
- `sm`: 16px (was 14px)
- `base`: 18px (was 16px) - Default body text
- `lg`: 20px
- `xl`: 24px
- `2xl`: 30px
- `3xl`: 36px
- `4xl`: 48px
- `5xl`: 60px
- `6xl`: 72px

#### Font Weights
- `regular`: 400
- `medium`: 500
- `bold`: 700

### Spacing

4px baseline grid:
- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `6`: 24px
- `8`: 32px
- `12`: 48px (minimum touch target)

### Border Radius
- `none`: 0
- `sm`: 4px
- `md`: 8px
- `lg`: 16px
- `full`: 9999px (pill shape)

### Elevation (Shadows)
- **Card**: Subtle lift for content cards
- **Modal**: Stronger shadow for overlays
- **Premium**: Apple-style shadow (small)
- **Premium LG**: Medium premium shadow
- **Premium XL**: Large premium shadow for modals

```tsx
// Usage example
<Card className="shadow-premium hover:shadow-premium-lg" />
```

### Motion

#### Duration
- `instant`: 50ms - Micro-interactions
- `fast`: 150ms - Hover states
- `base`: 250ms - Standard transitions
- `slow`: 400ms - Complex animations

#### Easing
- `gentle-spring`: `cubic-bezier(0.2, 0.8, 0.2, 1)` - Apple-style smooth easing
- `in-ease`: Deceleration curve
- `out-ease`: Acceleration curve

```tsx
// Usage example
<Button className="transition-all duration-fast ease-gentle-spring" />
```

### Accessibility

#### Focus Ring
- Width: 2px
- Offset: 2px
- Color: Solar yellow (#D4FF4F)

#### Contrast Ratios
- **AA**: 4.5:1 minimum (normal text)
- **AAA**: 7.0:1 (enhanced contrast)

#### Touch Targets
- **AA**: 24x24px minimum
- **AAA**: 44x44px minimum (recommended)

All interactive elements should use the `.touch-target` class to ensure 44x44px minimum size.

### Breakpoints
- `xs`: 480px - Extra small devices
- `sm`: 640px - Small devices (phones landscape)
- `md`: 768px - Medium devices (tablets)
- `lg`: 1024px - Large devices (laptops)
- `xl`: 1280px - Extra large devices (desktops)
- `2xl`: 1536px - 2X large devices (large desktops)

### Z-Index Layers
- `base`: 1 - Default stacking
- `dropdown`: 1000 - Dropdown menus
- `modal`: 2000 - Modal dialogs
- `tooltip`: 3000 - Tooltips
- `toast`: 4000 - Toast notifications

## Usage Guidelines

### In Components

```tsx
import { cva } from 'class-variance-authority'

// Use design tokens via Tailwind classes
const buttonVariants = cva(
  'rounded-md font-medium transition-colors duration-fast',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
        success: 'bg-success text-white hover:bg-success-dark',
        danger: 'bg-brand-danger text-white hover:bg-brand-danger/90'
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg'
      }
    }
  }
)
```

### In CSS

```css
.custom-element {
  color: var(--text-body);
  background: var(--background-canvas);
  border: 1px solid var(--border-default);
  border-radius: 8px; /* Use token: radius.md */
  padding: 16px; /* Use token: spacing.4 */
  transition: all 150ms cubic-bezier(0.2, 0.8, 0.2, 1); /* duration.fast + easing.gentle-spring */
}
```

### Dark Mode

All color tokens support dark mode automatically via CSS variables. Define light and dark values in design-tokens.json:

```json
{
  "background": {
    "canvas": { "light": "#FFFFFF", "dark": "#1E1F23" }
  }
}
```

## Maintaining Tokens

### Adding New Tokens
1. Add to `design-tokens.json`
2. Update `tailwind.config.js` to sync
3. Document in this file
4. Update relevant components

### Modifying Existing Tokens
⚠️ **Caution**: Changing core tokens affects the entire design system.
1. Verify impact across all components
2. Test in both light and dark modes
3. Check accessibility (contrast ratios)
4. Update documentation

## Best Practices

1. **Use tokens, not hard-coded values**: Prefer `text-body` over `text-gray-900`
2. **Leverage semantic colors**: Use `success`, `warning`, `error`, `info` for feedback
3. **Maintain contrast**: All text must meet WCAG AA standards (4.5:1)
4. **Respect touch targets**: Interactive elements must be at least 44x44px
5. **Use consistent motion**: Stick to defined durations and easing functions
6. **Mobile-first spacing**: Use the 4px baseline grid for consistency

## Resources

- [Design Tokens JSON](./design-tokens.json) - Complete token definitions
- [Tailwind Config](../tailwind.config.js) - Synchronized Tailwind configuration
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility standards
