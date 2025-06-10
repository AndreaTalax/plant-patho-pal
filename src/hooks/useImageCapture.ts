
import { useState, RefObject } from 'react';
import { measurePlantFeatureQuality } from '@/utils/plant-analysis/image-utils';
import { toast } from 'sonner';

interface UseImageCaptureOptions {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  onCaptureComplete: (imageDataUrl: string) => void;
}

/**
 * Captures an image from a video feed and performs quality evaluation on the image.
 * @example
 * useImageCaptureOptions({ videoRef, canvasRef, onCaptureComplete })
 * { isProcessing: boolean, captureImage: function }
 * @param {object} videoRef - React ref pointing to a HTMLVideoElement.
 * @param {object} canvasRef - React ref pointing to a HTMLCanvasElement.
 * @param {function} onCaptureComplete - Callback executed when image capture is complete, receiving the image data URL.
 * @returns {object} Returns an object containing the isProcessing state and the captureImage function.
 * @description
 *   - Captures an image from a video element onto a canvas.
 *   - Converts the canvas drawing to a JPEG data URL.
 *   - Evaluates image quality and displays a warning if it's below a certain threshold.
 *   - Utilizes React state to indicate processing status.
 */
export const useImageCapture = ({
  videoRef,
  canvasRef,
  onCaptureComplete
}: UseImageCaptureOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
  * Captures a frame from a video element and evaluates its quality for plant detection, warning if poor.
  * @example
  * sync()
  * undefined
  * @param {void} - This function does not accept any arguments.
  * @returns {void} This function does not return a value.
  * @description
  *   - Ensures canvas dimensions match video dimensions before drawing the frame.
  *   - Converts the canvas content into a data URL in JPEG format.
  *   - Measures the quality of the captured image to provide user feedback.
  *   - Properly handles errors related to image capturing and processing.
  */
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
