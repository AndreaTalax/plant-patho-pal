
import { useState, useEffect, RefObject } from 'react';
import { toast } from 'sonner';

// Define interfaces for torch capabilities
export interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

// Define interfaces for torch constraints
export interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
  advanced?: ExtendedMediaTrackConstraintSet[];
}

interface UseCameraOptions {
  videoRef: RefObject<HTMLVideoElement>;
  facingMode: 'user' | 'environment';
  flashMode: boolean;
  onCameraError: (error: string) => void;
  onCameraLoad: () => void;
}

export const useCamera = ({
  videoRef,
  facingMode,
  flashMode,
  onCameraError,
  onCameraLoad
}: UseCameraOptions) => {
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [hasFlash, setHasFlash] = useState(false);

  // Clean up stream when component unmounts
  useEffect(() => {
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStream]);

  // Start camera
  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        setCurrentStream(null);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Fotocamera non supportata dal browser");
      }

      const constraints: MediaStreamConstraints = { 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        }
      };
      
      console.log("Richiesta accesso alla fotocamera con constraints:", constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCurrentStream(stream);
        
        // Check for flash capability
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && 'getCapabilities' in videoTrack) {
          const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
          setHasFlash(!!capabilities.torch);
        }
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log("Fotocamera attivata con successo");
          onCameraLoad();
        };
        
        videoRef.current.onerror = (error) => {
          console.error("Errore video element:", error);
          onCameraError("Errore durante la riproduzione video");
        };
      }
    } catch (err) {
      console.error("Errore fotocamera:", err);
      let errorMessage = "Errore sconosciuto";
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = "Accesso alla fotocamera negato. Controlla i permessi del browser.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "Nessuna fotocamera trovata sul dispositivo.";
        } else if (err.name === 'NotReadableError') {
          errorMessage = "Fotocamera in uso da un'altra applicazione.";
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = "Configurazione fotocamera non supportata.";
        } else {
          errorMessage = err.message || "Impossibile accedere alla fotocamera";
        }
      }
      
      onCameraError(errorMessage);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    try {
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          track.stop();
          console.log("Track fermato:", track.kind);
        });
        setCurrentStream(null);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      console.log("Fotocamera spenta correttamente");
    } catch (error) {
      console.error("Errore durante la chiusura della fotocamera:", error);
    }
  };

  // Toggle flash
  const toggleFlash = async () => {
    if (!currentStream || !hasFlash) {
      toast.error('Flash non supportato su questo dispositivo');
      return;
    }

    try {
      const videoTrack = currentStream.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: flashMode } as ExtendedMediaTrackConstraintSet]
        });
        toast.success(`Flash ${flashMode ? 'attivato' : 'disattivato'}`);
      }
    } catch (error) {
      console.error('Errore toggle flash:', error);
      toast.error('Impossibile cambiare il flash');
    }
  };

  return {
    currentStream,
    hasFlash,
    startCamera,
    stopCamera,
    toggleFlash
  };
};
