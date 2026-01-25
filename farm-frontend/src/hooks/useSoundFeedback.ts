'use client';

/**
 * God-Tier Audio Cue System
 *
 * Provides subtle audio feedback for user actions.
 * All sounds are optional and respect user preferences.
 *
 * Sound Types:
 * - success: 40ms tink at 1200Hz (high, pleasant)
 * - error: 80ms bonk at 400Hz (low, attention-getting)
 * - notification: 60ms ping at 880Hz (mid, neutral)
 * - click: 20ms tick at 1000Hz (micro feedback)
 */

import { useCallback, useEffect, useState } from 'react';

type SoundType = 'success' | 'error' | 'notification' | 'click';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const soundConfigs: Record<SoundType, SoundConfig> = {
  success: { frequency: 1200, duration: 40, type: 'sine', volume: 0.1 },
  error: { frequency: 400, duration: 80, type: 'square', volume: 0.08 },
  notification: { frequency: 880, duration: 60, type: 'sine', volume: 0.1 },
  click: { frequency: 1000, duration: 20, type: 'sine', volume: 0.05 },
};

const STORAGE_KEY = 'farm-companion-sound-enabled';

export function useSoundFeedback() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Initialize audio context and load preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load user preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsEnabled(stored === 'true');
    }

    // Create audio context on first user interaction
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      }
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, [audioContext]);

  // Play a sound
  const playSound = useCallback(
    (type: SoundType) => {
      if (!isEnabled || !audioContext) return;

      // Respect reduced motion preference
      if (typeof window !== 'undefined') {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;
      }

      const config = soundConfigs[type];

      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + config.duration / 1000
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + config.duration / 1000);
      } catch {
        // Silently fail if audio not available
      }
    },
    [isEnabled, audioContext]
  );

  // Toggle sound preference
  const toggleSound = useCallback(() => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(newValue));
    }
  }, [isEnabled]);

  // Enable sound
  const enableSound = useCallback(() => {
    setIsEnabled(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, []);

  // Disable sound
  const disableSound = useCallback(() => {
    setIsEnabled(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'false');
    }
  }, []);

  return {
    isEnabled,
    toggleSound,
    enableSound,
    disableSound,
    playSuccess: () => playSound('success'),
    playError: () => playSound('error'),
    playNotification: () => playSound('notification'),
    playClick: () => playSound('click'),
  };
}

export default useSoundFeedback;
