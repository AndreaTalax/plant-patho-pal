
import React from 'react';
import { CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraErrorProps {
  error: string | null;
  onClose: () => void;
}

/**
 * Renders an error overlay dialog when there is a camera error.
 * @example
 * displayCameraError({ error: "Camera not available", onClose: handleClose })
 * Returns a JSX element displaying an error dialog.
 * @param {object} props - The component properties.
 * @param {string} props.error - The error message to display.
 * @param {function} props.onClose - Callback function to execute when the dialog is closed.
 * @returns {JSX.Element|null} Returns the error overlay if an error exists, otherwise null.
 * @description
 *   - The component overlays the error dialog over the entire viewport.
 *   - Ensures that the error message is visible to the user.
 *   - Includes suggestions for resolving common issues with camera access.
 *   - Modal can be closed using the provided `onClose` function.
 */
const CameraError: React.FC<CameraErrorProps> = ({ error, onClose }) => {
  if (!error) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
      <div className="bg-white p-4 rounded-lg max-w-xs w-full">
        <div className="flex justify-center mb-4">
          <CameraOff className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="font-bold text-lg mb-2 text-center">Errore Fotocamera</h3>
        <p className="text-red-500 text-center mb-2">{error}</p>
        <p className="mt-2 text-sm">Assicurati di aver concesso i permessi per la fotocamera. Puoi anche provare a caricare un'immagine dalla galleria.</p>
        <Button className="w-full mt-4" onClick={onClose}>Chiudi</Button>
      </div>
    </div>
  );
};

export default CameraError;
