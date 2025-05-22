
import React from 'react';
import { CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraErrorProps {
  error: string | null;
  onClose: () => void;
}

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
