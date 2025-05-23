
import { useState } from 'react';
import { AnalysisDetails, DiagnosisResultProps } from '../types';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import ActionButtons from './ActionButtons';
import AiServicesData from './AiServicesData';
import EppoDataPanel from './EppoDataPanel';
import { formatHuggingFaceResult } from '@/utils/plant-analysis';
import { Loader2, Info, Leaf, Heart, AlertTriangle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Add a new component for care instructions
const CareInstructionsCard = ({ careInstructions, habitat }) => {
  if (!careInstructions && !habitat) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center mb-3">
        <Leaf className="w-5 h-5 text-green-500 mr-2" />
        <h3 className="text-lg font-medium">Cura della pianta e habitat</h3>
      </div>
      
      {habitat && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-700 mb-1">Habitat naturale:</h4>
          <p className="text-gray-600 text-sm">{habitat}</p>
        </div>
      )}
      
      {careInstructions && (
        <div className="space-y-2 mt-2">
          <h4 className="font-medium text-gray-700">Consigli per la cura:</h4>
          
          {careInstructions.watering && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Irrigazione: </span>
              <span className="text-gray-600">{careInstructions.watering}</span>
            </div>
          )}
          
          {careInstructions.light && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Luce: </span>
              <span className="text-gray-600">{careInstructions.light}</span>
            </div>
          )}
          
          {careInstructions.soil && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Terreno: </span>
              <span className="text-gray-600">{careInstructions.soil}</span>
            </div>
          )}
          
          {careInstructions.humidity && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Umidità: </span>
              <span className="text-gray-600">{careInstructions.humidity}</span>
            </div>
          )}
          
          {careInstructions.temperature && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Temperatura: </span>
              <span className="text-gray-600">{careInstructions.temperature}</span>
            </div>
          )}
          
          {careInstructions.fertilizer && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Fertilizzazione: </span>
              <span className="text-gray-600">{careInstructions.fertilizer}</span>
            </div>
          )}
          
          {careInstructions.propagation && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Propagazione: </span>
              <span className="text-gray-600">{careInstructions.propagation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add a new component for AI Services information
const AIServicesInfoCard = ({ sources, privacyInfo }) => {
  if (!sources && !privacyInfo) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center mb-3">
        <Info className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-medium">Informazioni sui servizi AI</h3>
      </div>
      
      {sources && sources.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-700 mb-1">Servizi AI utilizzati:</h4>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {privacyInfo && (
        <div className="mt-3 text-sm text-gray-600">
          <h4 className="font-medium text-gray-700 mb-1">Informazioni sulla privacy:</h4>
          <p className="mb-1">
            {privacyInfo.dataUsage || "Le tue immagini vengono analizzate solo per fornirti consigli sulla pianta e non vengono condivise con terze parti."}
          </p>
          <p>
            {privacyInfo.dataRetention || "Le immagini vengono conservate temporaneamente per il tempo necessario all'analisi e poi eliminate."}
          </p>
        </div>
      )}
    </div>
  );
};

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({
  imageSrc,
  plantInfo,
  analysisData,
  isAnalyzing,
  onStartNewAnalysis,
  onChatWithExpert
}) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);
  const navigate = useNavigate();

  // Process raw analysis data when it becomes available
  useState(() => {
    if (analysisData && !analysisDetails) {
      // Verifica se i dati sono già nel nuovo formato standardizzato
      if (analysisData && typeof analysisData === 'object') {
        const formattedData = formatHuggingFaceResult(analysisData);
        setAnalysisDetails(formattedData);
      }
    }
  });

  // Save diagnosis to user profile
  const saveDiagnosis = async () => {
    if (!analysisData || !imageSrc) return;
    
    try {
      setSaveLoading(true);
      
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Devi accedere per salvare la diagnosi");
        setSaveLoading(false);
        return;
      }
      
      // Create record in the database
      const { error } = await supabase
        .from('diagnosi_piante')
        .insert({
          immagine_nome: plantInfo?.name || 'Pianta non identificata',
          malattia: analysisData.healthy ? 'Sana' : (analysisData.disease?.name || analysisData.name),
          accuratezza: analysisData.confidence || analysisData.score || 0.7,
          user_id: user.id,
          risultati_completi: {
            ...analysisData,
            plantInfo: {
              isIndoor: plantInfo.isIndoor,
              wateringFrequency: plantInfo.wateringFrequency,
              lightExposure: plantInfo.lightExposure,
              symptoms: plantInfo.symptoms
            },
            standardFormat: {
              label: analysisData.label,
              plantPart: analysisData.plantPart || "whole plant",
              healthy: analysisData.healthy === undefined ? true : analysisData.healthy,
              disease: analysisData.disease,
              score: analysisData.score || analysisData.confidence,
              eppoRegulatedConcern: analysisData.eppoRegulatedConcern
            }
          }
        });
      
      if (error) {
        console.error("Errore nel salvataggio:", error);
        toast.error("Errore nel salvataggio della diagnosi");
        setSaveLoading(false);
        return;
      }
      
      toast.success("Diagnosi salvata con successo!");
      setSaveLoading(false);
    } catch (err) {
      console.error("Errore:", err);
      toast.error("Si è verificato un errore durante il salvataggio");
      setSaveLoading(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-green-500 animate-spin mb-4" />
        <p className="text-lg font-medium">Analisi in corso...</p>
        <p className="text-sm text-gray-500">Stiamo esaminando la tua pianta utilizzando più servizi AI</p>
      </div>
    );
  }

  // Extract care instructions and source information
  const careInstructions = analysisData?.careInstructions || null;
  const habitat = analysisData?.habitat || null;
  const sources = analysisData?.sources || 
                 (analysisData?.source ? [analysisData.source] : null);
  
  // Privacy information
  const privacyInfo = {
    dataUsage: "Le tue immagini vengono analizzate solo per fornirti consigli sulla pianta e non vengono condivise con terze parti.",
    dataRetention: "I dati delle immagini vengono conservati temporaneamente e poi eliminati dopo l'analisi."
  };

  // Visualizza i risultati dell'analisi
  return (
    <div className="space-y-4">
      <ImageDisplay 
        imageSrc={imageSrc} 
        isHealthy={analysisData?.healthy || analysisDetails?.multiServiceInsights?.isHealthy}
      />
      
      <PlantInfoCard 
        plantInfo={plantInfo}
        analysisDetails={analysisDetails}
        standardizedData={analysisData} // Pass the standardized data
      />
      
      {/* Display care instructions and habitat information */}
      <CareInstructionsCard 
        careInstructions={careInstructions}
        habitat={habitat}
      />
      
      {plantInfo.useAI && analysisData && (
        <>
          <EppoDataPanel 
            analysisDetails={analysisDetails}
            userInput={plantInfo.symptoms}
            eppoData={analysisData.eppoRegulatedConcern} // Pass the direct EPPO data
          />
          
          <AiServicesData 
            analysisDetails={analysisDetails}
            isAnalyzing={isAnalyzing}
            plantSymptoms={plantInfo.symptoms}
            standardizedData={analysisData} // Pass the standardized data
          />
        </>
      )}
      
      {/* Display AI Services Information */}
      <AIServicesInfoCard
        sources={sources}
        privacyInfo={privacyInfo}
      />
      
      <ActionButtons 
        onStartNewAnalysis={onStartNewAnalysis}
        onSaveDiagnosis={plantInfo.useAI ? saveDiagnosis : undefined}
        onChatWithExpert={onChatWithExpert}
        saveLoading={saveLoading}
        hasValidAnalysis={!!analysisData && !!analysisDetails && plantInfo.useAI}
        useAI={plantInfo.useAI}
      />
    </div>
  );
};

export default DiagnosisResult;
