
import { Button } from '@/components/ui/button';
import { Camera, Upload, Image, Flower, Leaf, GitBranch, Sprout } from 'lucide-react';

interface ImageCaptureMethodsProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
}

const ImageCaptureMethods = ({ onTakePhoto, onUploadPhoto }: ImageCaptureMethodsProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Capture Plant Image</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button 
            onClick={onTakePhoto}
            className="flex flex-col items-center gap-2 h-auto py-4 text-white bg-drplant-green hover:bg-drplant-green/90"
          >
            <Camera className="h-6 w-6" />
            <span>Take Photo</span>
          </Button>
          
          <Button
            onClick={onUploadPhoto}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-drplant-green/10"
          >
            <Upload className="h-6 w-6" />
            <span>Upload Image</span>
          </Button>
        </div>

        <div className="bg-blue-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
            <Image className="h-4 w-4" /> 
            Supported Plant Parts
          </h4>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Leaf className="h-3 w-3" /> Leaves
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <GitBranch className="h-3 w-3" /> Stems
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Sprout className="h-3 w-3" /> Roots
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Flower className="h-3 w-3" /> Flowers
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Sprout className="h-3 w-3" /> Shoots
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <GitBranch className="h-3 w-3" /> Branches
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCaptureMethods;
