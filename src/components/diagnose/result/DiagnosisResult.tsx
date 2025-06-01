
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff, Thermometer, Leaf } from 'lucide-react';
import DiagnosisTabs from '../DiagnosisTabs';
import ActionButtons from './ActionButtons';
import { DiagnosedDisease, PlantInfo, AnalysisDetails } from '../types';

interface DiagnosisResultProps {
  imageSrc: string;
  plantInfo: PlantInfo;
  analysisData: DiagnosedDisease | null;
  isAnalyzing: boolean;
  onStartNewAnalysis: () => void;
  onChatWithExpert?: () => void;
  analysisDetails?: AnalysisDetails | null;
}

const DiagnosisResult = ({
  imageSrc,
  plantInfo,
  analysisData,
  isAnalyzing,
  onStartNewAnalysis,
  onChatWithExpert,
  analysisDetails
}: DiagnosisResultProps) => {
  const [showThermalMap, setShowThermalMap] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Check if we have a thermal map
  const hasThermalMap = analysisDetails?.thermalMap && !isAnalyzing;
  
  // Get plant name from analytics or use a default
  const plantName = analysisDetails?.multiServiceInsights?.plantName || 
                   analysisDetails?.risultatiCompleti?.plantIdResult?.plantName ||
                   analysisData?.name || "Pianta";
  
  // Check if multi-service identified a plant species
  const plantSpecies = analysisDetails?.multiServiceInsights?.plantSpecies || plantName;

  // Prepare diagnosis data for expert chat
  const diagnosisData = {
    plantType: plantName,
    plantVariety: plantSpecies !== plantName ? plantSpecies : undefined,
    symptoms: plantInfo.symptoms,
    imageUrl: imageSrc,
    diagnosisResult: analysisData,
    plantInfo: plantInfo
  };

  const navigateToLibrary = (resourceId?: string) => {
    // Implementation for library navigation
  };

  const navigateToShop = (productId?: string) => {
    // Implementation for shop navigation
  };

  return (
    <Card className="bg-white p-6 shadow-md rounded-2xl w-full max-w-4xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image Section */}
        <div className="lg:w-2/5">
          <div className="aspect-square w-full overflow-hidden rounded-xl mb-4 relative">
            <img 
              src={imageSrc} 
              alt="Uploaded plant" 
              className="w-full h-full object-cover"
            />
            
            {/* Plant species badge */}
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
                    <EyeOff className="h-4 w-4" /> Nascondi Scansione Termica
                  </>
                ) : (
                  <>
                    <Thermometer className="h-4 w-4" /> Mostra Scansione Termica
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Plant Info Summary */}
          <div className="bg-drplant-green/10 p-3 rounded-lg mb-4">
            <h4 className="font-medium mb-1">Informazioni Pianta</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Ambiente:</span>
                <span>{plantInfo.isIndoor ? "Interno" : "Esterno"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Irrigazione:</span>
                <span>{plantInfo.wateringFrequency} volte/settimana</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Nome pianta:</span>
                <span className="font-medium">{plantName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="lg:w-3/5">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-8 h-full">
              <Loader2 className="h-8 w-8 text-drplant-blue animate-spin mb-4" />
              <p className="text-drplant-blue font-medium mb-2">Analisi della pianta in corso...</p>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Servizi AI multipli stanno analizzando la tua pianta
              </p>
            </div>
          ) : analysisData ? (
            <div className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-amber-500">
                  {Math.round(analysisData.confidence * 100)}% Sicurezza
                </Badge>
              </div>
              
              <DiagnosisTabs
                disease={analysisData}
                analysisDetails={analysisDetails}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onNavigateToLibrary={navigateToLibrary}
                onNavigateToShop={navigateToShop}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 h-full">
              <p className="text-gray-500">Carica un'immagine per iniziare la diagnosi</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isAnalyzing && (
        <div className="mt-6">
          <ActionButtons
            onStartNewAnalysis={onStartNewAnalysis}
            onChatWithExpert={onChatWithExpert}
            hasValidAnalysis={!!analysisData}
            useAI={plantInfo.useAI}
            diagnosisData={diagnosisData}
          />
        </div>
      )}
    </Card>
  );
};

export default DiagnosisResult;
