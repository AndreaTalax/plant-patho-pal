import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAccessibleGestures } from '@/hooks/useAccessibleGestures';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: () => void;
  onLongPress?: () => void;
  onDoubleClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  label?: string;
  hapticFeedback?: boolean;
  voiceAnnouncements?: boolean;
  largerTouchArea?: boolean;
  longPressDelay?: number;
  enableSwipe?: boolean;
}

const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    onClick,
    onLongPress,
    onDoubleClick,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    label,
    hapticFeedback = true,
    voiceAnnouncements = true,
    largerTouchArea = true,
    longPressDelay = 800,
    enableSwipe = false,
    className,
    children,
    disabled,
    ...props
  }, ref) => {
    const { gestureProps, isPressed, classNames } = useAccessibleGestures(
      {
        onClick,
        onLongPress,
        onDoubleClick,
        onSwipeLeft: enableSwipe ? onSwipeLeft : undefined,
        onSwipeRight: enableSwipe ? onSwipeRight : undefined,
        onSwipeUp: enableSwipe ? onSwipeUp : undefined,
        onSwipeDown: enableSwipe ? onSwipeDown : undefined,
      },
      {
        hapticFeedback,
        voiceAnnouncements,
        largerTouchArea,
        longPressDelay,
      },
      label
    );

    return (
      <Button
        ref={ref}
        className={cn(
          // Base accessibility styles
          'focus:ring-2 focus:ring-offset-2 focus:ring-primary',
          'focus:outline-none transition-all duration-200',
          // Larger touch area for accessibility
          largerTouchArea && 'min-w-[48px] min-h-[48px]',
          // Visual feedback for pressed state
          isPressed && 'scale-95 brightness-90',
          // High contrast mode support
          'contrast-more:border-2 contrast-more:border-current',
          classNames,
          className
        )}
        disabled={disabled}
        {...props}
        {...(disabled ? {} : gestureProps)}
        aria-label={label || props['aria-label']}
        aria-describedby={
          onLongPress || onDoubleClick 
            ? `${props.id || 'button'}-description` 
            : props['aria-describedby']
        }
      >
        {children}
        {/* Hidden description for screen readers */}
        {(onLongPress || onDoubleClick) && (
          <span 
            id={`${props.id || 'button'}-description`}
            className="sr-only"
          >
            {onLongPress && 'Pressione lunga per azioni aggiuntive. '}
            {onDoubleClick && 'Doppio tocco per azioni alternative. '}
            {enableSwipe && 'Scorri per navigare. '}
          </span>
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export { AccessibleButton };
export type { AccessibleButtonProps };