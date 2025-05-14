
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Leaf, Thermometer, Eye, EyeOff } from 'lucide-react';
import { AnalysisDetails } from '../types';

interface ImageDisplayProps {
  uploadedImage: string;
  analysisDetails: AnalysisDetails | null;
  isAnalyzing: boolean;
}

const ImageDisplay = ({ uploadedImage, analysisDetails, isAnalyzing }: ImageDisplayProps) => {
  const [showThermalMap, setShowThermalMap] = useState(false);
  
  // Check if we have a thermal map
  const hasThermalMap = analysisDetails?.thermalMap && !isAnalyzing;
  
  // Check if multi-service identified a plant species
  const plantSpecies = analysisDetails?.multiServiceInsights?.plantName || analysisDetails?.multiServiceInsights?.plantSpecies;

  return (
    <div>
      <div className="aspect-square w-full overflow-hidden rounded-xl mb-4 relative">
        <img 
          src={uploadedImage} 
          alt="Pianta caricata" 
          className="w-full h-full object-cover"
        />
        
        {/* Plant species badge from multi-service */}
        {plantSpecies && !isAnalyzing && (
          <div className="absolute top-0 left-0 m-2">
            <Badge className="bg-drplant-green text-white flex items-center gap-1 py-1.5">
              <Leaf className="h-3 w-3" />
              <span className="text-xs">{plantSpecies}</span>
            </Badge>
          </div>
        )}
        
        {/* Leaf verification overlay */}
        {analysisDetails?.leafVerification && !isAnalyzing && analysisDetails.leafVerification.isLeaf && analysisDetails.leafVerification.boundingBox && (
          <div 
            className="absolute border-2 border-green-500"
            style={{
              top: `${analysisDetails.leafVerification.boundingBox.y}px`,
              left: `${analysisDetails.leafVerification.boundingBox.x}px`,
              width: `${analysisDetails.leafVerification.boundingBox.width}px`,
              height: `${analysisDetails.leafVerification.boundingBox.height}px`
            }}
          >
            <Badge className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-green-500">
              Foglia {analysisDetails.leafVerification.leafPercentage}%
            </Badge>
          </div>
        )}
        
        {/* Thermal map overlay */}
        {hasThermalMap && showThermalMap && (
          <div className="absolute inset-0 mix-blend-overlay">
            <img 
              src={analysisDetails.thermalMap} 
              alt="Mappa termica" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      
      {/* Thermal map toggle */}
      {hasThermalMap && (
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowThermalMap(!showThermalMap)}
            className={`flex items-center gap-1.5 w-full ${showThermalMap ? 'bg-drplant-blue-light text-drplant-blue' : ''}`}
          >
            {showThermalMap ? (
              <>
                <EyeOff className="h-4 w-4" /> Nascondi Scansione Termica
              </>
            ) : (
              <>
                <Thermometer className="h-4 w-4" /> Mostra Scansione Termica
              </>
            )}
          </Button>
          {showThermalMap && (
            <p className="text-xs text-gray-500 mt-1">
              Le aree rosse indicano possibili localizzazioni di malattie
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
