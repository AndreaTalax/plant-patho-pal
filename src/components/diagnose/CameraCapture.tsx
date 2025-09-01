
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, RotateCcw, Zap, ZapOff } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import CameraLoading from './camera/CameraLoading';
import CameraControls from './camera/CameraControls';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel
}) => {
  const {
    isLoading,
    error,
    stream,
    videoRef,
    canvasRef,
    facingMode,
    hasFlash,
    flashEnabled,
    switchCamera,
    toggleFlash,
    capturePhoto,
    stopCamera
  } = useCamera();

  const handleCapture = () => {
    console.log('📸 Capture button clicked');
    const imageDataUrl = capturePhoto();
    if (imageDataUrl) {
      console.log('📸 Photo captured successfully, keeping camera active for potential retakes');
      onCapture(imageDataUrl);
    }
  };

  const handleCancel = () => {
    console.log('❌ Cancel button clicked, stopping camera');
    stopCamera();
    onCancel();
  };

  const handleSwitchCamera = () => {
    console.log('🔄 Switch camera button clicked');
    switchCamera();
  };

  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">Errore Fotocamera</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={handleCancel} variant="outline" className="w-full">
                Torna Indietro
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Video Stream */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover absolute inset-0"
        playsInline
        muted
        autoPlay
      />

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading Overlay */}
      <CameraLoading visible={isLoading} />

      {/* Top Controls (Flash and Switch Camera) */}
      {!isLoading && stream && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {hasFlash && (
            <Button
              onClick={toggleFlash}
              variant="secondary"
              size="sm"
              className={`bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg ${
                flashEnabled ? 'text-yellow-300' : 'text-white'
              }`}
            >
              {flashEnabled ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
            </Button>
          )}

          <Button
            onClick={handleSwitchCamera}
            variant="secondary"
            size="sm"
            className="bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Camera Controls */}
      {!isLoading && stream && (
        <CameraControls
          onCapture={handleCapture}
          onCancel={handleCancel}
          isMobile={isMobile}
          canFlipCamera={true}
          onFlipCamera={handleSwitchCamera}
          isProcessing={false}
        />
      )}
    </div>
  );
};

export default CameraCapture;
