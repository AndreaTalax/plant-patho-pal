
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw } from 'lucide-react';
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
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreamActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isStreamActive) {
      toast.error('Camera not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      toast.error('Unable to capture photo');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    stopCamera();
    onCapture(imageDataUrl);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 text-white">
        <h2 className="text-lg font-semibold">Take Plant Photo</h2>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="max-w-full max-h-full object-contain"
        />
        
        {!isStreamActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-6 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Initializing camera...</p>
            </Card>
          </div>
        )}

        {/* Camera overlay guide */}
        {isStreamActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-4 top-1/4 bottom-1/4 border-2 border-white/50 rounded-lg flex items-center justify-center">
              <p className="text-white bg-black/50 px-3 py-1 rounded text-sm">
                Position plant within frame
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50">
        <div className="flex justify-center items-center space-x-8">
          {/* Switch Camera */}
          <Button
            onClick={switchCamera}
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/20"
            disabled={!isStreamActive}
          >
            <RotateCcw className="h-6 w-6" />
          </Button>

          {/* Capture Button */}
          <Button
            onClick={capturePhoto}
            className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16 p-0"
            disabled={!isStreamActive}
          >
            <Camera className="h-8 w-8" />
          </Button>

          {/* Spacer for symmetry */}
          <div className="w-12 h-12"></div>
        </div>

        <p className="text-center text-white/70 text-sm mt-4">
          Tap the capture button to take a photo of your plant
        </p>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
