
import React from 'react';
import { Button } from '@/components/ui/button';

interface FlashToggleProps {
  flashMode: boolean;
  onToggleFlash: () => void;
  disabled?: boolean;
}

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
