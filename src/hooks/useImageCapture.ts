
import { useState, RefObject } from 'react';
import { measurePlantFeatureQuality } from '@/utils/plant-analysis/image-utils';
import { toast } from 'sonner';

interface UseImageCaptureOptions {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  onCaptureComplete: (imageDataUrl: string) => void;
}

export const useImageCapture = ({
  videoRef,
  canvasRef,
  onCaptureComplete
}: UseImageCaptureOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const captureImage = async () => {
    setIsProcessing(true);
    
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
            
            onCaptureComplete(imageDataUrl);
          } catch (err) {
            console.error("Error capturing image:", err);
            toast.error("Errore durante l'acquisizione dell'immagine");
          }
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    captureImage
  };
};
