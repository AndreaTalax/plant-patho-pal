
import { useCallback, useRef } from 'react';
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
  refs: CameraRefs
) => {
  const { facingMode } = state;
  const { setIsLoading, setError, setStream, setHasFlash } = setters;
  const { videoRef } = refs;
  
  // Use ref to track initialization state and prevent loops
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  const initializeCamera = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (initializingRef.current) {
      console.log('🎥 Camera initialization already in progress, skipping...');
      return;
    }

    // Check if component is still mounted
    if (!mountedRef.current) {
      console.log('🎥 Component unmounted, skipping camera initialization');
      return;
    }

    console.log('🎥 Starting camera initialization...', { facingMode });
    
    try {
      initializingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Camera API non supportata su questo dispositivo';
        toast.error(errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('🎥 Requesting camera access with facingMode:', facingMode);

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
      console.log('✅ Camera access granted, stream:', mediaStream.id);
      
      // Check if component is still mounted and video ref exists
      if (!mountedRef.current || !videoRef.current) {
        console.log('❌ Component unmounted or video ref not available, stopping stream');
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      setStream(mediaStream);

      // Set up video element
      const video = videoRef.current;
      video.srcObject = mediaStream;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.log('❌ Camera initialization timeout');
          reject(new Error('Camera initialization timeout'));
        }, 10000);

        const handleLoadedMetadata = () => {
          clearTimeout(timeoutId);
          
          if (!mountedRef.current) {
            reject(new Error('Component unmounted during initialization'));
            return;
          }
          
          video.play()
            .then(() => {
              console.log('✅ Camera initialized and playing');
              resolve();
            })
            .catch((err) => {
              console.error('❌ Error during video.play():', err);
              reject(err);
            });
        };

        const handleError = (err: Event) => {
          clearTimeout(timeoutId);
          console.error('❌ Video error event:', err);
          reject(new Error('Video loading error'));
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('error', handleError, { once: true });
      });

      // Check for flash capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack && 'getCapabilities' in videoTrack) {
        try {
          const capabilities = videoTrack.getCapabilities();
          const hasFlashCapability = !!(capabilities as any).torch;
          setHasFlash(hasFlashCapability);
          console.log('🔦 Flash capability:', hasFlashCapability);
        } catch (capError) {
          console.log('ℹ️ Could not check flash capabilities:', capError);
          setHasFlash(false);
        }
      }

    } catch (err) {
      console.error('❌ Camera initialization error:', err);
      let errorMessage = 'Errore sconosciuto della fotocamera';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Accesso alla fotocamera negato. Concedi i permessi alla fotocamera.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Nessuna fotocamera trovata su questo dispositivo.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'La fotocamera è già in uso da un\'altra applicazione.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Configurazione fotocamera non supportata.';
        } else {
          errorMessage = err.message || 'Impossibile accedere alla fotocamera';
        }
      }
      
      if (mountedRef.current) {
        setError(errorMessage);
        toast.error(`Errore fotocamera: ${errorMessage}`);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      initializingRef.current = false;
    }
  }, [facingMode, setIsLoading, setError, setStream, setHasFlash, videoRef]);

  // Cleanup function to call when component unmounts
  const cleanup = useCallback(() => {
    mountedRef.current = false;
    initializingRef.current = false;
  }, []);

  return { initializeCamera, cleanup };
};
