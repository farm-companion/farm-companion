// Haptic Feedback Utility
// Apple-level haptic feedback for mobile interactions

interface HapticFeedback {
  light: () => void
  medium: () => void
  heavy: () => void
  success: () => void
  warning: () => void
  error: () => void
}

// Check if haptic feedback is supported
const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator && 
         typeof navigator.vibrate === 'function' &&
         navigator.maxTouchPoints > 0
}

// Check if running on iOS
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// iOS-specific haptic feedback
const triggerIOSHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): void => {
  if (!isIOS()) return

  try {
    // Use WebKit Haptic API if available
    if ('webkit' in window && 'messageHandlers' in (window as any).webkit) {
      const webkit = (window as any).webkit
      if (webkit.messageHandlers.hapticFeedback) {
        webkit.messageHandlers.hapticFeedback.postMessage({ type })
        return
      }
    }

    // Fallback to vibration patterns
    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [20, 50, 20],
      error: [30, 100, 30]
    }

    navigator.vibrate(patterns[type])
  } catch (error) {
    console.warn('Haptic feedback failed:', error)
  }
}

// Android/Web vibration patterns
const triggerVibration = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): void => {
  if (!isHapticSupported()) return

  try {
    const patterns: Record<string, number | number[]> = {
      light: 15,
      medium: 25,
      heavy: 35,
      success: [15, 50, 15],
      warning: [25, 50, 25],
      error: [35, 100, 35]
    }

    navigator.vibrate(patterns[type])
  } catch (error) {
    console.warn('Vibration failed:', error)
  }
}

// Main haptic feedback function
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): void => {
  if (isIOS()) {
    triggerIOSHaptic(type)
  } else {
    triggerVibration(type)
  }
}

// Haptic feedback object
export const haptics: HapticFeedback = {
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error')
}

// Utility functions for common interactions
export const hapticFeedback = {
  // Menu interactions
  menuOpen: () => haptics.light(),
  menuClose: () => haptics.light(),
  menuItemSelect: () => haptics.medium(),
  
  // Button interactions
  buttonPress: () => haptics.light(),
  buttonLongPress: () => haptics.medium(),
  
  // Gesture interactions
  swipeStart: () => haptics.light(),
  swipeEnd: () => haptics.light(),
  
  // Form interactions
  formSubmit: () => haptics.success(),
  formError: () => haptics.error(),
  
  // Navigation
  pageTransition: () => haptics.light(),
  
  // Success/Error states
  success: () => haptics.success(),
  error: () => haptics.error(),
  warning: () => haptics.warning()
}

// Hook for React components
export const useHaptics = () => {
  return {
    ...haptics,
    ...hapticFeedback
  }
}

// Check if haptics are available
export const hapticsAvailable = (): boolean => {
  return isHapticSupported() || isIOS()
}

export default haptics
