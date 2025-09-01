import React, { useEffect, useState } from 'react';
import { toast as sonnerToast, type ToastT } from 'sonner';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '@/utils/hapticFeedback';

interface EnhancedToastProps {
  t: ToastT;
  toast: typeof sonnerToast;
}

export const EnhancedToast: React.FC<EnhancedToastProps> = ({ t, toast }) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
    triggerHaptic('light');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    if (Math.abs(deltaX) > 10) {
      setCurrentX(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(currentX) > 100) {
      triggerHaptic('medium');
      toast.dismiss(t.id);
    } else {
      setCurrentX(0);
    }
    setIsDragging(false);
  };

  const getIcon = () => {
    switch (t.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (t.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  useEffect(() => {
    if (t.duration && t.duration > 0) {
      const timer = setTimeout(() => {
        toast.dismiss(t.id);
      }, t.duration);

      return () => clearTimeout(timer);
    }
  }, [t.duration, t.id, toast]);

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border-l-4 ${getBorderColor()}
        transform transition-transform duration-200 cursor-pointer
        ${Math.abs(currentX) > 50 ? 'scale-95' : 'scale-100'}
      `}
      style={{ 
        transform: `translateX(${currentX}px) ${Math.abs(currentX) > 50 ? 'scale(0.95)' : 'scale(1)'}`,
        opacity: Math.max(0.3, 1 - Math.abs(currentX) / 200)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="alert"
      aria-live="polite"
      aria-label={`${t.type || 'notification'}: ${t.title || t.description}`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          {t.title && (
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {t.title}
            </div>
          )}
          {t.description && (
            <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              {t.description}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            triggerHaptic('light');
            toast.dismiss(t.id);
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Chiudi notifica"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Swipe indicator */}
      {Math.abs(currentX) > 50 && (
        <div className={`absolute inset-y-0 ${currentX > 0 ? 'right-4' : 'left-4'} flex items-center`}>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {Math.abs(currentX) > 100 ? 'Rilascia per chiudere' : 'Scorri per chiudere'}
          </div>
        </div>
      )}

      {/* Progress bar for timed toasts */}
      {t.duration && t.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${
              t.type === 'success' ? 'bg-green-500' :
              t.type === 'error' ? 'bg-red-500' :
              t.type === 'warning' ? 'bg-yellow-500' :
              t.type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
            }`}
            style={{ 
              animation: `shrink ${t.duration}ms linear forwards`,
              transformOrigin: 'left'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Enhanced toast functions with accessibility
export const enhancedToast = {
  success: (message: string, options?: { duration?: number; description?: string }) => {
    triggerHaptic('success');
    return sonnerToast.success(message, {
      duration: options?.duration || 4000,
      description: options?.description,
    });
  },

  error: (message: string, options?: { duration?: number; description?: string }) => {
    triggerHaptic('error');
    return sonnerToast.error(message, {
      duration: options?.duration || 5000,
      description: options?.description,
    });
  },

  warning: (message: string, options?: { duration?: number; description?: string }) => {
    triggerHaptic('warning');
    return sonnerToast.warning(message, {
      duration: options?.duration || 4000,
      description: options?.description,
    });
  },

  info: (message: string, options?: { duration?: number; description?: string }) => {
    triggerHaptic('light');
    return sonnerToast.info(message, {
      duration: options?.duration || 3000,
      description: options?.description,
    });
  },

  dismiss: (id?: string | number) => {
    triggerHaptic('light');
    return sonnerToast.dismiss(id);
  }
};