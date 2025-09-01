
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Zap, ZapOff, Grid3X3, Timer } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useMobileEnhancements } from '@/hooks/useMobileEnhancements';
import CameraLoading from '@/components/diagnose/camera/CameraLoading';

interface EnhancedCameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const EnhancedCameraCapture: React.FC<EnhancedCameraCaptureProps> = ({
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

  const { triggerHapticFeedback } = useMobileEnhancements();
  
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [timerCountdown, setTimerCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(1, Math.min(3, zoom + delta));
    setZoom(newZoom);
    
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${newZoom})`;
    }
  };

  const handleTimerCapture = (seconds: number) => {
    setTimer(seconds);
    setTimerCountdown(seconds);
    triggerHapticFeedback('medium');

    const countdown = () => {
      setTimerCountdown(prev => {
        if (prev === null || prev <= 1) {
          handleCapture();
          setTimer(null);
          setTimerCountdown(null);
          return null;
        }
        triggerHapticFeedback('light');
        return prev - 1;
      });
    };

    timerRef.current = setInterval(countdown, 1000);
  };

  const cancelTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimer(null);
    setTimerCountdown(null);
  };

  const handleCapture = () => {
    console.log('📸 Enhanced capture with haptic feedback');
    triggerHapticFeedback('heavy');
    const imageDataUrl = capturePhoto();
    if (imageDataUrl) {
      onCapture(imageDataUrl);
    }
  };

  const handleCancel = () => {
    cancelTimer();
    stopCamera();
    onCancel();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">Errore Fotocamera</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={handleCancel} variant="outline" className="w-full">
              Torna Indietro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Video Stream */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transition-transform duration-300"
        playsInline
        muted
        autoPlay
        style={{ transform: `scale(${zoom})` }}
      />

      {/* Grid Overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/30"></div>
            ))}
          </div>
        </div>
      )}

      {/* Timer Countdown */}
      {timerCountdown && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-75 rounded-full w-24 h-24 flex items-center justify-center">
            <span className="text-white text-4xl font-bold">{timerCountdown}</span>
          </div>
        </div>
      )}

      {/* Canvas nascosto */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading Overlay */}
      <CameraLoading visible={isLoading} />

      {/* Controlli fotocamera */}
      {!isLoading && stream && (
        <>
          {/* Controlli superiori */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="sm"
                className="bg-black bg-opacity-50 text-white border-white"
              >
                <X className="h-4 w-4 mr-2" />
                Annulla
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setShowGrid(!showGrid)}
                variant="secondary"
                size="sm"
                className={`bg-black bg-opacity-50 border-white ${
                  showGrid ? 'text-yellow-400' : 'text-white'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>

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

          {/* Controlli zoom laterali */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
            <Button
              onClick={() => handleZoom(0.2)}
              variant="secondary"
              size="sm"
              className="bg-black bg-opacity-50 text-white border-white rounded-full w-10 h-10 p-0"
              disabled={zoom >= 3}
            >
              +
            </Button>
            <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {zoom.toFixed(1)}x
            </div>
            <Button
              onClick={() => handleZoom(-0.2)}
              variant="secondary"
              size="sm"
              className="bg-black bg-opacity-50 text-white border-white rounded-full w-10 h-10 p-0"
              disabled={zoom <= 1}
            >
              −
            </Button>
          </div>

          {/* Controlli inferiori */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            {/* Timer buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleTimerCapture(3)}
                variant="secondary"
                size="sm"
                className="bg-black bg-opacity-50 text-white border-white"
                disabled={!!timer}
              >
                <Timer className="h-4 w-4 mr-1" />
                3s
              </Button>
              <Button
                onClick={() => handleTimerCapture(10)}
                variant="secondary"
                size="sm"
                className="bg-black bg-opacity-50 text-white border-white"
                disabled={!!timer}
              >
                <Timer className="h-4 w-4 mr-1" />
                10s
              </Button>
            </div>

            {/* Pulsante scatta foto principale */}
            <Button
              onClick={timer ? cancelTimer : handleCapture}
              size="lg"
              className={`rounded-full w-16 h-16 p-0 ${
                timer 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white hover:bg-gray-200'
              }`}
            >
              {timer ? (
                <X className="h-8 w-8 text-white" />
              ) : (
                <Camera className="h-8 w-8 text-black" />
              )}
            </Button>
          </div>

          {/* Istruzioni */}
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              {timer 
                ? `Timer attivo - tocca ✕ per annullare`
                : 'Posiziona la pianta nell\'inquadratura e tocca per scattare'
              }
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedCameraCapture;
