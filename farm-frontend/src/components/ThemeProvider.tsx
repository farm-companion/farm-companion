'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

/**
 * Theme Provider - Wraps next-themes for Harvest Design System
 *
 * Configuration:
 * - attribute="class" - Uses .dark/.light classes on <html>
 * - defaultTheme="system" - Follows OS preference by default
 * - enableSystem - Enables system preference detection
 * - disableTransitionOnChange - Prevents flash during theme switch
 * - storageKey="theme" - Matches existing localStorage key
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
