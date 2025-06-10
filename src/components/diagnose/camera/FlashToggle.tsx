
import React from 'react';
import { Button } from '@/components/ui/button';

interface FlashToggleProps {
  flashMode: boolean;
  onToggleFlash: () => void;
  disabled?: boolean;
}

/**
* Toggles the flash mode of a camera.
* @example
* FlashToggle({ flashMode: true, onToggleFlash: handleToggle, disabled: false })
* Renders a button that, when clicked, toggles flash mode and shows the appropriate icon.
* @param {boolean} flashMode - Current state of the flash mode; true if the flash is on.
* @param {function} onToggleFlash - Callback function to be called when the flash toggle button is clicked.
* @param {boolean} [disabled=false] - Indicates whether the button is disabled.
* @returns {JSX.Element} The rendered button element for toggling flash mode.
* @description
*   - The button's class indicates its position and styling on the parent component.
*   - SVG icons are used to visually represent the flash mode state.
*   - If `flashMode` is true, shows the flash "on" icon; otherwise, shows the "off" icon.
*/
const FlashToggle: React.FC<FlashToggleProps> = ({ 
  flashMode, 
  onToggleFlash,
  disabled = false
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-4 right-4 text-white bg-black bg-opacity-30 hover:bg-opacity-40 z-20"
      onClick={onToggleFlash}
      disabled={disabled}
    >
      {flashMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M6 18h8l-4.7-4.7A1 1 0 0 0 8 14V8h-2v6a1 1 0 0 0 .3.7L6 18z"/>
          <path d="M14 18l4-7h-5V4l-6 11h5v3z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M6 18h8l-4.7-4.7A1 1 0 0 0 8 14V8h-2v6a1 1 0 0 0 .3.7L6 18z"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
      )}
    </Button>
  );
};

export default FlashToggle;
