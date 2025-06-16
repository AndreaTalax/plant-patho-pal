
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
    console.log('🎥 Starting camera initialization...', { facingMode });
    
    try {
      setIsLoading(true);
      setError(null);

      // Stop existing stream if any
      stopCamera();

      // Add small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Camera API non supportata su questo dispositivo';
        toast.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
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
      if (!videoRef.current) {
        console.log('❌ Video ref not available, stopping stream');
        mediaStream.getTracks().forEach(track => track.stop());
        setIsLoading(false);
        return;
      }

      setStream(mediaStream);

      // Wait for video to be ready with timeout
      const video = videoRef.current;
      video.srcObject = mediaStream;

      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.log('❌ Camera initialization timeout');
          reject(new Error('Camera initialization timeout'));
        }, 10000);

        const handleLoadedMetadata = () => {
          clearTimeout(timeoutId);
          
          video.play()
            .then(() => {
              console.log('✅ Camera initialized and playing');
              setIsLoading(false);
              resolve();
            })
            .catch((err) => {
              clearTimeout(timeoutId);
              console.error('❌ Error during video.play():', err);
              setError('Impossibile avviare il video della fotocamera');
              setIsLoading(false);
              reject(err);
            });
        };

        const handleError = (err: Event) => {
          clearTimeout(timeoutId);
          console.error('❌ Video error event:', err);
          setError('Errore nel caricamento del video');
          setIsLoading(false);
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
      
      setError(errorMessage);
      setIsLoading(false);
      toast.error(`Errore fotocamera: ${errorMessage}`);
    }
  }, [facingMode, stopCamera, setIsLoading, setError, setStream, setHasFlash, videoRef]);

  return { initializeCamera };
};
