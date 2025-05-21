
import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import CameraControls from './camera/CameraControls';
import { Loader2, Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { measurePlantFeatureQuality } from '@/utils/plant-analysis/image-utils';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  videoRef,
  canvasRef
}) => {
  const isMobile = useIsMobile();
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCaptureProcessing, setIsCaptureProcessing] = useState(false);
  const [flashMode, setFlashMode] = useState<boolean>(false);
  
  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    
    // Cleanup on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [facingMode]);
  
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = { 
          video: { 
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };
        
        // Add flashlight constraint for supported devices
        if (flashMode) {
          // @ts-ignore - Advanced constraints not in TypeScript defs
          constraints.video.advanced = [{ torch: true }];
        }
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setCameraLoading(false);
          };
        }
      } else {
        throw new Error("Camera not supported by your browser");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err instanceof Error ? err.message : "Failed to access camera");
      setCameraLoading(false);
    }
  };

  const handleCapture = async () => {
    setIsCaptureProcessing(true);
    
    try {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current video frame on the canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert the canvas to a data URL and pass it to the parent
          try {
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            // Evaluate image quality for plant detection
            const imageFile = new File(
              [await (await fetch(imageDataUrl)).blob()], 
              "camera-capture.jpg", 
              { type: "image/jpeg" }
            );
            const qualityScore = await measurePlantFeatureQuality(imageFile);
            
            // Warn user if the image quality is poor
            if (qualityScore < 0.3) {
              toast.warning("La qualità dell'immagine è bassa. Prova con più luce o avvicinati alla pianta.", {
                duration: 4000
              });
            }
            
            onCapture(imageDataUrl);
          } catch (err) {
            console.error("Error capturing image:", err);
            setCameraError("Errore durante l'acquisizione dell'immagine");
          }
        }
      }
    } finally {
      setIsCaptureProcessing(false);
    }
  };
  
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Try to toggle device torch/flashlight
  const toggleFlash = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        
        // Check if flashlight is supported
        const capabilities = track.getCapabilities();
        if (!capabilities.torch) {
          toast.error("Il flash non è supportato su questo dispositivo", { 
            duration: 2000 
          });
          return;
        }
        
        // Toggle flash state
        const newFlashMode = !flashMode;
        setFlashMode(newFlashMode);
        
        // Apply to track
        await track.applyConstraints({
          advanced: [{ torch: newFlashMode }]
        });
        
        toast.success(newFlashMode ? "Flash attivato" : "Flash disattivato", {
          duration: 1500
        });
      }
    } catch (error) {
      console.error("Error toggling flash:", error);
      toast.error("Impossibile attivare il flash", { duration: 2000 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {cameraLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Attivazione fotocamera...</p>
          </div>
        </div>
      )}
      
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="bg-white p-4 rounded-lg max-w-xs w-full">
            <div className="flex justify-center mb-4">
              <CameraOff className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-center">Errore Fotocamera</h3>
            <p className="text-red-500 text-center mb-2">{cameraError}</p>
            <p className="mt-2 text-sm">Assicurati di aver concesso i permessi per la fotocamera. Puoi anche provare a caricare un'immagine dalla galleria.</p>
            <Button className="w-full mt-4" onClick={onCancel}>Chiudi</Button>
          </div>
        </div>
      )}
      
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted
        className="w-full h-full object-cover"
        onError={() => {
          setCameraError("Errore durante il caricamento della fotocamera");
          setCameraLoading(false);
        }}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Flash toggle button - only shown on mobile and when camera is active */}
      {isMobile && !cameraLoading && !cameraError && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white bg-black bg-opacity-30 hover:bg-opacity-40 z-20"
          onClick={toggleFlash}
        >
          {flashMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M6 18h8l-4.7-4.7A1 1 0 0 0 8 14V8h-2v6a1 1 0 0 0 .3.7L6 18z"/>
              <path d="M14 18l4-7h-5V4l-6 11h5v3z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M6 18h8l-4.7-4.7A1 1 0 0 0 8 14V8h-2v6a1 1 0 0 0 .3.7L6 18z"/>
              <line x1="2" y1="2" x2="22" y2="22"/>
            </svg>
          )}
        </Button>
      )}
      
      <CameraControls 
        onCapture={handleCapture}
        onCancel={onCancel}
        isMobile={isMobile}
        canFlipCamera={isMobile}
        onFlipCamera={handleFlipCamera}
        isProcessing={isCaptureProcessing}
      />
    </div>
  );
};

export default CameraCapture;
