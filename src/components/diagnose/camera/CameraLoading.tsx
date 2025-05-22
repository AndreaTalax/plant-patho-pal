
import React from 'react';
import { Loader2 } from 'lucide-react';

interface CameraLoadingProps {
  visible: boolean;
}

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
