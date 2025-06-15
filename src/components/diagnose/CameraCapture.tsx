
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, RotateCcw, Zap, ZapOff } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import CameraLoading from './camera/CameraLoading';

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
  const {
    isLoading,
    error,
    stream,
    facingMode,
    hasFlash,
    flashEnabled,
    initializeCamera,
    switchCamera,
    toggleFlash,
    capturePhoto,
    stopCamera
  } = useCamera();

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, [initializeCamera, stopCamera]);

  // Update the provided refs with the camera refs
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  const handleCapture = () => {
    const imageDataUrl = capturePhoto();
    if (imageDataUrl) {
      stopCamera();
      onCapture(imageDataUrl);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  const handleSwitchCamera = () => {
    switchCamera();
    // Re-initialize after switching
    setTimeout(() => {
      initializeCamera();
    }, 100);
  };

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
      <CameraLoading visible={isLoading} />

      {/* Camera Controls */}
      {!isLoading && stream && (
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
                onClick={handleSwitchCamera}
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
              onClick={handleCapture}
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
