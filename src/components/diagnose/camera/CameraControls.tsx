
import React from 'react';
import { Camera, FlipHorizontal2, X, CircleSlash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraControlsProps {
  onCapture: () => void;
  onCancel: () => void;
  isMobile: boolean;
  canFlipCamera: boolean;
  onFlipCamera?: () => void;
  isProcessing?: boolean; // Added the isProcessing prop as optional
}

/**
 * Renders camera control buttons including capture, cancel, and optionally flip camera based on conditions.
 * @example
 * CameraControls({
 *   onCapture: handleCapture,
 *   onCancel: handleCancel,
 *   isMobile: true,
 *   canFlipCamera: true,
 *   onFlipCamera: handleFlipCamera,
 *   isProcessing: false
 * })
 * Returns the JSX element containing the camera controls.
 * @param {function} onCapture - Callback function that triggers when the capture button is clicked.
 * @param {function} onCancel - Callback function that triggers when the cancel button is clicked.
 * @param {boolean} isMobile - Determines if the mobile-specific controls should be rendered.
 * @param {boolean} [canFlipCamera=false] - Indicates if the flip camera functionality should be enabled.
 * @param {function} onFlipCamera - Callback function that triggers when the flip camera button is clicked.
 * @param {boolean} [isProcessing=false] - Disables capture button and shows a loading spinner when true.
 * @returns {JSX.Element} JSX structure rendering camera controls.
 * @description
 *   - Uses conditional rendering to display the flip camera button only when certain prop values are met (isMobile, canFlipCamera, and onFlipCamera).
 *   - Spinner animation is applied to the capture button when processing is true.
 *   - Maintains layout spacing using a spacer div when the flip camera button is not displayed.
 *   - Provides a subset of user interactions specific to mobile devices, such as flipping the camera.
 */
const CameraControls: React.FC<CameraControlsProps> = ({
  onCapture,
  onCancel,
  isMobile,
  canFlipCamera = false,
  onFlipCamera,
  isProcessing = false // Default value to false
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pb-16 md:pb-4 flex justify-between items-center bg-black bg-opacity-40">
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
        className={`rounded-full w-16 h-16 border-4 ${isProcessing ? 'border-gray-300' : 'border-white'} bg-transparent hover:bg-white hover:bg-opacity-20 transition-all duration-200`}
        onClick={onCapture}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <span className="h-8 w-8 block border-4 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="h-8 w-8 text-white" />
        )}
        <span className="sr-only">Scatta foto</span>
      </Button>

      {isMobile && canFlipCamera && onFlipCamera && (
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-black hover:bg-opacity-30"
          onClick={onFlipCamera}
          disabled={isProcessing}
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
