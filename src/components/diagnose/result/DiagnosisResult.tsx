
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff, Thermometer, Leaf, Sparkles, Activity } from 'lucide-react';
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
  
  // Get plant name from analytics or use a default - Fixed potential undefined access
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
    console.log('Navigate to library:', resourceId);
  };

  const navigateToShop = (productId?: string) => {
    // Implementation for shop navigation
    console.log('Navigate to shop:', productId);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm p-8 shadow-2xl rounded-3xl w-full max-w-6xl border border-drplant-green/20">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image Section */}
        <div className="lg:w-2/5">
          <div className="aspect-square w-full overflow-hidden rounded-3xl mb-6 relative group">
            <img 
              src={imageSrc} 
              alt="Uploaded plant" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Plant species badge */}
            {plantSpecies && !isAnalyzing && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-gradient-to-r from-drplant-green to-drplant-green-dark text-white flex items-center gap-2 py-2 px-4 rounded-2xl shadow-lg backdrop-blur-sm">
                  <Leaf className="h-4 w-4" />
                  <span className="text-sm font-medium">{plantSpecies}</span>
                </Badge>
              </div>
            )}
            
            {/* Thermal map overlay */}
            {hasThermalMap && showThermalMap && (
              <div className="absolute inset-0 mix-blend-overlay rounded-3xl">
                <img 
                  src={analysisDetails?.thermalMap} 
                  alt="Thermal map" 
                  className="w-full h-full object-cover rounded-3xl"
                />
              </div>
            )}

            {/* Analysis indicator */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 rounded-3xl">
                <div className="flex items-center gap-3 text-white">
                  <Activity className="h-5 w-5 animate-pulse" />
                  <span className="text-sm font-medium">Analisi in corso...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Thermal map toggle */}
          {hasThermalMap && (
            <div className="mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowThermalMap(!showThermalMap)}
                className={`flex items-center gap-2 w-full rounded-2xl border-drplant-blue/30 ${
                  showThermalMap 
                    ? 'bg-gradient-to-r from-drplant-blue to-drplant-blue-light text-white border-drplant-blue' 
                    : 'hover:bg-drplant-blue/10'
                }`}
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
          <div className="bg-gradient-to-br from-drplant-green/10 to-drplant-blue/10 p-6 rounded-3xl border border-drplant-green/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-drplant-green" />
              <h4 className="font-bold text-gray-800">Informazioni Pianta</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-2xl">
                <span className="text-gray-600 font-medium">Ambiente</span>
                <Badge variant="outline" className="bg-white/80">
                  {plantInfo.isIndoor ? "Interno" : "Esterno"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-2xl">
                <span className="text-gray-600 font-medium">Irrigazione</span>
                <Badge variant="outline" className="bg-white/80">
                  {plantInfo.wateringFrequency} volte/settimana
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-2xl">
                <span className="text-gray-600 font-medium">Nome</span>
                <Badge className="bg-gradient-to-r from-drplant-green to-drplant-green-dark text-white">
                  {plantName}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="lg:w-3/5">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-16 h-full bg-gradient-to-br from-drplant-blue/5 to-drplant-green/5 rounded-3xl">
              <div className="relative mb-8">
                <Loader2 className="h-16 w-16 text-drplant-blue animate-spin" />
                <Sparkles className="h-6 w-6 text-drplant-green absolute -top-2 -right-2 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-drplant-blue to-drplant-green bg-clip-text text-transparent mb-4">
                Analisi della pianta in corso
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                I nostri sistemi AI avanzati stanno analizzando la tua pianta per fornire una diagnosi accurata
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                <div className="text-center">
                  <div className="w-12 h-12 bg-drplant-blue/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Activity className="h-6 w-6 text-drplant-blue animate-pulse" />
                  </div>
                  <span className="text-xs text-gray-500">Scanning</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-drplant-green/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Sparkles className="h-6 w-6 text-drplant-green animate-pulse" />
                  </div>
                  <span className="text-xs text-gray-500">Analyzing</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-drplant-blue/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Leaf className="h-6 w-6 text-drplant-blue animate-pulse" />
                  </div>
                  <span className="text-xs text-gray-500">Processing</span>
                </div>
              </div>
            </div>
          ) : analysisData ? (
            <div className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-2xl shadow-lg">
                  <Activity className="h-4 w-4 mr-2" />
                  {Math.round((analysisData.confidence || 0) * 100)}% Sicurezza
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
            <div className="flex flex-col items-center justify-center py-16 h-full bg-gradient-to-br from-gray-50 to-drplant-green/5 rounded-3xl">
              <div className="w-24 h-24 bg-gradient-to-br from-drplant-blue/20 to-drplant-green/20 rounded-full flex items-center justify-center mb-6">
                <Camera className="h-12 w-12 text-drplant-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Pronto per l'analisi</h3>
              <p className="text-gray-500 text-center">Carica un'immagine per iniziare la diagnosi della tua pianta</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isAnalyzing && (
        <div className="mt-8 pt-6 border-t border-drplant-green/20">
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
