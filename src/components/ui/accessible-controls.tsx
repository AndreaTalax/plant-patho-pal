import React from 'react';
import { AccessibleButton, AccessibleButtonProps } from './accessible-button';
import { Card } from './card';
import { cn } from '@/lib/utils';
import { useAccessibleGestures } from '@/hooks/useAccessibleGestures';

interface AccessibleControlPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const AccessibleControlPanel: React.FC<AccessibleControlPanelProps> = ({
  children,
  className,
  title,
  description
}) => {
  return (
    <Card className={cn(
      'p-4 focus-within:ring-2 focus-within:ring-primary',
      'bg-background/95 backdrop-blur-sm',
      className
    )}>
      {title && (
        <h3 className="text-sm font-medium mb-2 text-foreground">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mb-3">
          {description}
        </p>
      )}
      <div className="flex flex-wrap gap-2 justify-center">
        {children}
      </div>
    </Card>
  );
};

interface AccessibleToggleProps extends Omit<AccessibleButtonProps, 'variant'> {
  active?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export const AccessibleToggle: React.FC<AccessibleToggleProps> = ({
  active = false,
  activeLabel = 'Attivo',
  inactiveLabel = 'Inattivo',
  label,
  ...props
}) => {
  const status = active ? activeLabel : inactiveLabel;
  const fullLabel = label ? `${label}: ${status}` : status;

  return (
    <AccessibleButton
      variant={active ? 'default' : 'outline'}
      label={fullLabel}
      className={cn(
        'transition-colors',
        active && 'bg-primary text-primary-foreground'
      )}
      {...props}
    />
  );
};

interface AccessibleSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  onChange: (value: number) => void;
  onIncrease?: () => void;
  onDecrease?: () => void;
  formatValue?: (value: number) => string;
  className?: string;
}

export const AccessibleSlider: React.FC<AccessibleSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  label,
  onChange,
  onIncrease,
  onDecrease,
  formatValue = (v) => v.toString(),
  className
}) => {
  const increase = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
    onIncrease?.();
  };

  const decrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
    onDecrease?.();
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {formatValue(value)}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <AccessibleButton
          size="sm"
          variant="outline"
          onClick={decrease}
          disabled={value <= min}
          label={`Diminuisci ${label}`}
          className="h-8 w-8 p-0"
        >
          -
        </AccessibleButton>
        
        <div className="flex-1 relative">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`${label}: ${formatValue(value)}`}
          />
        </div>
        
        <AccessibleButton
          size="sm"
          variant="outline"
          onClick={increase}
          disabled={value >= max}
          label={`Aumenta ${label}`}
          className="h-8 w-8 p-0"
        >
          +
        </AccessibleButton>
      </div>
    </div>
  );
};

interface AccessibleTouchAreaProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onDoubleClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  label?: string;
  className?: string;
  hapticFeedback?: boolean;
}

export const AccessibleTouchArea: React.FC<AccessibleTouchAreaProps> = ({
  children,
  onPress,
  onLongPress,
  onDoubleClick,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  label,
  className,
  hapticFeedback = true
}) => {
  const { gestureProps, classNames } = useAccessibleGestures(
    {
      onClick: onPress,
      onLongPress,
      onDoubleClick,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
    },
    {
      hapticFeedback,
      largerTouchArea: true,
      voiceAnnouncements: true,
    },
    label
  );

  return (
    <div
      className={cn(
        'min-w-[48px] min-h-[48px] flex items-center justify-center',
        'focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'focus:outline-none cursor-pointer',
        'transition-all duration-200 active:scale-95',
        classNames,
        className
      )}
      {...gestureProps}
    >
      {children}
    </div>
  );
};