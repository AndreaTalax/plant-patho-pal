
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface CameraHookReturn {
  isLoading: boolean;
  error: string | null;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  facingMode: 'user' | 'environment';
  hasFlash: boolean;
  flashEnabled: boolean;
  initializeCamera: () => Promise<void>;
  switchCamera: () => void;
  toggleFlash: () => Promise<void>;
  capturePhoto: () => string | null;
  stopCamera: () => void;
}

export const useCamera = (): CameraHookReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.kind);
      });
      setStream(null);
    }
  }, [stream]);

  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop existing stream if any
      stopCamera();

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Request camera permissions with constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      console.log('Requesting camera access with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }

          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log('Camera initialized successfully');
                  resolve();
                })
                .catch(reject);
            }
          };
        });

        // Check for flash capability
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack && 'getCapabilities' in videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          setHasFlash(!!(capabilities as any).torch);
        }
      }

      setIsLoading(false);
      toast.success('Camera initialized successfully');

    } catch (err) {
      console.error('Camera initialization error:', err);
      let errorMessage = 'Unknown camera error';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera configuration not supported.';
        } else {
          errorMessage = err.message || 'Unable to access camera';
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      toast.error(`Camera error: ${errorMessage}`);
    }
  }, [facingMode, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
    toast.info('Switching camera...');
  }, []);

  const toggleFlash = useCallback(async () => {
    if (!stream || !hasFlash) {
      toast.error('Flash not supported on this device');
      return;
    }

    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
        toast.success(`Flash ${!flashEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Flash toggle error:', error);
      toast.error('Failed to toggle flash');
    }
  }, [stream, hasFlash, flashEnabled]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        toast.error('Canvas context not available');
        return null;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      console.log('Photo captured successfully');
      toast.success('Photo captured successfully!');
      return imageDataUrl;

    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture photo');
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    stream,
    videoRef,
    canvasRef,
    facingMode,
    hasFlash,
    flashEnabled,
    initializeCamera,
    switchCamera,
    toggleFlash,
    capturePhoto,
    stopCamera
  };
};
