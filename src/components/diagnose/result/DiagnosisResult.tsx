
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2, Eye, EyeOff, Thermometer, Leaf, Check, X } from 'lucide-react';
import DiagnosisTabs from './DiagnosisTabs';
import { PlantInfoFormValues } from '../PlantInfoForm';
import { DiagnosedDisease } from '../types';
import ActionButtons from './ActionButtons';

interface DiagnosisResultProps {
  imageSrc: string;
  plantInfo: PlantInfoFormValues;
  isAnalyzing: boolean;
  analysisData: DiagnosedDisease | null;
  onStartNewAnalysis: () => void;
  onChatWithExpert?: () => void;
}

const DiagnosisResult = ({
  imageSrc,
  plantInfo,
  isAnalyzing,
  analysisData,
  onStartNewAnalysis,
  onChatWithExpert
}: DiagnosisResultProps) => {
  const [showThermalMap, setShowThermalMap] = useState(false);
  const [showAiServices, setShowAiServices] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('overview');

  // Check if we have a thermal map
  const hasThermalMap = analysisData?.thermalMap && !isAnalyzing;
  
  // Get plant name from analytics or use a default
  const plantName = analysisData?.plantName || "Pianta";
  
  // Check if multi-service identified a plant species
  const plantSpecies = analysisData?.plantSpecies || plantName;
  
  // Check if we have AI service-specific results
  const hasAiServiceData = analysisData?.aiServices && analysisData.aiServices.length > 0;

  return (
    <Card className="bg-white p-6 shadow-md rounded-2xl w-full max-w-2xl">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/5">
          <div className="aspect-square w-full overflow-hidden rounded-xl mb-4 relative">
            <img 
              src={imageSrc} 
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
            
            {/* Thermal map overlay */}
            {hasThermalMap && showThermalMap && (
              <div className="absolute inset-0 mix-blend-overlay">
                <img 
                  src={analysisData?.thermalMap} 
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
                    {analysisData?.aiServices?.map((service: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{service.name}</span>
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
                  
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Nome pianta rilevato:</span>
                      <span className="font-medium">{plantName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="bg-drplant-green/10 p-3 rounded-lg mb-4">
            <h4 className="font-medium mb-1">Plant Information</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Environment: </span>
                <span>{plantInfo.isIndoor ? "Indoor" : "Outdoor"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Watering: </span>
                <span>{plantInfo.wateringFrequency} times/week</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Light: </span>
                <span>{plantInfo.lightExposure}</span>
              </div>
              {plantInfo.symptoms && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Symptoms: </span>
                  <span>{plantInfo.symptoms}</span>
                </div>
              )}
            </div>
          </div>
          
          <ActionButtons
            onStartNewAnalysis={onStartNewAnalysis}
            onChatWithExpert={onChatWithExpert}
            hasValidAnalysis={!!analysisData}
            useAI={plantInfo.useAI}
            plantImage={imageSrc}
            plantInfo={{
              isIndoor: plantInfo.isIndoor,
              wateringFrequency: plantInfo.wateringFrequency,
              lightExposure: plantInfo.lightExposure,
              symptoms: plantInfo.symptoms
            }}
          />
        </div>

        <div className="md:w-3/5">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4 h-full">
              <Loader2 className="h-8 w-8 text-drplant-blue animate-spin mb-4" />
              <p className="text-drplant-blue font-medium mb-2">Analyzing your plant...</p>
              <div className="w-full max-w-xs">
                <progress value={75} max="100" className="w-full h-2" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Multiple AI services are analyzing your plant
              </p>
            </div>
          ) : analysisData ? (
            <div className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-amber-500">{Math.round(analysisData.confidence * 100)}% Confidence</Badge>
              </div>
              
              <DiagnosisTabs
                disease={analysisData}
                analysisDetails={analysisData}
                activeTab={activeResultTab}
                onTabChange={setActiveResultTab}
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
