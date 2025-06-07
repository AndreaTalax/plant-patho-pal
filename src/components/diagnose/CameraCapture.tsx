
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, RotateCcw, Zap, ZapOff } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Request camera permissions with constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => {
                resolve();
              }).catch((playError) => {
                console.error('Error playing video:', playError);
                resolve(); // Continue anyway
              });
            };
          }
        });

        // Check for flash capability
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack && 'getCapabilities' in videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          setHasFlash(!!(capabilities as any).torch);
        }
      }

      setIsLoading(false);
      toast.success('Camera initialized successfully');

    } catch (err) {
      console.error('Camera initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied';
      setError(errorMessage);
      setIsLoading(false);
      toast.error(`Camera error: ${errorMessage}`);
    }
  }, [facingMode, stream, videoRef]);

  // Initialize camera on component mount
  useEffect(() => {
    initializeCamera();

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCamera]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!stream || !hasFlash) return;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
        toast.success(`Flash ${!flashEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Flash toggle error:', error);
      toast.error('Failed to toggle flash');
    }
  }, [stream, hasFlash, flashEnabled]);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
    toast.info('Switching camera...');
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        toast.error('Canvas context not available');
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      toast.success('Photo captured successfully!');
      onCapture(imageDataUrl);

    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture photo');
    }
  }, [videoRef, canvasRef, stream, onCapture]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onCancel();
  }, [stream, onCancel]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">Camera Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={initializeCamera} className="w-full">
                Try Again
              </Button>
              <Button onClick={handleCancel} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Video Stream */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Initializing camera...</p>
          </div>
        </div>
      )}

      {/* Camera Controls */}
      {!isLoading && (
        <>
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <Button
              onClick={handleCancel}
              variant="secondary"
              size="sm"
              className="bg-black bg-opacity-50 text-white border-white"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <div className="flex gap-2">
              {hasFlash && (
                <Button
                  onClick={toggleFlash}
                  variant="secondary"
                  size="sm"
                  className={`bg-black bg-opacity-50 border-white ${
                    flashEnabled ? 'text-yellow-400' : 'text-white'
                  }`}
                >
                  {flashEnabled ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                </Button>
              )}

              <Button
                onClick={switchCamera}
                variant="secondary"
                size="sm"
                className="bg-black bg-opacity-50 text-white border-white"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <Button
              onClick={capturePhoto}
              size="lg"
              className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16 p-0"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>

          {/* Camera Instructions */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              Position your plant in the frame and tap to capture
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
