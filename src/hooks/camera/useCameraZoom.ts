import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ZoomState {
  zoomLevel: number;
  transform: string;
}

export const useCameraZoom = () => {
  const [zoomState, setZoomState] = useState<ZoomState>({
    zoomLevel: 1,
    transform: 'scale(1)'
  });

  const setZoom = useCallback((level: number) => {
    const clampedLevel = Math.max(1, Math.min(3, level));
    setZoomState({
      zoomLevel: clampedLevel,
      transform: `scale(${clampedLevel})`
    });
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    toast.success(`Zoom ${clampedLevel.toFixed(1)}x`, { duration: 1000 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(Math.min(3, zoomState.zoomLevel + 0.5));
  }, [zoomState.zoomLevel, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(Math.max(1, zoomState.zoomLevel - 0.5));
  }, [zoomState.zoomLevel, setZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  return {
    zoomLevel: zoomState.zoomLevel,
    transform: zoomState.transform,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom
  };
};