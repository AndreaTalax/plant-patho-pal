
import { useRef, useCallback } from 'react';
import { useCameraState } from './camera/useCameraState';
import { useCameraCapture } from './camera/useCameraCapture';
import { useCameraControls } from './camera/useCameraControls';
import { useCameraInitialization } from './camera/useCameraInitialization';
import type { CameraHookReturn } from './camera/types';

export const useCamera = (): CameraHookReturn => {
  const [state, setters] = useCameraState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const refs = { videoRef, canvasRef };

  const stopCamera = useCallback(() => {
    if (state.stream) {
      console.log('🛑 Stopping camera stream:', state.stream.id);
      state.stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Camera track stopped:', track.kind);
      });
      setters.setStream(null);
    }
  }, [state.stream, setters]);

  const { capturePhoto } = useCameraCapture(refs);
  const { switchCamera, toggleFlash } = useCameraControls(state, setters);
  const { initializeCamera } = useCameraInitialization(state, setters, refs, stopCamera);

  return {
    isLoading: state.isLoading,
    error: state.error,
    stream: state.stream,
    videoRef,
    canvasRef,
    facingMode: state.facingMode,
    hasFlash: state.hasFlash,
    flashEnabled: state.flashEnabled,
    initializeCamera,
    switchCamera,
    toggleFlash,
    capturePhoto,
    stopCamera
  };
};
