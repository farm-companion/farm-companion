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
      // PuredgeOS Mobile-First Breakpoints
      screens: {
        'xs': '480px',    // Extra small devices
        'sm': '640px',    // Small devices
        'md': '768px',    // Medium devices
        'lg': '1024px',   // Large devices
        'xl': '1280px',   // Extra large devices
        '2xl': '1536px',  // 2X large devices
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
      
      // Enhanced font sizes for better readability (PuredgeOS Clarity First)
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.5' }],      // 14px - was 12px
        'sm': ['1rem', { lineHeight: '1.5' }],          // 16px - was 14px  
        'base': ['1.125rem', { lineHeight: '1.6' }],    // 18px - was 16px
        'lg': ['1.25rem', { lineHeight: '1.6' }],       // 20px - was 18px
        'xl': ['1.5rem', { lineHeight: '1.5' }],        // 24px - was 20px
        '2xl': ['1.875rem', { lineHeight: '1.4' }],     // 30px - was 24px
        '3xl': ['2.25rem', { lineHeight: '1.3' }],      // 36px - was 30px
        '4xl': ['3rem', { lineHeight: '1.2' }],         // 48px - was 36px
        '5xl': ['3.75rem', { lineHeight: '1.1' }],      // 60px - was 48px
        '6xl': ['4.5rem', { lineHeight: '1' }],         // 72px - was 60px
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
        '8': '32px',
        '10': '40px',
        '12': '48px',  // Minimum touch target
        '16': '64px',
        '20': '80px',
        '24': '96px',
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
      },

      animation: {
        'fade-in': 'fade-in 250ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in-up': 'fade-in-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'scale-in': 'scale-in 150ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'lift': 'lift 150ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'shimmer': 'shimmer 2s linear infinite',
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
