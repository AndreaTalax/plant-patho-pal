
import React from 'react';
import { Camera, FlipHorizontal2, X, CircleSlash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraControlsProps {
  onCapture: () => void;
  onCancel: () => void;
  isMobile: boolean;
  canFlipCamera: boolean;
  onFlipCamera?: () => void;
  isProcessing?: boolean;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  onCapture,
  onCancel,
  isMobile,
  canFlipCamera = false,
  onFlipCamera,
  isProcessing = false
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 md:pb-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
      <div className="flex justify-between items-center">
        {/* Cancel Button */}
        <Button
          variant="secondary"
          size="lg"
          className="bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/50 w-14 h-14 rounded-full shadow-2xl"
          onClick={onCancel}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Capture Button */}
        <Button
          variant="outline"
          size="lg"
          className={`rounded-full w-20 h-20 border-4 bg-white/10 backdrop-blur-sm shadow-2xl transition-all duration-200 ${
            isProcessing 
              ? 'border-gray-300/50 bg-gray-500/20' 
              : 'border-white hover:bg-white/20 hover:border-white hover:scale-105'
          }`}
          onClick={onCapture}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="h-10 w-10 block border-4 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="h-10 w-10 text-white drop-shadow-lg" />
          )}
          <span className="sr-only">Scatta foto</span>
        </Button>

        {/* Flip Camera Button or Spacer */}
        {isMobile && canFlipCamera && onFlipCamera ? (
          <Button
            variant="secondary"
            size="lg"
            className="bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/50 w-14 h-14 rounded-full shadow-2xl"
            onClick={onFlipCamera}
            disabled={isProcessing}
          >
            <FlipHorizontal2 className="h-6 w-6" />
          </Button>
        ) : (
          <div className="w-14 h-14" />
        )}
      </div>
      
      {/* Instructions */}
      <div className="text-center mt-4">
        <p className="text-white text-sm font-medium drop-shadow-lg bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
          Posiziona la pianta nell'inquadratura e tocca per scattare
        </p>
      </div>
    </div>
  );
};

export default CameraControls;
