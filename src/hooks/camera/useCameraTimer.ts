import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export type TimerDuration = 0 | 3 | 10;

interface TimerState {
  duration: TimerDuration;
  isActive: boolean;
  countdown: number;
}

export const useCameraTimer = () => {
  const [timerState, setTimerState] = useState<TimerState>({
    duration: 0,
    isActive: false,
    countdown: 0
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const setTimerDuration = useCallback((duration: TimerDuration) => {
    setTimerState(prev => ({ ...prev, duration }));
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
    
    if (duration > 0) {
      toast.success(`Timer impostato a ${duration} secondi`);
    } else {
      toast.success('Timer disattivato');
    }
  }, []);

  const startTimer = useCallback((onComplete: () => void) => {
    if (timerState.duration === 0) {
      onComplete();
      return;
    }

    setTimerState(prev => ({ ...prev, isActive: true, countdown: prev.duration }));
    
    let count = timerState.duration;
    intervalRef.current = setInterval(() => {
      count--;
      setTimerState(prev => ({ ...prev, countdown: count }));
      
      // Haptic feedback for countdown
      if ('vibrate' in navigator) {
        navigator.vibrate(count === 0 ? [100, 50, 100] : 30);
      }
      
      if (count === 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimerState(prev => ({ ...prev, isActive: false, countdown: 0 }));
        onComplete();
      }
    }, 1000);
  }, [timerState.duration]);

  const cancelTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerState(prev => ({ ...prev, isActive: false, countdown: 0 }));
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    duration: timerState.duration,
    isActive: timerState.isActive,
    countdown: timerState.countdown,
    setTimerDuration,
    startTimer,
    cancelTimer,
    cleanup
  };
};