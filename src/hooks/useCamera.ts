
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
  }, [facingMode, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
    console.log('🔄 Switching camera facing mode...');
  }, []);

  const toggleFlash = useCallback(async () => {
    if (!stream || !hasFlash) {
      toast.error('Flash non supportato su questo dispositivo');
      return;
    }

    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
        toast.success(`Flash ${!flashEnabled ? 'abilitato' : 'disabilitato'}`);
      }
    } catch (error) {
      console.error('Flash toggle error:', error);
      toast.error('Errore durante attivazione/disattivazione flash');
    }
  }, [stream, hasFlash, flashEnabled]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Fotocamera non pronta all\'acquisizione');
      console.error('❌ videoRef o canvasRef null alla cattura!');
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        toast.error('Canvas context non disponibile');
        console.error('❌ Canvas context non disponibile durante scatto!');
        return null;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      if (canvas.width === 0 || canvas.height === 0) {
        toast.error('La fotocamera non ha fornito frame validi. Riprova o verifica i permessi.');
        console.error('❌ Video dimensioni non valide alla cattura!');
        return null;
      }

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
        toast.error('Errore nella generazione della foto!');
        console.error('❌ Impossibile generare imageDataUrl');
        return null;
      }

      console.log('📸 Photo captured successfully');
      toast.success('Foto acquisita!');
      return imageDataUrl;

    } catch (error) {
      console.error('Errore durante acquisizione foto:', error);
      toast.error('Errore durante la cattura della foto');
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
