/**
 * Utility functions for haptic feedback
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning' | 'photo' | 'message_sent' | 'reaction';

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
  },

  // Feedback specifici per azioni importanti
  photo: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 30, 100, 30, 200]); // Pattern distintivo per foto
    }
  },

  message_sent: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 25, 100]); // Pattern per messaggio inviato
    }
  },

  reaction: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]); // Pattern leggero per reazioni
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