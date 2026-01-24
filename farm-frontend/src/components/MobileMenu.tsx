'use client'

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { 
  Home, 
  Map, 
  Leaf, 
  Info, 
  Plus, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  Star, 
  BookOpen, 
  User, 
  Settings, 
  HelpCircle,
  X,
  ChevronRight
} from 'lucide-react'
import { hapticFeedback } from '@/lib/haptics'
import { createSwipeToClose } from '@/lib/gestures'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
    primary: true,
    description: 'Welcome to Farm Companion'
  },
  {
    title: 'Explore Map',
    href: '/map',
    icon: Map,
    primary: true,
    description: 'Find farm shops near you'
  },
  {
    title: 'Seasonal Guide',
    href: '/seasonal',
    icon: Leaf,
    primary: true,
    description: 'What\'s fresh this season'
  },
  {
    title: 'About Us',
    href: '/about',
    icon: Info,
    primary: true,
    description: 'Our story and mission'
  },
  {
    title: 'Add Your Farm',
    href: '/add',
    icon: Plus,
    primary: true,
    description: 'List your farm shop'
  },
  {
    title: 'Contact',
    href: '/contact',
    icon: MessageCircle,
    primary: true,
    description: 'Get in touch with us'
  }
]

const quickActions = [
  {
    title: 'Find Nearest Farm',
    href: '/map',
    icon: MapPin,
    description: 'Discover farms close to you',
    badge: 'Popular'
  },
  {
    title: "What's in Season",
    href: '/seasonal',
    icon: Calendar,
    description: 'Fresh produce available now',
    badge: 'Updated'
  },
  {
    title: 'Featured Farms',
    href: '/map?featured=true',
    icon: Star,
    description: 'Handpicked farm recommendations'
  },
  {
    title: 'Farm Stories',
    href: '/about',
    icon: BookOpen,
    description: 'Meet the people behind the farms'
  }
]

