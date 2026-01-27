/**
 * God-Tier Hooks - Sensory Feedback System
 *
 * These hooks provide haptic and audio feedback for a premium user experience.
 */

export { useHapticFeedback, triggerHaptic } from './useHapticFeedback';
export type { HapticType } from './useHapticFeedback';

export { useSoundFeedback } from './useSoundFeedback';

export { useUserLocation } from './useUserLocation';
export type { UserLocation, UseUserLocationOptions, UseUserLocationResult } from './useUserLocation';

export { useCommandPalette } from './useCommandPalette';
export type { UseCommandPaletteResult } from './useCommandPalette';

export { useFormValidation, validationRules } from './useFormValidation';
