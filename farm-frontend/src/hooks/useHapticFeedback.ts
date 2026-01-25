/**
 * God-Tier Haptic Feedback System
 *
 * Provides tactile feedback for interactive elements.
 * Respects user preferences and device capabilities.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error';

const hapticPatterns: Record<HapticType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30, 10, 30],
  selection: [5],
  success: [10, 50, 20],
  error: [30, 30, 30],
};

/**
 * Trigger haptic feedback if supported
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // Check for Vibration API support
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(hapticPatterns[type]);
    } catch {
      // Silently fail if vibration not available
    }
  }
}

/**
 * Hook for haptic feedback with user preference awareness
 */
export function useHapticFeedback() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const haptic = {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    selection: () => triggerHaptic('selection'),
    success: () => triggerHaptic('success'),
    error: () => triggerHaptic('error'),
  };

  return {
    isSupported,
    triggerHaptic,
    ...haptic,
  };
}

export default useHapticFeedback;
