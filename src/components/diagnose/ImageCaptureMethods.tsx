
import { Button } from '@/components/ui/button';
import { Camera, Upload, Image, Flower, Leaf, GitBranch, Sprout } from 'lucide-react';

interface ImageCaptureMethodsProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
}

const ImageCaptureMethods = ({ onTakePhoto, onUploadPhoto }: ImageCaptureMethodsProps) => {
  return (
    <div className="space-y-6">
      {/* Main action buttons - More prominent position at the top */}
      <div className="sticky top-0 z-10 bg-white pb-4 -mt-2 pt-2">
        <Button 
          onClick={onTakePhoto}
          className="w-full flex items-center justify-center gap-2 py-7 text-lg font-medium text-white bg-drplant-green hover:bg-drplant-green/90 shadow-lg"
        >
          <Camera className="h-8 w-8" />
          <span>Scatta una foto della pianta</span>
        </Button>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Altri metodi</h3>
        
        <Button
          onClick={onUploadPhoto}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-4 hover:bg-drplant-green/10"
        >
          <Upload className="h-6 w-6" />
          <span>Carica un'immagine dalla galleria</span>
        </Button>

        <div className="bg-amber-50 rounded-md p-4 mt-6">
          <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
            <Image className="h-4 w-4" /> 
            Come fotografare correttamente la pianta
          </h4>
          
          <ul className="space-y-2 text-xs text-amber-600">
            <li className="flex items-start gap-2">
              <span className="bg-amber-200 text-amber-800 rounded-full h-4 w-4 flex items-center justify-center mt-0.5">✓</span>
              <span>Fotografa l'intera pianta, compreso il vaso e il terreno</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-amber-200 text-amber-800 rounded-full h-4 w-4 flex items-center justify-center mt-0.5">✓</span>
              <span>Se è in piena terra, includi il terreno circostante</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-amber-200 text-amber-800 rounded-full h-4 w-4 flex items-center justify-center mt-0.5">✓</span>
              <span>Assicurati che l'immagine sia ben illuminata e nitida</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-blue-50 rounded-md p-4 mt-4">
          <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
            <Image className="h-4 w-4" /> 
            Parti di piante supportate
          </h4>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Leaf className="h-3 w-3" /> Foglie
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <GitBranch className="h-3 w-3" /> Steli
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Sprout className="h-3 w-3" /> Radici
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Flower className="h-3 w-3" /> Fiori
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Sprout className="h-3 w-3" /> Germogli
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <GitBranch className="h-3 w-3" /> Rami
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCaptureMethods;
