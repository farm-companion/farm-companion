'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isAuto, setIsAuto] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Function to update component state based on current theme
    const updateThemeState = () => {
      const savedTheme = localStorage.getItem('theme')
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      // Check if user has manually set a theme
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setIsAuto(false)
        setIsDark(savedTheme === 'dark')
      } else {
        // Auto mode - follow system preference
        setIsAuto(true)
        setIsDark(systemPrefersDark)
      }
    }
    
    // Initial state
    updateThemeState()
    
    // Listen for theme changes
    window.addEventListener('theme-changed', updateThemeState)
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (isAuto) {
        const systemPrefersDark = mediaQuery.matches
        setIsDark(systemPrefersDark)
        if (systemPrefersDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
    
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    // Cleanup
    return () => {
      window.removeEventListener('theme-changed', updateThemeState)
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [isAuto])

  const toggleTheme = () => {
    if (isAuto) {
      // Switch from auto to manual light mode
      setIsAuto(false)
      setIsDark(false)
      localStorage.setItem('theme', 'light')
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      // Dispatch event for other components
      window.dispatchEvent(new Event('theme-changed'))
    } else if (isDark) {
      // Switch from dark to light
      setIsDark(false)
      localStorage.setItem('theme', 'light')
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      // Dispatch event for other components
      window.dispatchEvent(new Event('theme-changed'))
    } else {
      // Switch from light to dark
      setIsDark(true)
      localStorage.setItem('theme', 'dark')
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      // Dispatch event for other components
      window.dispatchEvent(new Event('theme-changed'))
    }
  }

  const resetToAuto = () => {
    setIsAuto(true)
    localStorage.removeItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(systemPrefersDark)
    document.documentElement.classList.remove('dark', 'light')
    if (systemPrefersDark) {
      document.documentElement.classList.add('dark')
    }
    // Dispatch event for other components
    window.dispatchEvent(new Event('theme-changed'))
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full bg-background-surface border border-border-default hover:bg-background-canvas transition-colors"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="relative group">
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-background-surface border border-border-default hover:bg-background-canvas transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-text-body" />
        ) : (
          <Moon className="w-5 h-5 text-text-body" />
        )}
      </button>
      
      {/* Auto indicator */}
      {isAuto && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-serum rounded-full border-2 border-white dark:border-gray-800" />
      )}
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-small bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {isAuto ? 'Auto (follows system)' : isDark ? 'Dark mode' : 'Light mode'}
        {!isAuto && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              resetToAuto()
            }}
            className="block w-full mt-1 text-serum hover:text-serum/80"
          >
            Reset to auto
          </button>
        )}
      </div>
    </div>
  )
}
