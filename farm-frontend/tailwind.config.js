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
         HARVEST SEMANTIC COLOR SYSTEM - God-Tier Theming

         Rule: NEVER use raw colors in components (bg-[#F9F7F2], text-zinc-900)
         ALWAYS use semantic classes (bg-background, text-foreground)

         These map to CSS variables that swap based on .dark class
         ======================================================================== */
      colors: {
        // =======================================================================
        // SEMANTIC COLORS (USE THESE IN COMPONENTS)
        // CSS variables are hex colors, so we reference them directly
        // =======================================================================
        background: 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        foreground: 'var(--foreground)',
        'foreground-secondary': 'var(--foreground-secondary)',
        'foreground-muted': 'var(--foreground-muted)',

        card: {
          DEFAULT: 'var(--card)',
          hover: 'var(--card-hover)',
          foreground: 'var(--foreground)',
        },

        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--foreground)',
        },

        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          foreground: 'var(--primary-foreground)',
          // Full scale for gradients
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344',
        },

        secondary: {
          DEFAULT: 'var(--secondary)',
          hover: 'var(--secondary-hover)',
          foreground: 'var(--secondary-foreground)',
          // Full scale
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

        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--foreground-muted)',
        },

        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },

        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },

        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        input: 'var(--input)',
        ring: 'var(--ring)',

        // Feedback states
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        error: {
          DEFAULT: 'var(--error)',
          foreground: 'var(--error-foreground)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
        },

        // =======================================================================
        // PRIMITIVE SCALES (For advanced use only - prefer semantics above)
        // =======================================================================
        // Obsidian Neutrals (Zinc-based)
        obsidian: {
          DEFAULT: '#18181B',
          canvas: '#FFFFFF',
          'canvas-dark': '#0C0A09',
          surface: '#FAFAFA',
          elevated: '#F4F4F5',
          muted: '#E4E4E7',
          border: '#D4D4D8',
        },

        zinc: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },

        // Kinetic Cyan
        kinetic: {
          DEFAULT: '#06B6D4',
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          glow: 'rgba(6, 182, 212, 0.15)',
        },

        // Iris Violet
        iris: {
          DEFAULT: '#6366F1',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          glow: 'rgba(99, 102, 241, 0.15)',
        },

        // Legacy aliases
        serum: {
          DEFAULT: '#06B6D4',
          light: '#22D3EE',
          text: '#155E75',
          dark: '#0891B2',
        },
        sandstone: '#FAFAFA',
        solar: {
          DEFAULT: '#4d7c0f',
          light: '#84cc16',
          text: '#3f6212',
          dark: '#365314',
        },
        midnight: '#0C0A09',

        'brand-primary': 'var(--brand-primary)',
        'brand-accent': 'var(--brand-accent)',
        'brand-danger': '#F43F5E',

        // Slate (compatibility)
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

        // Legacy CSS variable mappings
        'background-canvas': 'var(--background-canvas)',
        'background-surface': 'var(--background-surface)',
        'background-elevated': 'var(--background-elevated)',
        'background-hover': 'var(--background-hover)',
        'text-heading': 'var(--text-heading)',
        'text-body': 'var(--text-body)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        'border-default': 'var(--border-default)',
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
        DEFAULT: 'var(--radius)',
        'md': '8px',
        'lg': 'calc(var(--radius) * 1.5)',
        'xl': 'calc(var(--radius) * 2)',
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
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 250ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
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
