import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2, Eye, EyeOff, Thermometer, Leaf, Check, X } from 'lucide-react';
import DiagnosisTabs from '../DiagnosisTabs';
import { DiagnosedDisease, PlantInfoFormValues } from '../types';
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
  const hasThermalMap = analysisData?.analysisDetails?.thermalMap && !isAnalyzing;
  
  // Get plant name from analytics or use a default
  const plantName = analysisData?.analysisDetails?.plantName || "Pianta";
  
  // Check if multi-service identified a plant species
  const plantSpecies = analysisData?.analysisDetails?.plantSpecies || plantName;
  
  // Check if we have AI service-specific results
  const hasAiServiceData = analysisData?.analysisDetails?.aiServices && 
                          analysisData.analysisDetails.aiServices.length > 0;

  // Check if we have Sistema Digitale Foglia data
  const hasSistemaDigitaleData = analysisData?.analysisDetails?.multiServiceInsights?.advancedLeafAnalysis ||
                                analysisData?.analysisDetails?.multiServiceInsights?.sistemaDigitaleFogliaVersion;

  // Mock navigation functions for DiagnosisTabs
  const handleNavigateToLibrary = (resourceId?: string) => {
    console.log("Navigate to library:", resourceId);
  };

  const handleNavigateToShop = (productId?: string) => {
    console.log("Navigate to shop:", productId);
  };

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
            
            {/* Sistema Digitale Foglia badge */}
            {hasSistemaDigitaleData && !isAnalyzing && (
              <div className="absolute top-0 right-0 m-2">
                <Badge className="bg-blue-600 text-white flex items-center gap-1 py-1.5">
                  <Leaf className="h-3 w-3" />
                  <span className="text-xs">Sistema Digitale Foglia</span>
                </Badge>
              </div>
            )}
            
            {/* Thermal map overlay */}
            {hasThermalMap && showThermalMap && (
              <div className="absolute inset-0 mix-blend-overlay">
                <img 
                  src={analysisData?.analysisDetails?.thermalMap} 
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
          
          {/* Sistema Digitale Foglia analysis panel */}
          {hasSistemaDigitaleData && !isAnalyzing && analysisData?.analysisDetails?.multiServiceInsights?.leafAnalysis && (
            <div className="mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAiServices(!showAiServices)}
                className={`flex items-center gap-1.5 w-full ${showAiServices ? 'bg-blue-50 text-blue-700' : ''}`}
              >
                {showAiServices ? (
                  <>
                    <EyeOff className="h-4 w-4" /> Nascondi Analisi Foglia
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" /> Mostra Analisi Foglia
                  </>
                )}
              </Button>
              
              {showAiServices && (
                <div className="mt-2 border rounded-lg p-3 text-xs bg-blue-50">
                  <h4 className="font-semibold mb-2">Analisi Foglia</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Colore foglia:</span>
                      <span className="font-medium">{analysisData.analysisDetails.multiServiceInsights.leafAnalysis.leafColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pattern rilevato:</span>
                      <span className="font-medium">{analysisData.analysisDetails.multiServiceInsights.leafAnalysis.patternDetected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stato sanitario:</span>
                      <span className={`font-medium ${analysisData.analysisDetails.multiServiceInsights.leafAnalysis.healthStatus === 'healthy' ? 'text-green-600' : 'text-amber-600'}`}>
                        {analysisData.analysisDetails.multiServiceInsights.leafAnalysis.healthStatus === 'healthy' ? 'Sana' : 'Patologica'}
                      </span>
                    </div>
                    {analysisData.analysisDetails.multiServiceInsights.leafAnalysis.details?.symptomDescription && (
                      <div className="flex justify-between">
                        <span>Sintomi:</span>
                        <span className="font-medium text-right">{analysisData.analysisDetails.multiServiceInsights.leafAnalysis.details.symptomDescription}</span>
                      </div>
                    )}
                  </div>
                  
                  {analysisData?.analysisDetails?.multiServiceInsights?.leafDiagnosticCapabilities && (
                    <div className="mt-3 pt-2 border-t">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-blue-700">Analisi avanzata con Sistema Digitale Foglia</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* AI Services analysis results */}
          {hasAiServiceData && !isAnalyzing && !showAiServices && (
            <div className="mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAiServices(true)}
                className="flex items-center gap-1.5 w-full"
              >
                <Eye className="h-4 w-4" /> Mostra Dettagli Analisi AI
              </Button>
            </div>
          )}
          
          <div className="bg-drplant-green/10 p-3 rounded-lg mb-4">
            <h4 className="font-medium mb-1">Informazioni Pianta</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Ambiente: </span>
                <span>{plantInfo.isIndoor ? "Indoor" : "Outdoor"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Irrigazione: </span>
                <span>{plantInfo.wateringFrequency} volte/settimana</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Luce: </span>
                <span>{plantInfo.lightExposure}</span>
              </div>
              {plantInfo.symptoms && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Sintomi: </span>
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
              <p className="text-drplant-blue font-medium mb-2">Analisi in corso...</p>
              <div className="w-full max-w-xs">
                <progress value={75} max={100} className="w-full h-2" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Sistemi di analisi avanzata in elaborazione
              </p>
            </div>
          ) : analysisData ? (
            <div className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-amber-500">{Math.round(analysisData.confidence * 100)}% Confidenza</Badge>
                {analysisData?.analysisDetails?.multiServiceInsights?.sistemaDigitaleFogliaVersion && (
                  <Badge className="bg-blue-600">Sistema Digitale Foglia v{analysisData.analysisDetails.multiServiceInsights.sistemaDigitaleFogliaVersion}</Badge>
                )}
              </div>
              
              <DiagnosisTabs
                disease={analysisData}
                analysisDetails={analysisData.analysisDetails || null}
                activeTab={activeResultTab}
                onTabChange={setActiveResultTab}
                onNavigateToLibrary={handleNavigateToLibrary}
                onNavigateToShop={handleNavigateToShop}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 h-full">
              <p className="text-gray-500">Carica un'immagine per iniziare la diagnosi</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DiagnosisResult;
