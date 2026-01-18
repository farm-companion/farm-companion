/**
 * Farm Companion Design Tokens
 * Mobile-first, god-tier design system
 *
 * Guidelines:
 * - All sizes use fluid scaling (clamp)
 * - Touch targets minimum 48x48px
 * - Colors earthy and trustworthy
 * - Typography scales responsively
 */

export const tokens = {
  // Colors - Earthy, farm-friendly palette
  colors: {
    primary: {
      50: '#f0f9f4',
      100: '#dcf3e4',
      200: '#bae7ca',
      300: '#8dd6ab',
      400: '#5cbf88',
      500: '#2d5016', // Main green (keeping existing brand)
      600: '#234013',
      700: '#1d3310',
      800: '#18260d',
      900: '#1a2f0e',
    },
    secondary: {
      50: '#fef2ee',
      100: '#fde4dc',
      200: '#fbc9b9',
      300: '#f9ae96',
      400: '#f79373',
      500: '#c1522a', // Terracotta
      600: '#9a4222',
      700: '#733119',
      800: '#4d2111',
      900: '#261008',
    },
    accent: {
      50: '#fef9ed',
      100: '#fdf3db',
      200: '#fbe7b7',
      300: '#f9db93',
      400: '#f7cf6f',
      500: '#f0a83e', // Golden harvest
      600: '#c08632',
      700: '#906525',
      800: '#604319',
      900: '#30220c',
    },
    neutral: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#71717a',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#27272a',
      950: '#0c0a09',
    },
    // Semantic colors
    success: {
      light: '#10b981',
      DEFAULT: '#059669',
      dark: '#047857',
    },
    warning: {
      light: '#f59e0b',
      DEFAULT: '#d97706',
      dark: '#b45309',
    },
    error: {
      light: '#ef4444',
      DEFAULT: '#dc2626',
      dark: '#b91c1c',
    },
    info: {
      light: '#3b82f6',
      DEFAULT: '#2563eb',
      dark: '#1d4ed8',
    },
  },

  // Typography - Fluid, mobile-first sizing
  typography: {
    fontFamily: {
      heading: 'var(--font-fraunces, ui-serif, Georgia, Cambria, "Times New Roman", Times, serif)',
      body: 'var(--font-inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
    fontSize: {
      // Fluid scaling using clamp(min, preferred, max)
      xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',      // 12px -> 14px
      sm: 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',       // 14px -> 16px
      base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',      // 16px -> 18px
      lg: 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',    // 18px -> 20px
      xl: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',        // 20px -> 24px
      '2xl': 'clamp(1.5rem, 1.35rem + 0.75vw, 2rem)',       // 24px -> 32px
      '3xl': 'clamp(1.875rem, 1.65rem + 1.125vw, 2.5rem)',  // 30px -> 40px
      '4xl': 'clamp(2.25rem, 1.95rem + 1.5vw, 3rem)',       // 36px -> 48px
      '5xl': 'clamp(3rem, 2.5rem + 2.5vw, 4rem)',           // 48px -> 64px
      '6xl': 'clamp(3.75rem, 3rem + 3.75vw, 5rem)',         // 60px -> 80px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // Spacing - 8px base, mobile-optimized
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },

  // Touch targets - Mobile-first interaction sizes
  touch: {
    min: '44px',         // iOS minimum
    comfortable: '48px', // Our standard (Android recommended)
    spacious: '56px',    // For primary CTAs
    generous: '64px',    // For important actions
    minSpacing: '8px',   // Minimum space between targets
  },

  // Motion - Smooth, accessible animations
  motion: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      base: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    easing: {
      // Standard material design easings
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
      // Custom easings
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Border radius
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },

  // Shadows - Subtle depth for mobile
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000',
  },

  // Breakpoints - Mobile-first
  breakpoints: {
    xs: '320px',  // iPhone SE
    sm: '375px',  // iPhone 13
    md: '768px',  // iPad
    lg: '1024px', // Desktop
    xl: '1280px', // Large desktop
    '2xl': '1536px', // Extra large
  },

  // Z-index layers
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
    toast: 1700,
  },

  // Container widths
  container: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

// Type exports for TypeScript
export type TokenColors = typeof tokens.colors
export type TokenTypography = typeof tokens.typography
export type TokenSpacing = typeof tokens.spacing
export type TokenTouch = typeof tokens.touch
export type TokenMotion = typeof tokens.motion
export type TokenRadius = typeof tokens.radius
export type TokenShadows = typeof tokens.shadows
export type TokenBreakpoints = typeof tokens.breakpoints
export type TokenZIndex = typeof tokens.zIndex
export type TokenContainer = typeof tokens.container
