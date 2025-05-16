
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft } from 'lucide-react';

interface CameraControlsProps {
  onCapture: () => void;
  onCancel: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({ onCapture, onCancel }) => {
  return (
    <div className="absolute bottom-4 left-0 w-full flex justify-between px-4">
      <Button 
        variant="outline" 
        size="icon" 
        className="bg-white rounded-full h-12 w-12"
        onClick={onCancel}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      <Button 
        className="bg-white text-black hover:bg-gray-200 rounded-full h-16 w-16 flex items-center justify-center border-4 border-drplant-green" 
        size="icon"
        onClick={onCapture}
      >
        <Camera className="h-8 w-8" />
      </Button>
      
      <div className="w-12"></div> {/* Spacer for balance */}
    </div>
  );
};

export default CameraControls;
