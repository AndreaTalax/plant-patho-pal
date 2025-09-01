
import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface EnhancedToastProps {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EnhancedToast: React.FC<EnhancedToastProps> = ({
  type,
  title,
  description,
  duration = 5000,
  onDismiss,
  action
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [startX, setStartX] = useState<number | null>(null);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    
    // Se swipe verso destra di almeno 100px, chiudi il toast
    if (diffX > 100) {
      setIsVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }
  };

  const handleTouchEnd = () => {
    setStartX(null);
  };

  // Auto-dismiss dopo il duration specificato
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed top-4 right-4 max-w-sm w-full
        ${getColorClass()}
        border-l-4 border rounded-lg shadow-lg p-4
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        z-50
      `}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          {description && (
            <p className="text-gray-600 text-xs mt-1">{description}</p>
          )}
          
          {action && (
            <Button
              onClick={action.onClick}
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs"
            >
              {action.label}
            </Button>
          )}
        </div>
        
        <Button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss?.(), 300);
          }}
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-gray-200"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="text-xs text-gray-400 mt-2">
        ← Scorri per chiudere
      </div>
    </div>
  );
};

export default EnhancedToast;
