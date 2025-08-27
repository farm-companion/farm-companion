'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Leaf, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import ThemeToggle from '@/components/ThemeToggle'

// Logo Component - PuredgeOS 3.0 Styled with dynamic colors
function Logo({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <Link 
      href="/" 
      className="group flex items-center space-x-3 touch-target transition-transform duration-200 hover:scale-105"
      aria-label="Farm Companion - Home"
    >
      {/* Logo Icon */}
      <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-serum to-serum/80 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
        <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      
      {/* Logo Text */}
      <div className="flex flex-col">
        <span className={`font-bold text-lg sm:text-xl leading-tight transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-text-heading'
        }`}>
          Farm Companion
        </span>
        <span className={`text-xs font-medium leading-tight hidden sm:block transition-colors duration-300 ${
          isDarkMode ? 'text-white/70' : 'text-text-muted'
        }`}>
          Real food, real places
        </span>
      </div>
    </Link>
  )
}

// Mobile Menu Button Component with dynamic colors
function MobileMenuButton({ onClick, isOpen, isDarkMode, ...props }: {
  onClick: () => void
  isOpen: boolean
  isDarkMode: boolean
  'aria-expanded': boolean
  'aria-controls': string
  'aria-label': string
}) {
  return (
    <button
      onClick={onClick}
      className={`touch-target p-2 rounded-lg transition-all duration-300 ${
        isDarkMode 
          ? 'hover:bg-white/10 text-white' 
          : 'hover:bg-background-surface text-text-heading'
      }`}
      {...props}
    >
      {isOpen ? (
        <X className="w-5 h-5" />
      ) : (
        <Menu className="w-5 h-5" />
      )}
    </button>
  )
}

// Mobile Menu Component
function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background-canvas/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="absolute top-0 right-0 w-80 h-full bg-background-surface border-l border-border-default shadow-xl">
        <div className="p-6">
          {/* Close Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={onClose}
              className="touch-target p-2 rounded-lg hover:bg-background-canvas transition-colors duration-200"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-text-heading" />
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <nav aria-label="Mobile navigation" className="space-y-4">
            <Link 
              href="/map" 
              className="block text-text-body hover:text-text-heading transition-colors touch-target px-4 py-3 rounded-lg hover:bg-background-canvas"
              onClick={onClose}
            >
              Map
            </Link>
            <Link 
              href="/seasonal" 
              className="block text-text-body hover:text-text-heading transition-colors touch-target px-4 py-3 rounded-lg hover:bg-background-canvas"
              onClick={onClose}
            >
              Seasonal
            </Link>
            <Link 
              href="/about" 
              className="block text-text-body hover:text-text-heading transition-colors touch-target px-4 py-3 rounded-lg hover:bg-background-canvas"
              onClick={onClose}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="block text-text-body hover:text-text-heading transition-colors touch-target px-4 py-3 rounded-lg hover:bg-background-canvas"
              onClick={onClose}
            >
              Feedback
            </Link>
            
            {/* Mobile CTA */}
            <div className="pt-4 border-t border-border-default">
              <Link 
                href="/add" 
                onClick={onClose}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 touch-target px-4 py-2 h-10 bg-serum text-black hover:bg-serum/90 shadow-md hover:shadow-lg"
              >
                Add a Farm Shop
              </Link>
            </div>
            
            {/* Theme Toggle in Mobile */}
            <div className="pt-4">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Smart scroll detection with requestAnimationFrame to prevent layout thrashing
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY
          setIsScrolled(scrollY > 50)
          
          // Detect if we're over a dark header section
          const headerSections = document.querySelectorAll('section[class*="h-[60vh]"], section[class*="h-screen"]')
          let isOverDarkSection = false
          
          headerSections.forEach(section => {
            const rect = section.getBoundingClientRect()
            if (rect.top <= 0 && rect.bottom > 0) {
              // We're over a header section
              isOverDarkSection = true
            }
          })
          
          setIsDarkMode(isOverDarkSection)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all duration-300 transform-gpu ${
        isDarkMode 
          ? 'bg-black/20 backdrop-blur-md border-white/10' 
          : isScrolled 
            ? 'bg-background-canvas/95 backdrop-blur-sm border-border-default' 
            : 'bg-transparent border-transparent'
      } ${isScrolled ? 'border-b' : ''}`}>
        <nav aria-label="Primary navigation" className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Logo/Brand - PuredgeOS 3.0 Styled */}
          <Logo isDarkMode={isDarkMode} />
          
          {/* Desktop Navigation - Hidden on Mobile */}
          <ul className="hidden lg:flex items-center gap-6 text-sm" role="menubar">
            <li role="none">
              <Link 
                href="/map" 
                className={`transition-colors touch-target px-3 py-2 ${
                  isDarkMode 
                    ? 'text-white/90 hover:text-white' 
                    : 'text-text-body hover:text-text-heading'
                }`}
                role="menuitem"
              >
                Map
              </Link>
            </li>
            <li role="none">
              <Link 
                href="/seasonal" 
                className={`transition-colors touch-target px-3 py-2 ${
                  isDarkMode 
                    ? 'text-white/90 hover:text-white' 
                    : 'text-text-body hover:text-text-heading'
                }`}
                role="menuitem"
              >
                Seasonal
              </Link>
            </li>
            <li role="none">
              <Link 
                href="/about" 
                className={`transition-colors touch-target px-3 py-2 ${
                  isDarkMode 
                    ? 'text-white/90 hover:text-white' 
                    : 'text-text-body hover:text-text-heading'
                }`}
                role="menuitem"
              >
                About
              </Link>
            </li>
            <li role="none">
              <Link 
                href="/contact" 
                className={`transition-colors touch-target px-3 py-2 ${
                  isDarkMode 
                    ? 'text-white/90 hover:text-white' 
                    : 'text-text-body hover:text-text-heading'
                }`}
                role="menuitem"
              >
                Feedback
              </Link>
            </li>
            <li role="none">
              <Link 
                href="/add"
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 touch-target px-4 py-2 h-10 ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl' 
                    : 'bg-serum text-black hover:bg-serum/90 shadow-md hover:shadow-lg'
                }`}
              >
                Add a Farm Shop
              </Link>
            </li>
            <li role="none">
              <ThemeToggle />
            </li>
          </ul>

          {/* Mobile Menu Button - Visible on mobile and tablet */}
          <div className="lg:hidden">
            <MobileMenuButton 
              onClick={toggleMobileMenu} 
              isOpen={isMobileMenuOpen}
              isDarkMode={isDarkMode}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle mobile menu"
            />
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={closeMobileMenu}
      />
    </>
  )
}
