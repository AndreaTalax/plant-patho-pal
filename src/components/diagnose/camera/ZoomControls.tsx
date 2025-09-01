import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom
}) => {
  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
      {/* Zoom In */}
      <Button
        onClick={onZoomIn}
        disabled={zoomLevel >= 3}
        variant="secondary"
        size="sm"
        className="bg-black bg-opacity-50 text-white border-white rounded-full w-10 h-10 p-0 disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Zoom Level Display */}
      <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full text-center min-w-10">
        {zoomLevel.toFixed(1)}x
      </div>

      {/* Zoom Out */}
      <Button
        onClick={onZoomOut}
        disabled={zoomLevel <= 1}
        variant="secondary"
        size="sm"
        className="bg-black bg-opacity-50 text-white border-white rounded-full w-10 h-10 p-0 disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </Button>

      {/* Reset Zoom */}
      {zoomLevel > 1 && (
        <Button
          onClick={onResetZoom}
          variant="secondary"
          size="sm"
          className="bg-black bg-opacity-50 text-white border-white rounded-full w-8 h-8 p-0 mt-2"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default ZoomControls;