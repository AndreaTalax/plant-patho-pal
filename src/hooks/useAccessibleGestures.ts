import { useState, useCallback, useEffect, useRef } from 'react';
import { triggerHaptic } from '@/utils/hapticFeedback';
import { accessibilityManager } from '@/utils/accessibility';

interface GestureConfig {
  longPressDelay?: number;
  doubleTapDelay?: number;
  swipeThreshold?: number;
  largerTouchArea?: boolean;
  hapticFeedback?: boolean;
  voiceAnnouncements?: boolean;
}

interface GestureHandlers {
  onClick?: () => void;
  onLongPress?: () => void;
  onDoubleClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onKeyboardActivate?: () => void;
}

const DEFAULT_CONFIG: Required<GestureConfig> = {
  longPressDelay: 800,
  doubleTapDelay: 300,
  swipeThreshold: 50,
  largerTouchArea: true,
  hapticFeedback: true,
  voiceAnnouncements: true
};

export const useAccessibleGestures = (
  handlers: GestureHandlers,
  config: GestureConfig = {},
  label?: string
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsPressed(false);
  }, [longPressTimer]);

  // Long press handler
  const handleLongPress = useCallback(() => {
    if (handlers.onLongPress) {
      if (finalConfig.hapticFeedback) triggerHaptic('medium');
      if (finalConfig.voiceAnnouncements && label) {
        accessibilityManager.announce(`Pressione lunga su ${label}`);
      }
      handlers.onLongPress();
    }
    cleanup();
  }, [handlers.onLongPress, finalConfig.hapticFeedback, finalConfig.voiceAnnouncements, label, cleanup]);

  // Touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsPressed(true);
    
    if (finalConfig.hapticFeedback) triggerHaptic('light');
    
    // Start long press timer
    if (handlers.onLongPress) {
      const timer = setTimeout(handleLongPress, finalConfig.longPressDelay);
      setLongPressTimer(timer);
    }
  }, [handlers.onLongPress, finalConfig.longPressDelay, finalConfig.hapticFeedback, handleLongPress]);

  // Touch end handler
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const now = Date.now();
    
    if (touchStart && touch) {
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Check for swipe gestures
      if (distance > finalConfig.swipeThreshold) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        if (finalConfig.hapticFeedback) triggerHaptic('light');
        
        if (angle >= -45 && angle <= 45 && handlers.onSwipeRight) {
          if (finalConfig.voiceAnnouncements) accessibilityManager.announce('Scorrimento a destra');
          handlers.onSwipeRight();
        } else if (angle >= 135 || angle <= -135 && handlers.onSwipeLeft) {
          if (finalConfig.voiceAnnouncements) accessibilityManager.announce('Scorrimento a sinistra');
          handlers.onSwipeLeft();
        } else if (angle >= 45 && angle <= 135 && handlers.onSwipeDown) {
          if (finalConfig.voiceAnnouncements) accessibilityManager.announce('Scorrimento in basso');
          handlers.onSwipeDown();
        } else if (angle >= -135 && angle <= -45 && handlers.onSwipeUp) {
          if (finalConfig.voiceAnnouncements) accessibilityManager.announce('Scorrimento in alto');
          handlers.onSwipeUp();
        }
      } else {
        // Handle tap/click
        if (now - lastTap < finalConfig.doubleTapDelay && handlers.onDoubleClick) {
          if (finalConfig.hapticFeedback) triggerHaptic('medium');
          if (finalConfig.voiceAnnouncements && label) {
            accessibilityManager.announce(`Doppio tocco su ${label}`);
          }
          handlers.onDoubleClick();
          setLastTap(0);
        } else {
          setLastTap(now);
          setTimeout(() => {
            if (Date.now() - now >= finalConfig.doubleTapDelay && handlers.onClick) {
              if (finalConfig.hapticFeedback) triggerHaptic('light');
              if (finalConfig.voiceAnnouncements && label) {
                accessibilityManager.announce(`Tocco su ${label}`);
              }
              handlers.onClick();
            }
          }, finalConfig.doubleTapDelay);
        }
      }
    }
    
    cleanup();
    setTouchStart(null);
  }, [touchStart, lastTap, finalConfig, handlers, cleanup, label]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (finalConfig.hapticFeedback) triggerHaptic('light');
      if (finalConfig.voiceAnnouncements && label) {
        accessibilityManager.announce(`Attivazione tastiera su ${label}`);
      }
      if (handlers.onKeyboardActivate || handlers.onClick) {
        (handlers.onKeyboardActivate || handlers.onClick)?.();
      }
    }
  }, [handlers.onClick, handlers.onKeyboardActivate, finalConfig.hapticFeedback, finalConfig.voiceAnnouncements, label]);

  // Mouse handlers for desktop compatibility
  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    if (handlers.onLongPress) {
      const timer = setTimeout(handleLongPress, finalConfig.longPressDelay);
      setLongPressTimer(timer);
    }
  }, [handlers.onLongPress, finalConfig.longPressDelay, handleLongPress]);

  const handleMouseUp = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const handleMouseLeave = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Focus management
  const handleFocus = useCallback(() => {
    if (finalConfig.voiceAnnouncements && label) {
      accessibilityManager.announce(`Focus su ${label}`);
    }
  }, [finalConfig.voiceAnnouncements, label]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    gestureProps: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      tabIndex: 0,
      role: 'button',
      'aria-label': label,
      style: {
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        KhtmlUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      } as React.CSSProperties
    },
    isPressed,
    cleanup,
    classNames: finalConfig.largerTouchArea ? 'min-w-[48px] min-h-[48px] p-2' : ''
  };
};