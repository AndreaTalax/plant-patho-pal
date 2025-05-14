
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageUrl: string) => void;
  onCancel: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const CameraCapture = ({ onCapture, onCancel, videoRef, canvasRef }: CameraCaptureProps) => {
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        onCapture(imageDataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full">
        <div className="p-4 bg-drplant-green text-white flex justify-between items-center">
          <h3 className="font-semibold">Take a Photo</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-drplant-green-dark" 
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="relative aspect-square bg-black w-full">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
          ></video>
        </div>
        
        <div className="p-4 flex gap-4">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-drplant-green hover:bg-drplant-green-dark" 
            onClick={captureImage}
          >
            <Camera className="mr-2 h-5 w-5" /> Capture
          </Button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default CameraCapture;
