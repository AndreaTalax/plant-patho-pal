
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, Leaf } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (imageUrl: string) => void;
  onCancel: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const CameraCapture = ({ onCapture, onCancel, videoRef, canvasRef }: CameraCaptureProps) => {
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'granted'|'denied'|'prompt'|'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'user'|'environment'>('environment');

  useEffect(() => {
    // Check camera permissions when component mounts
    const checkPermissions = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermissionStatus(result.state);
      } catch (err) {
        console.log('Permission API not supported, assuming prompt');
        setCameraPermissionStatus('prompt');
      }
    };
    
    checkPermissions();
  }, []);

  useEffect(() => {
    // Start camera stream when component mounts
    const startCamera = async () => {
      try {
        setIsLoading(true);
        
        if (videoRef.current) {
          const constraints = { 
            video: { 
              facingMode: facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            setCameraPermissionStatus('granted');
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setIsLoading(false);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraPermissionStatus('denied');
          toast.error("Camera access denied. Please check your browser settings.");
        } else if (err.name === 'NotFoundError') {
          toast.error("No camera found on your device.");
        } else {
          toast.error("Could not access camera. Please try again.");
        }
      }
    };
    
    startCamera();
    
    return () => {
      // Stop any active stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [videoRef, facingMode]);

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
        toast.success("Image captured successfully!");
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full">
        <div className="p-4 bg-gradient-to-r from-drplant-blue to-drplant-green text-white flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <Leaf className="h-5 w-5 mr-2" /> 
            Plant Scanner
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20" 
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="relative aspect-square bg-black w-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-drplant-green"></div>
              <span className="sr-only">Loading...</span>
            </div>
          )}
          
          {cameraPermissionStatus === 'denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-red-100 rounded-full p-4 mb-4">
                <Camera className="h-8 w-8 text-red-600" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">Camera Access Required</h4>
              <p className="text-gray-300 mb-4">
                Please enable camera access in your browser settings to use the Plant Scanner.
              </p>
              <Button 
                variant="outline"
                className="bg-white text-drplant-blue hover:bg-gray-100"
                onClick={onCancel}
              >
                Close Scanner
              </Button>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`absolute inset-0 w-full h-full object-cover ${isLoading || cameraPermissionStatus === 'denied' ? 'opacity-0' : 'opacity-100'}`}
          ></video>
          
          {!isLoading && cameraPermissionStatus === 'granted' && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <Button
                variant="outline"
                className="bg-white/30 backdrop-blur-md text-white border-white/30 hover:bg-white/50"
                onClick={switchCamera}
              >
                Flip Camera
              </Button>
            </div>
          )}
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
            disabled={isLoading || cameraPermissionStatus !== 'granted'}
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
