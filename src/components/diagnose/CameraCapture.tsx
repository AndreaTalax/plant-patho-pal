
import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import CameraControls from './camera/CameraControls';
import { useCamera } from '@/hooks/useCamera';
import { useImageCapture } from '@/hooks/useImageCapture';
import CameraLoading from './camera/CameraLoading';
import CameraError from './camera/CameraError';
import FlashToggle from './camera/FlashToggle';

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
  const isMobile = useIsMobile();
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashMode, setFlashMode] = useState<boolean>(false);
  
  // Camera hook
  const { startCamera, stopCamera, toggleFlash } = useCamera({
    videoRef,
    facingMode,
    flashMode,
    onCameraError: (error) => {
      setCameraError(error);
      setCameraLoading(false);
    },
    onCameraLoad: () => setCameraLoading(false)
  });
  
  // Image capture hook
  const { isProcessing: isCaptureProcessing, captureImage } = useImageCapture({
    videoRef,
    canvasRef,
    onCaptureComplete: onCapture
  });
  
  // Start camera when component mounts or facing mode changes
  useEffect(() => {
    startCamera();
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [facingMode]);
  
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Handle flash toggle
  const handleToggleFlash = async () => {
    const newFlashMode = await toggleFlash();
    setFlashMode(newFlashMode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Camera loading indicator */}
      <CameraLoading visible={cameraLoading} />
      
      {/* Camera error display */}
      <CameraError error={cameraError} onClose={onCancel} />
      
      {/* Camera video display */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted
        className="w-full h-full object-cover"
        onError={() => {
          setCameraError("Errore durante il caricamento della fotocamera");
          setCameraLoading(false);
        }}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Flash toggle button - only shown on mobile and when camera is active */}
      {isMobile && !cameraLoading && !cameraError && (
        <FlashToggle 
          flashMode={flashMode}
          onToggleFlash={handleToggleFlash}
          disabled={isCaptureProcessing}
        />
      )}
      
      {/* Camera controls */}
      <CameraControls 
        onCapture={captureImage}
        onCancel={onCancel}
        isMobile={isMobile}
        canFlipCamera={isMobile}
        onFlipCamera={handleFlipCamera}
        isProcessing={isCaptureProcessing}
      />
    </div>
  );
};

export default CameraCapture;
