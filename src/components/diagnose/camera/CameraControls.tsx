
import React from 'react';
import { Camera, FlipHorizontal2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraControlsProps {
  onCapture: () => void;
  onCancel: () => void;
  isMobile: boolean;
  canFlipCamera: boolean;
  onFlipCamera?: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  onCapture,
  onCancel,
  isMobile,
  canFlipCamera = false,
  onFlipCamera
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-black bg-opacity-40">
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-black hover:bg-opacity-30"
        onClick={onCancel}
      >
        <X className="h-6 w-6" />
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="rounded-full w-16 h-16 border-4 border-white bg-transparent hover:bg-white hover:bg-opacity-20"
        onClick={onCapture}
      >
        <Camera className="h-8 w-8 text-white" />
        <span className="sr-only">Scatta foto</span>
      </Button>

      {isMobile && canFlipCamera && onFlipCamera && (
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-black hover:bg-opacity-30"
          onClick={onFlipCamera}
        >
          <FlipHorizontal2 className="h-6 w-6" />
        </Button>
      )}
      
      {/* Spacer when flip camera isn't shown to maintain layout */}
      {(!isMobile || !canFlipCamera) && <div className="w-10" />}
    </div>
  );
};

export default CameraControls;
