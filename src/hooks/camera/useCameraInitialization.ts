
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { CameraState, CameraRefs } from './types';

export const useCameraInitialization = (
  state: CameraState,
  setters: {
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setStream: (stream: MediaStream | null) => void;
    setHasFlash: (hasFlash: boolean) => void;
  },
  refs: CameraRefs,
  stopCamera: () => void
) => {
  const { facingMode } = state;
  const { setIsLoading, setError, setStream, setHasFlash } = setters;
  const { videoRef } = refs;

  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop existing stream if any
      stopCamera();

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera API non supportata su questo dispositivo');
        setError('Camera API non supportata su questo dispositivo');
        setIsLoading(false);
        return;
      }

      console.log('🎥 Requesting camera access...');

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

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera access granted');
      
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }

          const video = videoRef.current;
          
          const handleLoadedMetadata = () => {
            video.play()
              .then(() => {
                console.log('✅ Camera initialized and playing');
                setIsLoading(false);
                resolve();
              })
              .catch((err) => {
                console.error('Errore durante video.play():', err);
                setError('Impossibile avviare il video della fotocamera');
                setIsLoading(false);
                reject(err);
              });
          };

          video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
          
          // Fallback timeout
          setTimeout(() => {
            reject(new Error('Camera initialization timeout'));
          }, 10000);
        });

        // Check for flash capability
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack && 'getCapabilities' in videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          setHasFlash(!!(capabilities as any).torch);
        }
      }

    } catch (err) {
      console.error('❌ Camera initialization error:', err);
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
  }, [facingMode, stopCamera, setIsLoading, setError, setStream, setHasFlash, videoRef]);

  return { initializeCamera };
};
