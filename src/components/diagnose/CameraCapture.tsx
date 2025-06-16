
import React, { useEffect, useRef } from 'react';
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
  videoRef: externalVideoRef,
  canvasRef: externalCanvasRef
}) => {
  const {
    isLoading,
    error,
    stream,
    videoRef: internalVideoRef,
    canvasRef: internalCanvasRef,
    facingMode,
    hasFlash,
    flashEnabled,
    initializeCamera,
    switchCamera,
    toggleFlash,
    capturePhoto,
    stopCamera
  } = useCamera();

  // Use internal refs for camera functionality
  const activeVideoRef = videoRef || internalVideoRef;
  const activeCanvasRef = canvasRef || internalCanvasRef;

  // Initialize camera only once on mount
  useEffect(() => {
    console.log('🎬 CameraCapture mounted, initializing camera...');
    let isMounted = true;

    const init = async () => {
      if (isMounted) {
        await initializeCamera();
      }
    };

    init();

    return () => {
      console.log('🎬 CameraCapture unmounting, stopping camera...');
      isMounted = false;
      stopCamera();
    };
  }, []); // Empty dependency array - initialize only once

  // Sync external refs with internal stream
  useEffect(() => {
    if (stream && externalVideoRef?.current) {
      console.log('🔄 Syncing external video ref with stream');
      externalVideoRef.current.srcObject = stream;
    }
  }, [stream, externalVideoRef]);

  const handleCapture = () => {
    console.log('📸 Capture button clicked');
    const imageDataUrl = capturePhoto();
    if (imageDataUrl) {
      console.log('📸 Photo captured successfully, stopping camera');
      stopCamera();
      onCapture(imageDataUrl);
    }
  };

  const handleCancel = () => {
    console.log('❌ Cancel button clicked, stopping camera');
    stopCamera();
    onCancel();
  };

  const handleSwitchCamera = async () => {
    console.log('🔄 Switch camera button clicked');
    switchCamera();
    // Re-initialize with new facing mode after a short delay
    setTimeout(() => {
      initializeCamera();
    }, 200);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">Errore Fotocamera</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={initializeCamera} className="w-full">
                Riprova
              </Button>
              <Button onClick={handleCancel} variant="outline" className="w-full">
                Annulla
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
        ref={activeVideoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Hidden Canvas for Capture */}
      <canvas ref={activeCanvasRef} className="hidden" />

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
              Annulla
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
              Posiziona la pianta nell'inquadratura e tocca per scattare
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
