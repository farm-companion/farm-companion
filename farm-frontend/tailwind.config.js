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
      
      /* ========================================================================
         OBSIDIAN & KINETIC COLOR SYSTEM - SURPASSES APPLE
         Zinc-based neutrals with Kinetic Cyan & Iris Violet accents
         All colors WCAG AAA compliant (7:1+ contrast)
         ======================================================================== */
      colors: {
        // =======================================================================
        // OBSIDIAN NEUTRALS (Zinc-based - warm undertones)
        // =======================================================================
        obsidian: {
          DEFAULT: '#18181B',  // Zinc 900
          canvas: '#FFFFFF',   // Light mode canvas
          'canvas-dark': '#09090B', // Dark mode canvas (deepest ink)
          surface: '#FAFAFA',  // Zinc 50
          elevated: '#F4F4F5', // Zinc 100
          muted: '#E4E4E7',    // Zinc 200
          border: '#D4D4D8',   // Zinc 300
        },

        // Full Zinc scale (replaces Slate for warmer feel)
        zinc: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',   // WCAG AAA on white (7.2:1)
          700: '#3F3F46',
          800: '#27272A',   // Body text dark (14.2:1)
          900: '#18181B',   // Headings (17.4:1)
          950: '#09090B',   // Deepest ink
        },

        // =======================================================================
        // KINETIC CYAN (Primary - Electric, cutting)
        // =======================================================================
        kinetic: {
          DEFAULT: '#06B6D4', // Cyan 500 - 4.5:1 on white
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',     // Bright for dark mode
          500: '#06B6D4',     // DEFAULT
          600: '#0891B2',     // 5.8:1 on white
          700: '#0E7490',
          800: '#155E75',     // AAA text (8.1:1)
          900: '#164E63',
          glow: 'rgba(6, 182, 212, 0.15)',
        },

        // =======================================================================
        // IRIS VIOLET (Secondary - Depth, sophistication)
        // =======================================================================
        iris: {
          DEFAULT: '#6366F1', // Indigo 500 - 4.5:1 on white
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',     // Bright for dark mode
          500: '#6366F1',     // DEFAULT
          600: '#4F46E5',     // 5.9:1 on white
          700: '#4338CA',
          800: '#3730A3',     // AAA text
          900: '#312E81',
          glow: 'rgba(99, 102, 241, 0.15)',
        },

        // =======================================================================
        // PRIMARY (Now maps to Kinetic Cyan)
        // =======================================================================
        primary: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',     // PRIMARY for buttons (5.8:1)
          700: '#0E7490',
          800: '#155E75',     // AAA text (8.1:1)
          900: '#164E63',
          950: '#083344',
        },

        // =======================================================================
        // LEGACY ALIASES (Backward compatibility)
        // =======================================================================
        serum: {
          DEFAULT: '#06B6D4', // Now Kinetic Cyan
          light: '#22D3EE',
          text: '#155E75',
          dark: '#0891B2',
        },
        sandstone: '#FAFAFA', // Zinc 50
        solar: {
          DEFAULT: '#4d7c0f',
          light: '#84cc16',
          text: '#3f6212',
          dark: '#365314',
        },
        midnight: '#09090B',  // Deepest ink

        // Semantic color aliases
        'brand-primary': 'var(--brand-primary)',
        'brand-accent': 'var(--brand-accent)',
        'brand-danger': '#F43F5E',  // Rose/Ember 500

        // Secondary (Lime) - Vibrant accent scale
        secondary: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
          950: '#1a2e05',
        },

        // Slate (preserved for compatibility, prefer Zinc)
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },

        // =======================================================================
        // SEMANTIC FEEDBACK (Elevated palette - more vibrant)
        // =======================================================================
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',     // Vibrant for dark mode
          500: '#10B981',     // DEFAULT - Emerald
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',     // AAA text (9.8:1)
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#064E3B'
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',     // Vibrant for dark mode
          500: '#F59E0B',     // DEFAULT - Amber
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',     // AAA text (8.2:1)
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#713f12'
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',   // DEFAULT (5.6:1)
          800: '#991b1b',
          900: '#7f1d1d',   // AAA text (9.2:1)
          DEFAULT: '#b91c1c',
          light: '#fee2e2',
          dark: '#7f1d1d'
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',   // DEFAULT (5.5:1)
          800: '#1e40af',
          900: '#1e3a8a',   // AAA text (9.8:1)
          DEFAULT: '#1d4ed8',
          light: '#dbeafe',
          dark: '#1e3a8a'
        },

        // CSS Variable mappings
        'background-canvas': 'var(--background-canvas)',
        'background-surface': 'var(--background-surface)',
        'background-elevated': 'var(--background-elevated)',
        'background-hover': 'var(--background-hover)',

        'text-heading': 'var(--text-heading)',
        'text-body': 'var(--text-body)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',

        'border-default': 'var(--border-default)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'border-focus': 'var(--border-focus)',
      },
      
      // Tri-Typeface Strategy - Instrument Hierarchy
      fontFamily: {
        // Clash Display: Brand & Headlines (bold, industrial)
        'primary': ['var(--font-primary)', 'system-ui', '-apple-system', 'sans-serif'],
        // Manrope: Body & Content (modern, geometric, maximum legibility)
        'body': ['var(--font-body)', 'system-ui', '-apple-system', 'sans-serif'],
        // IBM Plex Sans Condensed: UI Labels & Buttons (tight, functional)
        'accent': ['var(--font-accent)', 'system-ui', '-apple-system', 'sans-serif'],
        // IBM Plex Mono: Data & Metrics (technical, precise, tabular figures)
        'mono': ['var(--font-mono)', 'SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
        // Crimson Pro: Editorial serif
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
      spacing: {
        '0': '0px',       // None
        '1': '8px',       // 1 unit - Micro spacing
        '2': '16px',      // 2 units - Tight spacing
        '3': '24px',      // 3 units - Comfortable spacing
        '4': '32px',      // 4 units - Section spacing
        '5': '40px',      // 5 units - Component spacing
        '6': '48px',      // 6 units - Touch target / comfortable spacing
        '7': '56px',      // 7 units - Spacious touch target
        '8': '64px',      // 8 units - Generous spacing
        '10': '80px',     // 10 units - Large spacing
        '12': '96px',     // 12 units - Section breaks
        '16': '128px',    // 16 units - Major sections
        '20': '160px',    // 20 units - Page sections
        '24': '192px',    // 24 units - Hero spacing
        '28': '224px',    // 28 units - Extra large
        '32': '256px',    // 32 units - Maximum spacing
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
      
      // Apple-style premium shadows
      boxShadow: {
        'none': 'none',
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glass': 'var(--shadow-glass)',
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'premium-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'premium-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'float': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
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
