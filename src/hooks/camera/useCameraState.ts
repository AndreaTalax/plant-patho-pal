
import { useState } from 'react';
import type { CameraState } from './types';

export const useCameraState = (): [
  CameraState,
  {
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setStream: (stream: MediaStream | null) => void;
    setFacingMode: (mode: 'user' | 'environment') => void;
    setHasFlash: (hasFlash: boolean) => void;
    setFlashEnabled: (enabled: boolean) => void;
  }
] => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  const state: CameraState = {
    isLoading,
    error,
    stream,
    facingMode,
    hasFlash,
    flashEnabled,
  };

  const setters = {
    setIsLoading,
    setError,
    setStream,
    setFacingMode,
    setHasFlash,
    setFlashEnabled,
  };

  return [state, setters];
};
