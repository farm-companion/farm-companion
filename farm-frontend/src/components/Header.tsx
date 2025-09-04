'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Leaf, Menu, X, ArrowRight } from 'lucide-react'
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

// God-tier Mobile Menu Button Component with Award-Winning Animations
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
      className={`touch-target p-2 rounded-lg transition-all duration-300 relative overflow-hidden group ${
        isDarkMode 
          ? 'hover:bg-white/20 text-white border border-white/20' 
          : 'hover:bg-background-surface text-text-heading border border-gray-200'
      }`}
      {...props}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-serum/20 to-serum/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
      
      {/* Icon with rotation animation */}
      <div className={`relative transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </div>
      
      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-serum/30 scale-0 group-active:scale-100 transition-transform duration-150 rounded-full"></div>
      </div>
    </button>
  )
}

// God-tier Mobile Menu Component with Award-Winning UX/UI
function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Animation states
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const menuItems = [
    { 
      href: '/map', 
      label: 'Farm Map', 
      icon: '🗺️', 
      description: 'Find farm shops near you',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      href: '/seasonal', 
      label: 'What\'s in Season', 
      icon: '🌱', 
      description: 'Fresh produce calendar',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      href: '/about', 
      label: 'About Us', 
      icon: '🏡', 
      description: 'Our farm companion story',
      color: 'from-amber-500 to-orange-500'
    },
    { 
      href: '/contact', 
      label: 'Feedback', 
      icon: '💬', 
      description: 'Share your thoughts',
      color: 'from-purple-500 to-pink-500'
    }
  ]

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Animated Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 mobile-menu-backdrop transition-all duration-300 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu Panel with Slide Animation */}
      <div 
        className={`absolute top-0 right-0 w-full max-w-sm h-full bg-white dark:bg-gray-900 shadow-2xl mobile-menu-panel transform transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-full' : 'translate-x-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header with Logo and Close */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-serum to-serum/80 rounded-lg flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Farm Companion</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Real food, real places</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 touch-target mobile-menu-close mobile-menu-focus"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Navigation */}
          <nav className="p-6" aria-label="Mobile navigation">
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`group block p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mobile-menu-item mobile-menu-item-hover mobile-menu-touch mobile-menu-focus bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
                    isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 50}ms`
                  }}
                  onMouseEnter={() => setActiveSection(item.href)}
                  onMouseLeave={() => setActiveSection('')}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xl shadow-lg group-hover:shadow-xl transition-shadow duration-200 mobile-menu-icon`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-serum transition-colors duration-200">
                        {item.label}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ArrowRight className="w-4 h-4 text-serum" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {/* CTA Section */}
          <div className="px-6 pb-6">
            <div 
              className={`p-6 rounded-2xl bg-gradient-to-r from-serum to-serum/80 shadow-lg hover:shadow-xl transition-all duration-300 mobile-menu-cta ${
                isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚜</span>
                </div>
                <h3 className="font-bold text-lg text-black mb-2">Add Your Farm Shop</h3>
                <p className="text-black/80 text-sm mb-4">Share your farm with the community</p>
                <Link 
                  href="/add" 
                  onClick={onClose}
                  className="inline-flex items-center justify-center w-full bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-black/90 transition-colors duration-200 touch-target shadow-lg hover:shadow-xl mobile-menu-touch mobile-menu-focus"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="px-6 pb-6">
            <div 
              className={`p-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
                isAnimating ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ transitionDelay: '250ms' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Theme</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Light or dark mode</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 relative">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Made with ❤️ for UK farmers
            </p>
          </div>
          {/* Scroll Indicator */}
          <div className="mobile-menu-scroll-indicator"></div>
        </div>
      </div>
    </div>
  )
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Simplified desktop header behavior
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY
          const isDesktop = window.innerWidth >= 1024
          
          // Simple scroll direction detection
          const direction = scrollY > lastScrollY ? 'down' : 'up'
          setLastScrollY(scrollY)
          
          // Simplified auto-hide logic for desktop only
          if (isDesktop) {
            if (scrollY > 100 && direction === 'down') {
              setIsHeaderVisible(false)
            } else if (direction === 'up' || scrollY <= 100) {
              setIsHeaderVisible(true)
            }
          } else {
            // Mobile - always visible
            setIsHeaderVisible(true)
          }
          
          setIsScrolled(scrollY > 20)
          
          // Simple dark mode detection - check if over hero sections
          const heroSections = document.querySelectorAll('section[class*="h-[60vh]"], section[class*="h-screen"]')
          let isOverHero = false
          
          heroSections.forEach(section => {
            const rect = section.getBoundingClientRect()
            if (rect.top <= 100 && rect.bottom > 100) {
              isOverHero = true
            }
          })
          
          setIsDarkMode(isOverHero)
          ticking = false
        })
        ticking = true
      }
    }

    // Simple keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (window.innerWidth >= 1024 && e.key === 'Escape') {
        setIsHeaderVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    handleScroll() // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lastScrollY])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
          isHeaderVisible 
            ? 'translate-y-0 opacity-100' 
            : 'lg:-translate-y-full lg:opacity-0'
        } ${
          isDarkMode 
            ? 'bg-black/80 backdrop-blur-md border-white/20 shadow-lg' 
            : isScrolled 
              ? 'bg-white/95 backdrop-blur-md border-gray-200 shadow-sm' 
              : 'bg-transparent border-transparent'
        } ${isScrolled ? 'border-b' : ''}`}
      >
        <nav aria-label="Primary navigation" className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Logo/Brand - PuredgeOS 3.0 Styled */}
          <Logo isDarkMode={isDarkMode} />
          
          {/* Desktop Navigation - Hidden on Mobile */}
          <ul className="hidden lg:flex items-center gap-6 text-sm" role="menubar">
            <li role="none">
              <Link 
                href="/map" 
                className={`transition-colors touch-target px-3 py-2 rounded-md ${
                  isDarkMode 
                    ? 'text-white hover:text-white hover:bg-white/10' 
                    : 'text-text-body hover:text-text-heading hover:bg-gray-100'
                }`}
                role="menuitem"
              >
                Map
              </Link>
            </li>
            <li role="none">
              <Link 
                href="/seasonal" 
                className={`transition-colors touch-target px-3 py-2 rounded-md ${
                  isDarkMode 
                    ? 'text-white hover:text-white hover:bg-white/10' 
                    : 'text-text-body hover:text-text-heading hover:bg-gray-100'
                }`}
                role="menuitem"
              >
                Seasonal
              </Link>
            </li>
            <li role="none">
              <Link 
                href="/about" 
                className={`transition-colors touch-target px-3 py-2 rounded-md ${
                  isDarkMode 
                    ? 'text-white hover:text-white hover:bg-white/10' 
                    : 'text-text-body hover:text-text-heading hover:bg-gray-100'
                }`}
                role="menuitem"
              >
                About
              </Link>
            </li>
            <li role="none">
              <Link 
                href="/contact" 
                className={`transition-colors touch-target px-3 py-2 rounded-md ${
                  isDarkMode 
                    ? 'text-white hover:text-white hover:bg-white/10' 
                    : 'text-text-body hover:text-text-heading hover:bg-gray-100'
                }`}
                role="menuitem"
              >
                Feedback
              </Link>
            </li>
            <li role="none">
              <Link 
                href="/add"
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 touch-target px-4 py-2 h-10 border ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-gray-100 border-white/20 shadow-lg hover:shadow-xl' 
                    : 'bg-serum text-black hover:bg-serum/90 border-serum/20 shadow-md hover:shadow-lg'
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

      {/* Simple hidden header indicator */}
      {!isHeaderVisible && (
        <div 
          className="hidden lg:block fixed top-0 left-1/2 transform -translate-x-1/2 z-30 bg-serum text-black px-4 py-2 rounded-b-lg text-sm font-medium cursor-pointer hover:bg-serum/90 transition-colors duration-200"
          onClick={() => setIsHeaderVisible(true)}
          title="Click to show header"
        >
          <Leaf className="w-4 h-4 inline mr-2" />
          Farm Companion
        </div>
      )}

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={closeMobileMenu}
      />
    </>
  )
}
