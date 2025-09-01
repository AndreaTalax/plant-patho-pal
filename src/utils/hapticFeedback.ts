/**
 * Utility functions for haptic feedback
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning';

export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
  },
  
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },
  
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 25, 50, 25, 50]);
    }
  },
  
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([75, 50, 75]);
    }
  }
};

/**
 * Trigger haptic feedback by type
 */
export const triggerHaptic = (type: HapticType) => {
  hapticFeedback[type]();
};

/**
 * Custom vibration pattern
 */
export const customVibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};