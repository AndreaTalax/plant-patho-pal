
import { Button } from '@/components/ui/button';
import { Camera, Upload, Image, Flower, Leaf, GitBranch, Sprout } from 'lucide-react';

interface ImageCaptureMethodsProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
}

/**
 * Provides a UI component for capturing and uploading plant images.
 * @example
 * ImageCaptureMethods({ onTakePhoto: handleTakePhoto, onUploadPhoto: handleUploadPhoto })
 * <div>Rendered image capturing interface</div>
 * @param {function} onTakePhoto - Function to execute when "Scatta una foto della pianta" button is clicked.
 * @param {function} onUploadPhoto - Function to execute when "Carica un'immagine dalla galleria" button is clicked.
 * @returns {JSX.Element} A JSX element containing buttons and guides for capturing plant photos.
 * @description
 *   - Includes guiding instructions for taking high-quality photos of plants.
 *   - Offers two main methods for image input: direct photo capture and upload from gallery.
 *   - Provides context on specific plant parts that are supported for analysis.
 */
const ImageCaptureMethods = ({ onTakePhoto, onUploadPhoto }: ImageCaptureMethodsProps) => {
  return (
    <div className="space-y-6 pb-safe">
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

        <div className="bg-amber-50 rounded-lg p-4 mt-6">
          <h4 className="text-sm font-medium text-amber-700 mb-3 flex items-center gap-2">
            📸 Come fotografare la pianta
          </h4>
          
          <ul className="space-y-4 text-sm text-amber-600">
            <li className="flex items-start gap-3">
              <span className="bg-amber-200 text-amber-800 rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs mt-0.5">🪴</span>
              <div className="flex-1 leading-relaxed">
                <span className="font-medium block mb-1">Pianta in vaso:</span>
                <span className="text-xs leading-relaxed">Fotografa l'intera pianta incluso il vaso, assicurandoti che si veda la terra del vaso</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-amber-200 text-amber-800 rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs mt-0.5">🌱</span>
              <div className="flex-1 leading-relaxed">
                <span className="font-medium block mb-1">Pianta in piena terra:</span>
                <span className="text-xs leading-relaxed">Fotografa la pianta e la terra circostante</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-amber-200 text-amber-800 rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs mt-0.5">💡</span>
              <div className="flex-1 leading-relaxed">
                <span className="font-medium block mb-1">Qualità:</span>
                <span className="text-xs leading-relaxed">Usa buona illuminazione e mantieni la fotocamera stabile</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-amber-200 text-amber-800 rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs mt-0.5">🔍</span>
              <div className="flex-1 leading-relaxed">
                <span className="font-medium block mb-1">Sintomi:</span>
                <span className="text-xs leading-relaxed">Includi nell'inquadratura le parti malate o danneggiate</span>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
            <Image className="h-4 w-4" /> 
            Parti di piante supportate
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-xs text-blue-600 p-2">
              <Leaf className="h-3 w-3 flex-shrink-0" /> 
              <span>Foglie</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600 p-2">
              <GitBranch className="h-3 w-3 flex-shrink-0" /> 
              <span>Steli</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600 p-2">
              <Sprout className="h-3 w-3 flex-shrink-0" /> 
              <span>Radici</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600 p-2">
              <Flower className="h-3 w-3 flex-shrink-0" /> 
              <span>Fiori</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600 p-2">
              <Sprout className="h-3 w-3 flex-shrink-0" /> 
              <span>Germogli</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600 p-2">
              <GitBranch className="h-3 w-3 flex-shrink-0" /> 
              <span>Rami</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCaptureMethods;
