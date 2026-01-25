'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

/**
 * Theme Toggle - Harvest Design System
 *
 * Three-state toggle: Light, Dark, System (auto)
 * Uses next-themes for reliable SSR and hydration
 */
export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    // Cycle: system -> light -> dark -> system
    if (theme === 'system') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('system')
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] transition-colors"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'
  const isSystem = theme === 'system'

  return (
    <div className="relative group">
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-200 dark:hover:bg-white/[0.1] transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
        aria-label={
          isSystem
            ? 'Using system theme, click to switch to light'
            : isDark
            ? 'Dark mode, click to switch to system'
            : 'Light mode, click to switch to dark'
        }
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
        ) : (
          <Moon className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
        )}
      </button>

      {/* System/Auto indicator */}
      {isSystem && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full border-2 border-white dark:border-zinc-900" />
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 text-xs bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
        <div className="flex items-center gap-2">
          {isSystem ? (
            <>
              <Monitor className="w-3.5 h-3.5" />
              <span>System ({isDark ? 'dark' : 'light'})</span>
            </>
          ) : isDark ? (
            <>
              <Moon className="w-3.5 h-3.5" />
              <span>Dark mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5" />
              <span>Light mode</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
