
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, RotateCcw, Zap, ZapOff, Grid3X3, Timer } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useCameraZoom } from '@/hooks/camera/useCameraZoom';
import { useCameraTimer } from '@/hooks/camera/useCameraTimer';
import { triggerHaptic } from '@/utils/hapticFeedback';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { AccessibleControlPanel, AccessibleTouchArea } from '@/components/ui/accessible-controls';
import { voiceOverAnnouncements } from '@/utils/accessibility';
import CameraLoading from './camera/CameraLoading';
import CameraGrid from './camera/CameraGrid';
import ZoomControls from './camera/ZoomControls';
import TimerControls from './camera/TimerControls';

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

  const {
    zoomLevel,
    transform,
    zoomIn,
    zoomOut,
    resetZoom
  } = useCameraZoom();

  const {
    duration: timerDuration,
    isActive: timerActive,
    countdown,
    setTimerDuration,
    startTimer,
    cancelTimer,
    cleanup: cleanupTimer
  } = useCameraTimer();

  const [gridVisible, setGridVisible] = useState(false);

  const handleCapture = () => {
    console.log('📸 Capture button clicked');  
    triggerHaptic('medium');
    voiceOverAnnouncements.photoTaken();
    
    if (timerActive) {
      cancelTimer();
      return;
    }

    const captureAction = () => {
      const imageDataUrl = capturePhoto();
      if (imageDataUrl) {
        console.log('📸 Photo captured successfully, keeping camera active for potential retakes');
        triggerHaptic('success');
        voiceOverAnnouncements.photoTaken();
        onCapture(imageDataUrl);
      } else {
        triggerHaptic('error');
      }
    };

    startTimer(captureAction);
  };

  // Alternative gesture handlers
  const handleCaptureAlternatives = {
    onLongPress: () => {
      voiceOverAnnouncements.longPressAvailable();
      setTimerDuration(3); // Set 3s timer on long press
    },
    onDoubleClick: () => {
      handleCapture(); // Double tap for immediate capture
    },
    onSwipeUp: () => {
      if (zoomLevel < 3) {
        zoomIn();
      }
    },
    onSwipeDown: () => {
      if (zoomLevel > 1) {
        zoomOut();
      }
    }
  };

  const handleCancel = () => {
    console.log('❌ Cancel button clicked, stopping camera');
    triggerHaptic('light');
    cancelTimer();
    
    // Stop the camera stream first
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Camera track stopped during cancel:', track.kind);
      });
    }
    
    stopCamera();
    onCancel();
  };

  const handleSwitchCamera = () => {
    console.log('🔄 Switch camera button clicked');
    triggerHaptic('light');
    switchCamera();
  };

  const toggleGrid = () => {
    setGridVisible(!gridVisible);
    triggerHaptic('light');
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      cleanupTimer();
    };
  }, [cleanupTimer]);

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
      {/* Video Stream with Zoom */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform }}
          playsInline
          muted
          autoPlay
        />
        
        {/* Camera Grid Overlay */}
        <CameraGrid visible={gridVisible} />
      </div>

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading Overlay */}
      <CameraLoading visible={isLoading} />

      {/* Camera Controls */}
      {!isLoading && stream && (
        <>
          {/* Top Controls */}
          <AccessibleControlPanel 
            className="absolute top-4 left-4 right-4 bg-black/50 border-white/20"
            title="Controlli Fotocamera"
          >
            <AccessibleButton
              onClick={handleCancel}
              variant="secondary"
              size="sm"
              label="Annulla e torna indietro"
              className="bg-black bg-opacity-50 text-white border-white"
              onSwipeLeft={() => handleCancel()}
            >
              <X className="h-4 w-4 mr-2" />
              Annulla
            </AccessibleButton>

            <AccessibleButton
              onClick={toggleGrid}
              variant="secondary"
              size="sm"
              label={`${gridVisible ? 'Disattiva' : 'Attiva'} griglia di composizione`}
              className={`bg-black bg-opacity-50 border-white ${
                gridVisible ? 'text-green-400 border-green-400' : 'text-white'
              }`}
              onLongPress={() => voiceOverAnnouncements.longPressAvailable()}
            >
              <Grid3X3 className="h-4 w-4" />
            </AccessibleButton>

            {hasFlash && (
              <AccessibleButton
                onClick={toggleFlash}
                variant="secondary"
                size="sm"
                label={`${flashEnabled ? 'Disattiva' : 'Attiva'} flash`}
                className={`bg-black bg-opacity-50 border-white ${
                  flashEnabled ? 'text-yellow-400' : 'text-white'
                }`}
                onDoubleClick={() => toggleFlash()}
              >
                {flashEnabled ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
              </AccessibleButton>
            )}

            <AccessibleButton
              onClick={handleSwitchCamera}
              variant="secondary"
              size="sm"
              label="Cambia fotocamera"
              className="bg-black bg-opacity-50 text-white border-white"
              onSwipeRight={() => handleSwitchCamera()}
            >
              <RotateCcw className="h-4 w-4" />
            </AccessibleButton>
          </AccessibleControlPanel>

          {/* Zoom Controls */}
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
          />

          {/* Timer Controls */}
          <TimerControls
            duration={timerDuration}
            isActive={timerActive}
            countdown={countdown}
            onSetDuration={setTimerDuration}
          />

          {/* Bottom Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <AccessibleTouchArea
              onPress={handleCapture}
              onLongPress={handleCaptureAlternatives.onLongPress}
              onDoubleClick={handleCaptureAlternatives.onDoubleClick}
              onSwipeUp={handleCaptureAlternatives.onSwipeUp}
              onSwipeDown={handleCaptureAlternatives.onSwipeDown}
              label={timerActive ? 'Annulla timer' : 'Scatta foto'}
              className="rounded-full w-18 h-18 bg-white/90 backdrop-blur"
            >
              <div className={`rounded-full w-16 h-16 flex items-center justify-center transition-all ${
                timerActive 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white text-black hover:bg-gray-200'
              }`}>
                {timerActive ? <X className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
              </div>
            </AccessibleTouchArea>
          </div>

          {/* Camera Instructions */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-center max-w-xs">
            <p className="text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              {timerActive 
                ? 'Timer attivo - tocca per annullare' 
                : timerDuration > 0 
                  ? `Timer ${timerDuration}s attivo - tocca per scattare`
                  : 'Posiziona la pianta nell\'inquadratura e tocca per scattare'
              }
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
