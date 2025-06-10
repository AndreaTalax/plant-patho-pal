
import React from 'react';
import { Loader2 } from 'lucide-react';

interface CameraLoadingProps {
  visible: boolean;
}

/**
 * Component to render a loading screen overlay.
 * @example
 * renderLoadingScreen({ visible: true })
 * <div className="absolute...">...</div>
 * @param {Object} props - Component properties.
 * @param {boolean} props.visible - Flag to control visibility of the loading overlay.
 * @returns {JSX.Element|null} A JSX element representing the overlay or null for invisibility.
 * @description
 *   - Uses Tailwind CSS classes for styling and positioning.
 *   - Employs a conditional check to toggle visibility based on the `visible` prop.
 */
const CameraLoading: React.FC<CameraLoadingProps> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
      <div className="text-center text-white">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Attivazione fotocamera...</p>
      </div>
    </div>
  );
};

export default CameraLoading;
