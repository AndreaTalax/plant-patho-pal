
import { Loader2 } from 'lucide-react';
import { AnalysisDetails } from '../types';
import { Badge } from '@/components/ui/badge';

interface ImageDisplayProps {
  uploadedImage: string;
  analysisDetails: AnalysisDetails | null;
  isAnalyzing: boolean;
}

const ImageDisplay = ({ uploadedImage, analysisDetails, isAnalyzing }: ImageDisplayProps) => {
  // Check if we have a plant part identified
  const plantPart = analysisDetails?.multiServiceInsights?.plantPart;
  
  // Get the bounding box if we have one
  const boundingBox = analysisDetails?.leafVerification?.boundingBox;
  
  return (
    <div className="aspect-square w-full overflow-hidden rounded-xl mb-4 relative">
      {/* Image */}
      <img 
        src={uploadedImage} 
        alt="Uploaded plant" 
        className="w-full h-full object-cover"
      />
      
      {/* Loading overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}
      
      {/* Plant part badge */}
      {plantPart && !isAnalyzing && (
        <div className="absolute top-0 right-0 m-2">
          <Badge className="bg-blue-500 text-white">
            {plantPart.charAt(0).toUpperCase() + plantPart.slice(1)} Analysis
          </Badge>
        </div>
      )}
      
      {/* Bounding box for identified plant part */}
      {boundingBox && !isAnalyzing && analysisDetails?.leafVerification && (
        <div 
          className="absolute border-2 border-green-500"
          style={{
            top: `${boundingBox.y}px`,
            left: `${boundingBox.x}px`,
            width: `${boundingBox.width}px`,
            height: `${boundingBox.height}px`,
            pointerEvents: 'none'
          }}
        >
          <Badge className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-green-500">
            {analysisDetails.leafVerification.partName || 'Leaf'} {analysisDetails.leafVerification.confidence || ''}%
          </Badge>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
