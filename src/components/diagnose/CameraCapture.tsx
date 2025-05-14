
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, Info, Leaf, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (imageUrl: string) => void;
  onCancel: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mode?: 'identify' | 'diagnose';
}

const CameraCapture = ({ 
  onCapture, 
  onCancel, 
  videoRef, 
  canvasRef,
  mode = 'diagnose'
}: CameraCaptureProps) => {
  const [showTips, setShowTips] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  
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
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageDataUrl);
      }
    }
  };

  // Camera guidelines based on the mode
  const GuideLines = () => {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className={cn(
          "border-2 border-dashed rounded-lg transition-all",
          mode === 'identify' ? 'w-3/4 h-3/4 border-green-400' : 'w-2/3 aspect-square border-yellow-400'
        )}>
          {mode === 'identify' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-green-400 text-xs text-white px-2 py-0.5 rounded">
              Whole Plant
            </div>
          )}
          {mode === 'diagnose' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-yellow-400 text-xs text-black px-2 py-0.5 rounded">
              Affected Area
            </div>
          )}
        </div>
      </div>
    );
  };

  const Tips = () => {
    if (!showTips) return null;
    
    return (
      <div className="absolute bottom-20 left-4 right-4 bg-black bg-opacity-70 rounded-lg p-3 text-white text-xs">
        <h4 className="font-medium mb-1.5">Tips for {mode === 'identify' ? 'identification' : 'diagnosis'}:</h4>
        <ul className="space-y-1 ml-4 list-disc">
          {mode === 'identify' ? (
            <>
              <li>Include the entire plant in the frame</li>
              <li>Ensure good lighting to capture details</li>
              <li>Capture unique features like leaf arrangement and structure</li>
              <li>Include flowers if present for easier identification</li>
            </>
          ) : (
            <>
              <li>Focus directly on the affected area</li>
              <li>Take close-up shots of symptoms (spots, discoloration)</li>
              <li>Include both healthy and affected parts for comparison</li>
              <li>Avoid shadows covering important details</li>
            </>
          )}
        </ul>
      </div>
    );
  };

  // Simulate flash effect
  const activateFlash = () => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full">
        <div className={cn(
          "p-4 text-white flex justify-between items-center",
          mode === 'identify' ? "bg-drplant-green" : "bg-drplant-blue"
        )}>
          <h3 className="font-semibold flex items-center gap-2">
            {mode === 'identify' ? (
              <>
                <Leaf className="h-4 w-4" /> Plant Identification
              </>
            ) : (
              <>
                <Bug className="h-4 w-4" /> Disease Diagnosis
              </>
            )}
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-opacity-20 hover:bg-white" 
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="relative aspect-square bg-black w-full">
          {/* Video element */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
          ></video>
          
          {/* Guide lines overlay */}
          <GuideLines />
          
          {/* Flash effect overlay */}
          <div className={cn(
            "absolute inset-0 bg-white transition-opacity pointer-events-none", 
            flashActive ? "opacity-70" : "opacity-0"
          )} />
          
          {/* Tips overlay */}
          <Tips />
          
          {/* Controls overlay */}
          <div className="absolute top-2 right-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full h-8 w-8"
              onClick={() => setShowTips(!showTips)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 flex flex-col gap-4">
          <div className="text-xs text-gray-500 text-center">
            {mode === 'identify' 
              ? "Position the entire plant within the green outline" 
              : "Zoom in on affected areas for better diagnosis"
            }
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              className={cn(
                "flex-1",
                mode === 'identify' 
                  ? "bg-drplant-green hover:bg-drplant-green-dark" 
                  : "bg-drplant-blue hover:bg-drplant-blue-dark"
              )}
              onClick={() => {
                activateFlash();
                setTimeout(captureImage, 150);
              }}
            >
              <Camera className="mr-2 h-5 w-5" /> Capture
            </Button>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default CameraCapture;
