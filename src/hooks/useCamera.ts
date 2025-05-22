
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
  // Start camera
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints: MediaStreamConstraints = { 
          video: { 
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };
        
        // Add flashlight constraint for supported devices
        if (flashMode) {
          // Use type assertion to handle the torch constraint
          (constraints.video as ExtendedMediaTrackConstraintSet).advanced = [{ torch: true }];
        }
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            onCameraLoad();
          };
        }
      } else {
        throw new Error("Camera not supported by your browser");
      }
    } catch (err) {
      console.error("Camera error:", err);
      onCameraError(err instanceof Error ? err.message : "Failed to access camera");
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Toggle flash
  const toggleFlash = async (): Promise<boolean> => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        
        // Check if flashlight is supported
        const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;
        if (!capabilities.torch) {
          toast.error("Il flash non è supportato su questo dispositivo", { 
            duration: 2000 
          });
          return false;
        }
        
        // Toggle flash state
        const newFlashMode = !flashMode;
        
        // Apply to track
        await track.applyConstraints({
          advanced: [{ torch: newFlashMode } as ExtendedMediaTrackConstraintSet]
        });
        
        toast.success(newFlashMode ? "Flash attivato" : "Flash disattivato", {
          duration: 1500
        });
        
        return newFlashMode;
      }
      return false;
    } catch (error) {
      console.error("Error toggling flash:", error);
      toast.error("Impossibile attivare il flash", { duration: 2000 });
      return false;
    }
  };

  return {
    startCamera,
    stopCamera,
    toggleFlash
  };
};