const userItems = [
  {
    title: 'Account',
    href: '/admin',
    icon: User,
    description: 'Manage your account'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Customize your experience'
  },
  {
    title: 'Help & Support',
    href: '/contact',
    icon: HelpCircle,
    description: 'Get help and support'
  }
]

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setIsClosing(true)
    hapticFeedback.menuClose()

    // Animate out
    if (menuRef.current) {
      menuRef.current.classList.remove('animate-slide-in-right')
      menuRef.current.classList.add('animate-slide-out-right')
    }
    if (backdropRef.current) {
      backdropRef.current.classList.remove('animate-backdrop-blur-in')
      backdropRef.current.classList.add('animate-backdrop-blur-out')
    }

    // Close after animation
    setTimeout(() => {
      onClose()
      setIsAnimating(false)
      setIsClosing(false)
    }, 300)
  }, [isAnimating, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isAnimating) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      // Add safe area padding for iOS
      document.body.style.paddingRight = 'env(safe-area-inset-right)'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = ''
    }
  }, [isOpen, isAnimating, handleClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isAnimating) {
      handleClose()
    }
  }, [isAnimating, handleClose])

  // Handle link click
  const handleLinkClick = useCallback((href: string) => {
    hapticFeedback.menuItemSelect()
    handleClose()
    
    // Navigate after animation
    setTimeout(() => {
      window.location.href = href
    }, 150)
  }, [handleClose])

  // Setup gesture recognition
  useEffect(() => {
    if (isOpen && menuRef.current && !isAnimating) {
      const gestureRecognizer = createSwipeToClose(menuRef.current, handleClose, {
        minSwipeDistance: 50,
        velocityThreshold: 0.3
      })

      return () => {
        gestureRecognizer.stop()
      }
    }
  }, [isOpen, handleClose, isAnimating])

  // Trigger haptic feedback on open
  useEffect(() => {
    if (isOpen && !isClosing) {
      hapticFeedback.menuOpen()
    }
  }, [isOpen, isClosing])

  if (!isOpen) return null

  return (
    <>
      {/* Apple-style Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] animate-backdrop-blur-in mobile-menu-backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Apple-style Menu Container */}
      <div
        ref={menuRef}
        className="fixed inset-y-0 right-0 w-80 max-w-[85vw] mobile-menu-frosted shadow-2xl z-[9999] animate-slide-in-right mobile-menu-container mobile-safe-area"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Apple-style Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-serum to-solar flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-body">FC</span>
            </div>
            <div>
              <h2 className="text-heading font-bold text-text-heading">
                Farm Companion
              </h2>
              <p className="text-captionall text-text-muted">Navigation</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="mobile-menu-item p-2 rounded-full hover:bg-background-surface/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-text-body" />
          </button>
        </div>

        {/* Apple-style Navigation Content */}
        <div className="flex-1 overflow-y-auto py-6">
          {/* Primary Navigation */}
          <div className="px-6 mb-8">
            <div className="space-y-1">
              {navigationItems.map((item, index) => (
                <button
                  key={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className="w-full mobile-menu-item flex items-center gap-4 text-left group animate-menu-item-stagger"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-background-surface/50 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                    <item.icon className="w-5 h-5 text-text-body group-hover:text-brand-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-body font-semibold text-text-heading group-hover:text-brand-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="text-caption text-text-muted mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 mb-8">
            <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((item, index) => (
                <button
                  key={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className="w-full mobile-menu-item flex items-start gap-4 text-left group animate-menu-item-stagger"
                  style={{ animationDelay: `${(index + 6) * 0.05}s` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-background-surface/50 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors mt-0.5">
                    <item.icon className="w-5 h-5 text-text-body group-hover:text-brand-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-body font-semibold text-text-heading group-hover:text-brand-primary transition-colors">
                        {item.title}
                      </div>
                      {item.badge && (
                        <span className="px-2 py-1 text-captionall font-medium bg-brand-primary/10 text-brand-primary rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-caption text-text-muted mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-primary transition-colors mt-1" />
                </button>
              ))}
            </div>
          </div>

          {/* User Section */}
          <div className="px-6">
            <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-4">
              Account
            </h3>
            <div className="space-y-2">
              {userItems.map((item, index) => (
                <button
                  key={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className="w-full mobile-menu-item flex items-start gap-4 text-left group animate-menu-item-stagger"
                  style={{ animationDelay: `${(index + 10) * 0.05}s` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-background-surface/50 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors mt-0.5">
                    <item.icon className="w-5 h-5 text-text-body group-hover:text-brand-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-body font-semibold text-text-heading group-hover:text-brand-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="text-caption text-text-muted mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-primary transition-colors mt-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apple-style Footer */}
        <div className="border-t border-border-default/20 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-serum to-solar flex items-center justify-center">
              <span className="text-white font-bold text-caption">FC</span>
            </div>
            <div>
              <p className="text-caption font-semibold text-text-heading">
                Farm Companion
              </p>
              <p className="text-captionall text-text-muted">
                Real food, real people, real places
              </p>
            </div>
          </div>
          <p className="text-captionall text-text-muted leading-relaxed">
            The UK&apos;s premium guide to authentic farm experiences and fresh local produce.
          </p>
        </div>
      </div>
    </>
  )
}

// Apple-style Hamburger Button Component
export function MobileMenuButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  const handleClick = () => {
    hapticFeedback.buttonPress()
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className="p-3 rounded-full bg-background-surface/80 backdrop-blur-sm hover:bg-background-surface border border-border-default/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary relative z-[9997] shadow-lg"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <div className="relative w-6 h-6">
        <span
          className={`absolute top-1 left-0 w-6 h-0.5 bg-text-body transition-all duration-300 ease-out ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        <span
          className={`absolute top-3 left-0 w-6 h-0.5 bg-text-body transition-all duration-300 ease-out ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`absolute top-5 left-0 w-6 h-0.5 bg-text-body transition-all duration-300 ease-out ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </div>
    </button>
  )
}
