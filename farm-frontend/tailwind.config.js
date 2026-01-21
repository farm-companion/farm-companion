/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Mobile-First Breakpoints (updated for true mobile-first)
      screens: {
        'xs': '320px',    // iPhone SE
        'sm': '375px',    // iPhone 13 (most common)
        'md': '768px',    // Tablets
        'lg': '1024px',   // Desktop
        'xl': '1280px',   // Large desktop
        '2xl': '1536px',  // Extra large
      },
      
      // PuredgeOS Brand Colors - Premium Quality
      colors: {
        // Core Brand Palette
        obsidian: '#1E1F23',
        serum: '#00C2B2',
        sandstone: '#E4E2DD',
        solar: '#D4FF4F',
        midnight: '#121D2B',
        
        // Semantic color aliases
        'brand-primary': '#00C2B2',
        'brand-accent': '#D4FF4F',
        'brand-danger': '#FF5A5F',

        // Primary color scale (mapped to serum brand color)
        // Used by components as primary-500, primary-600, etc.
        primary: {
          50: '#E6F9F7',   // Lightest tint
          100: '#CCF3EF',  // Very light
          200: '#99E7DF',  // Light
          300: '#66DBCF',  // Medium light
          400: '#33CFBF',  // Medium
          500: '#00C2B2',  // DEFAULT (serum brand color)
          600: '#009B8F',  // Medium dark
          700: '#00746B',  // Dark
          800: '#004D48',  // Very dark
          900: '#002624',  // Darkest
        },

        // Secondary color scale (mapped to solar accent color)
        // Used for accent elements, CTAs, highlights
        secondary: {
          50: '#FEFFF0',   // Lightest tint
          100: '#FDFFDB',  // Very light
          200: '#F9FFB7',  // Light
          300: '#E8FF7F',  // Medium light
          400: '#DDFF67',  // Medium
          500: '#D4FF4F',  // DEFAULT (solar brand color)
          600: '#AACC3F',  // Medium dark
          700: '#80992F',  // Dark
          800: '#55661F',  // Very dark
          900: '#2B3310',  // Darkest
        },

        // Neutral gray scale (for components)
        // Replaces hardcoded gray-{n} with semantic neutral-{n}
        neutral: {
          50: '#FAFAFA',   // Lightest
          100: '#F5F5F5',  // Very light
          200: '#E5E5E5',  // Light backgrounds
          300: '#D4D4D4',  // Light borders
          400: '#A3A3A3',  // Muted text/icons
          500: '#737373',  // Medium text
          600: '#525252',  // Body text
          700: '#404040',  // Dark text
          800: '#262626',  // Very dark text
          900: '#171717',  // Darkest
        },

        // Semantic feedback colors (god-tier design system)
        success: {
          light: '#D1FAE5',
          DEFAULT: '#10B981',
          dark: '#065F46'
        },
        warning: {
          light: '#FEF3C7',
          DEFAULT: '#F59E0B',
          dark: '#92400E'
        },
        error: {
          light: '#FEE2E2',
          DEFAULT: '#EF4444',
          dark: '#991B1B'
        },
        info: {
          light: '#DBEAFE',
          DEFAULT: '#3B82F6',
          dark: '#1E40AF'
        },
        
        // Background colors
        'background-canvas': 'var(--background-canvas)',
        'background-surface': 'var(--background-surface)',
        
        // Text colors
        'text-body': 'var(--text-body)',
        'text-heading': 'var(--text-heading)',
        'text-muted': 'var(--text-muted)',
        'text-link': 'var(--text-link)',
        
        // Border colors
        'border-default': 'var(--border-default)',
        'border-focus': 'var(--border-focus)',
      },
      
      // Modern Swiss Minimalism Typography - Awwwards-grade clarity
      fontFamily: {
        'primary': ['var(--font-primary)', 'system-ui', '-apple-system', 'sans-serif'],
        'body': ['var(--font-body)', 'system-ui', '-apple-system', 'sans-serif'],
        'accent': ['var(--font-accent)', 'system-ui', '-apple-system', 'sans-serif'],
        'serif': ['var(--font-serif)', 'Georgia', 'Cambria', 'serif'],
        // Legacy aliases for backward compatibility
        'heading': ['var(--font-primary)', 'system-ui', '-apple-system', 'sans-serif'],
        // Clash Display specific classes
        'clash': ['Clash Display', 'var(--font-primary)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      
      // Extended font weights for Clash Display
      fontWeight: {
        'extralight': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      
      // Semantic Typography System - Apple-style clarity
      // 5 semantic scales replace 12 arbitrary sizes
      fontSize: {
        // Semantic scales (USE THESE)
        'display': ['clamp(3rem, 2.5rem + 2.5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],     // Hero text: 48px -> 64px
        'heading': ['clamp(1.5rem, 1.35rem + 0.75vw, 2rem)', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }], // Page titles: 24px -> 32px
        'body': ['clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', { lineHeight: '1.6' }],                                                // Main content: 16px -> 18px
        'caption': ['clamp(0.875rem, 0.825rem + 0.25vw, 1rem)', { lineHeight: '1.5' }],                                            // Supporting text: 14px -> 16px
        'small': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],                                             // Fine print: 12px -> 14px

        // Legacy sizes (DEPRECATED - migrate to semantic scales above)
        'xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],      // Use 'small' instead
        'sm': ['clamp(0.875rem, 0.825rem + 0.25vw, 1rem)', { lineHeight: '1.5' }],       // Use 'caption' instead
        'base': ['clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', { lineHeight: '1.6' }],      // Use 'body' instead
        'lg': ['clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)', { lineHeight: '1.6' }],    // Use 'body' or 'heading'
        'xl': ['clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)', { lineHeight: '1.5' }],        // Use 'heading'
        '2xl': ['clamp(1.5rem, 1.35rem + 0.75vw, 2rem)', { lineHeight: '1.4' }],         // Use 'heading'
        '3xl': ['clamp(1.875rem, 1.65rem + 1.125vw, 2.5rem)', { lineHeight: '1.3' }],    // Use 'heading' or 'display'
        '4xl': ['clamp(2.25rem, 1.95rem + 1.5vw, 3rem)', { lineHeight: '1.2' }],         // Use 'display'
        '5xl': ['clamp(3rem, 2.5rem + 2.5vw, 4rem)', { lineHeight: '1.1' }],             // Use 'display'
        '6xl': ['clamp(3.75rem, 3rem + 3.75vw, 5rem)', { lineHeight: '1' }],             // Use 'display'
      },
      
      // 8px baseline grid system - Apple Design Guidelines
      // All spacing values are multiples of 8 for consistent rhythm
      // ENFORCED: Use these values for all padding, margin, gap spacing
      // Arbitrary values like p-[15px] violate the system - use p-2 (16px) or p-3 (24px) instead
      spacing: {
        '0': '0px',       // None
        '0.5': '4px',     // 0.5 unit - Sub-pixel (rare, use sparingly)
        '1': '8px',       // 1 unit - Micro spacing
        '1.5': '12px',    // 1.5 units - Fine spacing
        '2': '16px',      // 2 units - Tight spacing
        '2.5': '20px',    // 2.5 units - Compact spacing
        '3': '24px',      // 3 units - Comfortable spacing
        '3.5': '28px',    // 3.5 units - Relaxed spacing
        '4': '32px',      // 4 units - Section spacing
        '5': '40px',      // 5 units - Component spacing
        '6': '48px',      // 6 units - Touch target / comfortable spacing
        '7': '56px',      // 7 units - Spacious touch target
        '8': '64px',      // 8 units - Generous spacing
        '9': '72px',      // 9 units - Expanded spacing
        '10': '80px',     // 10 units - Large spacing
        '12': '96px',     // 12 units - Section breaks
        '14': '112px',    // 14 units - Large section
        '15': '120px',    // 15 units - Component container
        '16': '128px',    // 16 units - Major sections
        '18': '144px',    // 18 units - Spacious section
        '20': '160px',    // 20 units - Page sections
        '24': '192px',    // 24 units - Hero spacing
        '28': '224px',    // 28 units - Extra large
        '32': '256px',    // 32 units - Maximum spacing
        '40': '320px',    // 40 units - Ultra-wide
        '48': '384px',    // 48 units - Full-width
        '56': '448px',    // 56 units - Extra full-width
        '64': '512px',    // 64 units - Maximum container
      },
      
      // Mobile-first border radius - Premium feel
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'full': '9999px',
      },
      
      // PuredgeOS Motion - Apple-style easing
      transitionDuration: {
        'instant': '50ms',
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
      
      transitionTimingFunction: {
        'gentle-spring': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      
      // Premium shadows
      boxShadow: {
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'premium-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'premium-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      // Touch-specific utilities
      minWidth: {
        'touch': '48px',      // Comfortable touch target
        'touch-ios': '44px',  // iOS minimum
        'touch-spacious': '56px',
      },
      minHeight: {
        'touch': '48px',      // Comfortable touch target
        'touch-ios': '44px',  // iOS minimum
        'touch-spacious': '56px',
      },

      // Safe area insets (for iPhone notch)
      padding: {
        'safe': 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // Minimal animations - Apple philosophy: purposeful motion only
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },

      animation: {
        'fade-in': 'fade-in 250ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      
      // Premium background patterns
      backgroundImage: {
        'pattern-subtle': 'radial-gradient(circle at 30% 20%, rgba(0,194,178,0.03), transparent 50%), radial-gradient(circle at 70% 80%, rgba(212,255,79,0.02), transparent 50%)',
        'pattern-elegant': 'linear-gradient(135deg, rgba(0,194,178,0.02) 0%, transparent 50%), linear-gradient(45deg, rgba(212,255,79,0.01) 0%, transparent 50%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
