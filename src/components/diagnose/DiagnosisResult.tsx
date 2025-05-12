
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2, Eye, EyeOff, Thermometer } from 'lucide-react';
import DiagnosisTabs from './DiagnosisTabs';
import { PlantInfoFormValues } from './PlantInfoForm';

interface DiagnosedDisease {
  id: string;
  name: string;
  description: string;
  causes: string;
  treatments: string[];
  products: string[];
  confidence: number;
  resources: string[];
}

interface DiagnosisResultProps {
  uploadedImage: string;
  plantInfo: PlantInfoFormValues;
  isAnalyzing: boolean;
  analysisProgress: number;
  diagnosedDisease: DiagnosedDisease | null;
  diagnosisResult: string | null;
  analysisDetails: any;
  activeResultTab: string;
  setActiveResultTab: (tab: string) => void;
  resetDiagnosis: () => void;
  navigateToChat: () => void;
  navigateToShop: (productId?: string) => void;
  navigateToLibrary: (resourceId?: string) => void;
}

const DiagnosisResult = ({
  uploadedImage,
  plantInfo,
  isAnalyzing,
  analysisProgress,
  diagnosedDisease,
  diagnosisResult,
  analysisDetails,
  activeResultTab,
  setActiveResultTab,
  resetDiagnosis,
  navigateToChat,
  navigateToShop,
  navigateToLibrary
}: DiagnosisResultProps) => {
  const [showThermalMap, setShowThermalMap] = useState(false);

  // Check if we have a thermal map
  const hasThermalMap = analysisDetails?.thermalMap && !isAnalyzing;
  
  return (
    <Card className="bg-white p-6 shadow-md rounded-2xl w-full max-w-2xl">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/5">
          <div className="aspect-square w-full overflow-hidden rounded-xl mb-4 relative">
            <img 
              src={uploadedImage} 
              alt="Uploaded plant" 
              className="w-full h-full object-cover"
            />
            
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
                  Leaf {analysisDetails.leafVerification.leafPercentage}%
                </Badge>
              </div>
            )}
            
            {/* Thermal map overlay */}
            {hasThermalMap && showThermalMap && (
              <div className="absolute inset-0 mix-blend-overlay">
                <img 
                  src={analysisDetails.thermalMap} 
                  alt="Thermal map" 
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
                    <EyeOff className="h-4 w-4" /> Hide Thermal Map
                  </>
                ) : (
                  <>
                    <Thermometer className="h-4 w-4" /> Show Thermal Map
                  </>
                )}
              </Button>
              {showThermalMap && (
                <p className="text-xs text-gray-500 mt-1">
                  Red areas indicate possible disease locations
                </p>
              )}
            </div>
          )}
          
          <div className="bg-drplant-green/10 p-3 rounded-lg mb-4">
            <h4 className="font-medium mb-1">Informazioni sulla pianta</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Ambiente: </span>
                <span>{plantInfo.isIndoor ? "Interno" : "Esterno"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Esposizione: </span>
                <span>{plantInfo.inSunlight ? "Soleggiata" : "Ombreggiata"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Irrigazione: </span>
                <span>{plantInfo.wateringFrequency} volte/settimana</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={resetDiagnosis}
            >
              New Diagnosis
            </Button>
            {diagnosisResult && diagnosedDisease && (
              <Button 
                className="flex-1 bg-drplant-blue hover:bg-drplant-blue-dark"
                onClick={navigateToChat}
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Expert Consult
              </Button>
            )}
          </div>
        </div>

        <div className="md:w-3/5">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4 h-full">
              <Loader2 className="h-8 w-8 text-drplant-blue animate-spin mb-4" />
              <p className="text-drplant-blue font-medium mb-2">Analyzing your plant...</p>
              <div className="w-full max-w-xs">
                <progress value={analysisProgress} max="100" className="w-full h-2" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                PyTorch AI is examining leaf patterns, spots, and discoloration
              </p>
            </div>
          ) : diagnosisResult && diagnosedDisease ? (
            <div className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-amber-500">{Math.round(diagnosedDisease.confidence * 100)}% Confidence</Badge>
                {diagnosedDisease.confidence > 0.9 ? (
                  <Badge className="bg-green-500">High Reliability</Badge>
                ) : diagnosedDisease.confidence > 0.7 ? (
                  <Badge className="bg-yellow-500">Medium Reliability</Badge>
                ) : (
                  <Badge className="bg-red-500">Low Reliability</Badge>
                )}
              </div>
              
              <DiagnosisTabs
                disease={diagnosedDisease}
                analysisDetails={analysisDetails}
                activeTab={activeResultTab}
                onTabChange={setActiveResultTab}
                onNavigateToLibrary={navigateToLibrary}
                onNavigateToShop={navigateToShop}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 h-full">
              <p className="text-gray-500">Upload an image to start diagnosis</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DiagnosisResult;
