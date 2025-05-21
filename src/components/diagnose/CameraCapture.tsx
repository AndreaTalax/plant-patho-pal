
import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import CameraControls from './camera/CameraControls';
import { Loader2, Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        
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
