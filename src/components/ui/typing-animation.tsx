import React from 'react';

interface TypingAnimationProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  size = 'medium',
  color = 'currentColor',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-1 h-1',
    medium: 'w-2 h-2', 
    large: 'w-3 h-3'
  };

  const containerClasses = {
    small: 'gap-1',
    medium: 'gap-1.5',
    large: 'gap-2'
  };

  return (
    <div 
      className={`flex items-center ${containerClasses[size]} ${className}`}
      role="status"
      aria-label="Sta scrivendo"
    >
      <div 
        className={`${sizeClasses[size]} rounded-full animate-bounce`}
        style={{ 
          backgroundColor: color,
          animationDelay: '0ms',
          animationDuration: '1.4s'
        }}
      />
      <div 
        className={`${sizeClasses[size]} rounded-full animate-bounce`}
        style={{ 
          backgroundColor: color,
          animationDelay: '160ms',
          animationDuration: '1.4s'
        }}
      />
      <div 
        className={`${sizeClasses[size]} rounded-full animate-bounce`}
        style={{ 
          backgroundColor: color,
          animationDelay: '320ms',
          animationDuration: '1.4s'
        }}
      />
    </div>
  );
};

interface TypingIndicatorProps {
  show: boolean;
  message?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  show,
  message = 'Sta scrivendo',
  className = ''
}) => {
  if (!show) return null;

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
      <TypingAnimation size="small" color="rgb(107, 114, 128)" />
      <span className="animate-pulse">{message}...</span>
    </div>
  );
};