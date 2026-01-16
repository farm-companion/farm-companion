/**
 * Animation Utilities for Farm Companion
 *
 * Framer Motion variants and transitions for consistent, delightful interactions
 * throughout the application.
 */

import { Variants, Transition } from 'framer-motion'

// =============================================================================
// FADE ANIMATIONS
// =============================================================================

/**
 * Simple fade in/out animation
 * Usage: <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

/**
 * Fade in with upward movement
 * Great for content that "floats up" into view
 */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
}

/**
 * Fade in with downward movement
 * Good for dropdowns and modals
 */
export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

/**
 * Fade in from left
 * Useful for sidebar and drawer animations
 */
export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

/**
 * Fade in from right
 * Good for entering panels and notifications
 */
export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
}

// =============================================================================
// SCALE ANIMATIONS
// =============================================================================

/**
 * Scale in animation
 * Perfect for modals and popups
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
}

/**
 * Scale in with slight bounce
 * Adds playful energy to interactions
 */
export const scaleInBounce: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15
    }
  },
  exit: { opacity: 0, scale: 0.9 }
}

/**
 * Hover scale effect
 * Use on cards and interactive elements
 */
export const hoverScale: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
}

/**
 * Hover lift effect
 * Combines scale with shadow for elevation
 */
export const hoverLift: Variants = {
  initial: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
}

// =============================================================================
// SLIDE ANIMATIONS
// =============================================================================

/**
 * Slide in from right
 * Great for drawers and side panels
 */
export const slideInRight: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' }
}

/**
 * Slide in from left
 */
export const slideInLeft: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' }
}

/**
 * Slide in from bottom
 * Perfect for mobile bottom sheets
 */
export const slideInBottom: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' }
}

/**
 * Slide in from top
 * Good for notifications and alerts
 */
export const slideInTop: Variants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' }
}

// =============================================================================
// STAGGER ANIMATIONS
// =============================================================================

/**
 * Stagger container for child animations
 * Children will animate in sequence with a delay
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
}

/**
 * Fast stagger container
 * For quick successive animations
 */
export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0
    }
  }
}

/**
 * Stagger item to use with stagger containers
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 }
}

// =============================================================================
// SPECIAL EFFECTS
// =============================================================================

/**
 * Shimmer loading effect
 * For skeleton screens
 */
export const shimmer: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'linear'
    }
  }
}

/**
 * Pulse animation
 * For loading indicators and attention grabbers
 */
export const pulse: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'easeInOut'
    }
  }
}

/**
 * Bounce animation
 * Fun attention grabber
 */
export const bounce: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -10, 0],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut'
    }
  }
}

/**
 * Success checkmark animation
 * Animated checkmark for success states
 */
export const successCheckmark: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
    rotate: -45
  },
  animate: {
    scale: [0, 1.2, 1],
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.5,
      times: [0, 0.6, 1],
      ease: [0.2, 0.8, 0.2, 1]
    }
  }
}

/**
 * Error shake animation
 * Horizontal shake for error states
 */
export const errorShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: {
      duration: 0.6,
      times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 1],
      ease: 'easeInOut'
    }
  }
}

/**
 * Loading dots animation
 * Three dots bouncing in sequence
 */
export const loadingDots: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-8, 0],
    transition: {
      repeat: Infinity,
      repeatType: 'reverse',
      duration: 0.6,
      ease: 'easeInOut'
    }
  }
}

/**
 * Reveal animation from scroll
 * For scroll-triggered content reveals
 */
export const scrollReveal: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.2, 0.8, 0.2, 1]
    }
  }
}

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

/**
 * Gentle spring transition
 * Smooth, natural feeling motion
 */
export const gentle: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
}

/**
 * Bouncy spring transition
 * Playful, energetic motion
 */
export const bouncy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 10
}

/**
 * Smooth eased transition
 * Quick, professional feeling
 */
export const smooth: Transition = {
  duration: 0.3,
  ease: [0.2, 0.8, 0.2, 1]
}

/**
 * Fast eased transition
 * Snappy, responsive
 */
export const fast: Transition = {
  duration: 0.15,
  ease: [0.2, 0.8, 0.2, 1]
}

/**
 * Slow smooth transition
 * Elegant, deliberate
 */
export const slow: Transition = {
  duration: 0.5,
  ease: [0.2, 0.8, 0.2, 1]
}

/**
 * Elastic spring
 * Exaggerated bounce effect
 */
export const elastic: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 12,
  mass: 0.8
}

// =============================================================================
// LAYOUT ANIMATIONS
// =============================================================================

/**
 * Shared layout animation config
 * For smooth transitions between layout changes
 */
export const layoutTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 30
}

// =============================================================================
// PAGE TRANSITIONS
// =============================================================================

/**
 * Page enter/exit animations
 * For route transitions
 */
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.2, 0.8, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.2, 0.8, 0.2, 1]
    }
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Combine multiple variants
 * Useful for complex animations
 */
export function combineVariants(...variants: Variants[]): Variants {
  return variants.reduce((acc, variant) => ({
    ...acc,
    ...variant
  }), {})
}

/**
 * Create custom stagger container with delay
 */
export function createStaggerContainer(
  staggerDelay: number = 0.1,
  delayChildren: number = 0
): Variants {
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren
      }
    }
  }
}

/**
 * Viewport animation detection
 * Triggers animation when element enters viewport
 */
export const viewportOnce = {
  once: true,
  amount: 0.3,
  margin: '0px 0px -100px 0px'
}

export const viewport = {
  once: false,
  amount: 0.3,
  margin: '0px 0px -50px 0px'
}
