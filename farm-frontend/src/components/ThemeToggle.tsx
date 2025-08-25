'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Function to update component state based on current theme
    const updateThemeState = () => {
      const savedTheme = localStorage.getItem('theme')
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isCurrentlyDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
      setIsDark(isCurrentlyDark)
    }
    
    // Initial state
    updateThemeState()
    
    // Listen for theme changes
    window.addEventListener('theme-changed', updateThemeState)
    
    // Cleanup
    return () => {
      window.removeEventListener('theme-changed', updateThemeState)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      localStorage.setItem('theme', 'dark')
      document.documentElement.classList.add('dark')
    } else {
      localStorage.setItem('theme', 'light')
      document.documentElement.classList.remove('dark')
    }
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
  )
}
