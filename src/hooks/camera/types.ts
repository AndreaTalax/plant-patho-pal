
import { RefObject } from 'react';

export interface CameraHookReturn {
  isLoading: boolean;
  error: string | null;
  stream: MediaStream | null;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  facingMode: 'user' | 'environment';
  hasFlash: boolean;
  flashEnabled: boolean;
  initializeCamera: () => Promise<void>;
  switchCamera: () => void;
  toggleFlash: () => Promise<void>;
  capturePhoto: () => string | null;
  stopCamera: () => void;
}

export interface CameraState {
  isLoading: boolean;
  error: string | null;
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  hasFlash: boolean;
  flashEnabled: boolean;
}

export interface CameraRefs {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
}
