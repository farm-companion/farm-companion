'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Leaf, Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

// PuredgeOS Mobile-First Header & Sheet Menu
export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isHeaderInverted, setIsHeaderInverted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  const headerRef = useRef<HTMLElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  // Handle scroll and header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const direction = currentScrollY > lastScrollY ? 'down' : 'up'
      
      setIsScrolled(currentScrollY > 20)
      
      // Auto-hide on desktop only, and only when scrolling down
      if (window.innerWidth >= 1024) {
        if (direction === 'down' && currentScrollY > 100) {
          setIsHeaderVisible(false)
        } else if (direction === 'up' || currentScrollY <= 100) {
          setIsHeaderVisible(true)
        }
      } else {
        setIsHeaderVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Check for header inversion based on data-header-invert attribute
  useEffect(() => {
    const checkHeaderInversion = () => {
      const invertedSections = document.querySelectorAll('[data-header-invert]')
      let shouldInvert = false
      
      invertedSections.forEach(section => {
        const rect = section.getBoundingClientRect()
        if (rect.top <= 100 && rect.bottom > 100) {
          shouldInvert = true
        }
      })
      
      setIsHeaderInverted(shouldInvert)
    }

    checkHeaderInversion()
    window.addEventListener('scroll', checkHeaderInversion, { passive: true })
    window.addEventListener('resize', checkHeaderInversion, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', checkHeaderInversion)
      window.removeEventListener('resize', checkHeaderInversion)
    }
  }, [])

  // Handle sheet open/close with focus management
  const openSheet = () => {
    previousActiveElement.current = document.activeElement as HTMLElement
    setIsSheetOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    document.body.style.overflow = 'unset'
    
    // Return focus to previous element
    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSheetOpen) {
        closeSheet()
      }
    }

    if (isSheetOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isSheetOpen])

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSheet()
    }
  }

  // Determine header styling based on state
  const getHeaderClasses = () => {
    const baseClasses = "sticky top-0 z-40 transition-all duration-300 ease-out border-b"
    
    // Visibility
    const visibilityClasses = isHeaderVisible ? "translate-y-0 opacity-100" : "lg:-translate-y-full lg:opacity-0"
    
    // Background and border
    let backgroundClasses = ""
    if (isHeaderInverted) {
      backgroundClasses = "bg-white/95 backdrop-blur-md border-gray-200"
    } else if (isDarkMode) {
      backgroundClasses = "bg-black/80 backdrop-blur-md border-white/20"
    } else {
      backgroundClasses = isScrolled 
        ? "bg-white/95 backdrop-blur-md border-gray-200" 
        : "bg-transparent border-transparent"
    }
    
    return `${baseClasses} ${visibilityClasses} ${backgroundClasses}`
  }

  // Determine text colors
  const getTextClasses = (isLink = false) => {
    if (isHeaderInverted) {
      return isLink 
        ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100" 
        : "text-gray-900"
    } else if (isDarkMode) {
      return isLink 
        ? "text-white hover:text-white hover:bg-white/10" 
        : "text-white"
    } else {
      return isLink 
        ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100" 
        : "text-gray-900"
    }
  }

  return (
    <>
      {/* Header */}
      <header ref={headerRef} className={getHeaderClasses()}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-3 group"
              aria-label="Farm Companion - Home"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-serum to-serum/80 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-lg leading-tight ${getTextClasses()}`}>
                  Farm Companion
                </span>
                <span className={`text-xs font-medium leading-tight hidden sm:block ${
                  isHeaderInverted ? 'text-gray-600' : isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Real food, real places
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link 
                href="/map" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${getTextClasses(true)}`}
              >
                Map
              </Link>
              <Link 
                href="/seasonal" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${getTextClasses(true)}`}
              >
                Seasonal
              </Link>
              <Link 
                href="/about" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${getTextClasses(true)}`}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${getTextClasses(true)}`}
              >
                Feedback
              </Link>
              
              {/* Add Farm Shop Button */}
              <Link 
                href="/add"
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 h-10 transition-all duration-300 ${
                  isHeaderInverted
                    ? 'bg-serum text-black hover:bg-serum/90 border border-serum/20 shadow-md hover:shadow-lg'
                    : isDarkMode
                    ? 'bg-white text-black hover:bg-gray-100 border border-white/20 shadow-lg hover:shadow-xl'
                    : 'bg-serum text-black hover:bg-serum/90 border border-serum/20 shadow-md hover:shadow-lg'
                }`}
              >
                Add a Farm Shop
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={openSheet}
              className={`lg:hidden p-2 rounded-lg transition-colors ${getTextClasses(true)}`}
              aria-expanded={isSheetOpen}
              aria-controls="mobile-sheet"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sheet Menu */}
      {isSheetOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
          
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-serum to-serum/80 rounded-lg flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  Farm Companion
                </span>
              </div>
              <button
                onClick={closeSheet}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="px-6 py-4 space-y-2">
              <Link
                href="/map"
                onClick={closeSheet}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-medium">Farm Map</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Find farm shops near you</div>
              </Link>
              
              <Link
                href="/seasonal"
                onClick={closeSheet}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-medium">What's in Season</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Fresh produce calendar</div>
              </Link>
              
              <Link
                href="/about"
                onClick={closeSheet}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-medium">About Us</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Our farm companion story</div>
              </Link>
              
              <Link
                href="/contact"
                onClick={closeSheet}
                className="block px-4 py-3 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-medium">Feedback</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Share your thoughts</div>
              </Link>
            </nav>
            
            {/* CTA Section */}
            <div className="px-6 pb-4">
              <Link
                href="/add"
                onClick={closeSheet}
                className="block w-full px-4 py-3 rounded-lg bg-serum text-black font-medium text-center hover:bg-serum/90 transition-colors shadow-sm"
              >
                Add a Farm Shop
              </Link>
            </div>
            
            {/* Theme Toggle */}
            <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Theme</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Light or dark mode</div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}