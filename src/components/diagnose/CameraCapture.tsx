
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
  const { startCamera, stopCamera, toggleFlash, currentStream } = useCamera({
    videoRef,
    facingMode,
    flashMode,
    onCameraError: (error) => {
      console.error("Camera error:", error);
      setCameraError(error);
      setCameraLoading(false);
    },
    onCameraLoad: () => {
      console.log("Camera loaded successfully");
      setCameraLoading(false);
      setCameraError(null);
    }
  });
  
  // Image capture hook
  const { isProcessing: isCaptureProcessing, captureImage } = useImageCapture({
    videoRef,
    canvasRef,
    onCaptureComplete: onCapture
  });
  
  // Start camera when component mounts or facing mode changes
  useEffect(() => {
    console.log("Starting camera with facing mode:", facingMode);
    setCameraLoading(true);
    setCameraError(null);
    
    // Small delay to ensure state is updated
    const timer = setTimeout(() => {
      startCamera();
    }, 100);
    
    // Cleanup on unmount or facing mode change
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [facingMode]);
  
  const handleFlipCamera = () => {
    console.log("Flipping camera from", facingMode, "to", facingMode === 'user' ? 'environment' : 'user');
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Handle flash toggle
  const handleToggleFlash = async () => {
    try {
      const newFlashMode = await toggleFlash();
      setFlashMode(newFlashMode);
    } catch (error) {
      console.error("Error toggling flash:", error);
    }
  };

  const handleCancel = () => {
    console.log("Camera cancelled by user");
    stopCamera();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Camera loading indicator */}
      <CameraLoading visible={cameraLoading && !cameraError} />
      
      {/* Camera error display */}
      <CameraError error={cameraError} onClose={handleCancel} />
      
      {/* Camera video display */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted
        className="w-full h-full object-cover"
        style={{ display: cameraLoading || cameraError ? 'none' : 'block' }}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Flash toggle button - only shown on mobile and when camera is active */}
      {isMobile && !cameraLoading && !cameraError && currentStream && (
        <FlashToggle 
          flashMode={flashMode}
          onToggleFlash={handleToggleFlash}
          disabled={isCaptureProcessing}
        />
      )}
      
      {/* Camera controls - only shown when camera is ready */}
      {!cameraLoading && !cameraError && (
        <CameraControls 
          onCapture={captureImage}
          onCancel={handleCancel}
          isMobile={isMobile}
          canFlipCamera={isMobile}
          onFlipCamera={handleFlipCamera}
          isProcessing={isCaptureProcessing}
        />
      )}
    </div>
  );
};

export default CameraCapture;
