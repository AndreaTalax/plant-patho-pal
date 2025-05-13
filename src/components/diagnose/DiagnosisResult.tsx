
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2, Eye, EyeOff, Thermometer, Leaf, Check, X } from 'lucide-react';
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
  const [showAiServices, setShowAiServices] = useState(false);

  // Check if we have a thermal map
  const hasThermalMap = analysisDetails?.thermalMap && !isAnalyzing;
  
  // Check if multi-service identified a plant species
  const plantSpecies = analysisDetails?.multiServiceInsights?.plantSpecies;
  
  // Check if we have AI service-specific results
  const hasAiServiceData = analysisDetails?.plantVerification?.aiServices &&
                           analysisDetails.plantVerification.aiServices.length > 0;

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
                    <EyeOff className="h-4 w-4" /> Hide Thermal Scan
                  </>
                ) : (
                  <>
                    <Thermometer className="h-4 w-4" /> Show Thermal Scan
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
          
          {/* AI Services analysis results */}
          {hasAiServiceData && !isAnalyzing && (
            <div className="mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAiServices(!showAiServices)}
                className={`flex items-center gap-1.5 w-full ${showAiServices ? 'bg-green-50 text-green-700' : ''}`}
              >
                {showAiServices ? (
                  <>
                    <EyeOff className="h-4 w-4" /> Hide AI Services Data
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" /> Show AI Services Data
                  </>
                )}
              </Button>
              
              {showAiServices && (
                <div className="mt-2 border rounded-lg p-2 text-xs bg-gray-50">
                  <h4 className="font-semibold mb-1">AI Service Results</h4>
                  <div className="space-y-1.5">
                    {analysisDetails.plantVerification.aiServices.map((service: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{service.serviceName}</span>
                        <div className="flex items-center gap-1">
                          {service.result ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <X className="h-3 w-3 text-red-600" />
                          )}
                          <span className={service.result ? "text-green-600" : "text-red-600"}>
                            {Math.round(service.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {analysisDetails.multiServiceInsights && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Agreement Score:</span>
                        <span className="font-medium">{analysisDetails.multiServiceInsights.agreementScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Primary Service:</span>
                        <span className="font-medium">{analysisDetails.multiServiceInsights.primaryService}</span>
                      </div>
                    </div>
                  )}
                </div>
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
                Multiple AI services are analyzing your plant
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
                
                {/* Removed AI Services badges */}
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

