
import { useState, useEffect } from 'react';

export const useMobileEnhancements = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const hour = new Date().getHours();
    return hour < 7 || hour > 19; // Dark mode dalle 19 alle 7
  });

  // Monitora stato connessione
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto dark mode basato sull'orario
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsDarkMode(hour < 7 || hour > 19);
    };

    const interval = setInterval(checkTime, 60000); // Controlla ogni minuto
    return () => clearInterval(interval);
  }, []);

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  return {
    isOnline,
    isDarkMode,
    setIsDarkMode,
    triggerHapticFeedback
  };
};
