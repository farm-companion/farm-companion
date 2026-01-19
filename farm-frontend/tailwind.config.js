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
      
      // Fluid Typography - Mobile-first responsive (clamp for smooth scaling)
      fontSize: {
        'xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],      // 12px -> 14px
        'sm': ['clamp(0.875rem, 0.825rem + 0.25vw, 1rem)', { lineHeight: '1.5' }],       // 14px -> 16px
        'base': ['clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', { lineHeight: '1.6' }],      // 16px -> 18px
        'lg': ['clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)', { lineHeight: '1.6' }],    // 18px -> 20px
        'xl': ['clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)', { lineHeight: '1.5' }],        // 20px -> 24px
        '2xl': ['clamp(1.5rem, 1.35rem + 0.75vw, 2rem)', { lineHeight: '1.4' }],         // 24px -> 32px
        '3xl': ['clamp(1.875rem, 1.65rem + 1.125vw, 2.5rem)', { lineHeight: '1.3' }],    // 30px -> 40px
        '4xl': ['clamp(2.25rem, 1.95rem + 1.5vw, 3rem)', { lineHeight: '1.2' }],         // 36px -> 48px
        '5xl': ['clamp(3rem, 2.5rem + 2.5vw, 4rem)', { lineHeight: '1.1' }],             // 48px -> 64px
        '6xl': ['clamp(3.75rem, 3rem + 3.75vw, 5rem)', { lineHeight: '1' }],             // 60px -> 80px
      },
      
      // Mobile-first spacing scale (4px baseline)
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',   // iOS minimum touch target
        '12': '48px',   // Our standard comfortable touch target
        '14': '56px',   // Spacious touch target
        '16': '64px',   // Generous touch target
        '20': '80px',
        '24': '96px',
        '32': '128px',
        '40': '160px',
        '48': '192px',
        '56': '224px',
        '64': '256px',
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

      // Premium animations
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'lift': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-8px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(8px)' },
        },
        'success-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'gentle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },

      animation: {
        'fade-in': 'fade-in 250ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in-up': 'fade-in-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'scale-in': 'scale-in 150ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'lift': 'lift 150ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'shake': 'shake 0.6s ease-in-out',
        'success-pop': 'success-pop 0.5s ease-out',
        'gentle-pulse': 'gentle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
