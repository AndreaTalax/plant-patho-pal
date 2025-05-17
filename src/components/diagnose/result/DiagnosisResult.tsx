
import { useState } from 'react';
import { AnalysisDetails, DiagnosisResultProps } from '../types';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import ActionButtons from './ActionButtons';
import AiServicesData from './AiServicesData';
import EppoDataPanel from './EppoDataPanel';
import { formatHuggingFaceResult } from '@/utils/plant-analysis';
import { Loader2, Info } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({
  imageSrc,
  plantInfo,
  analysisData,
  isAnalyzing,
  onStartNewAnalysis
}) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);
  const navigate = useNavigate();

  // Process raw analysis data when it becomes available
  useState(() => {
    if (analysisData && !analysisDetails) {
      const formattedData = formatHuggingFaceResult(analysisData);
      setAnalysisDetails(formattedData);
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
          malattia: analysisData.healthy ? 'Sana' : analysisData.name,
          accuratezza: analysisData.confidence,
          user_id: user.id,
          risultati_completi: {
            ...analysisData,
            plantInfo: {
              isIndoor: plantInfo.isIndoor,
              wateringFrequency: plantInfo.wateringFrequency,
              lightExposure: plantInfo.lightExposure,
              symptoms: plantInfo.symptoms
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
  
  // Navigate to the chat tab
  const handleChatWithExpert = () => {
    navigate('/');
    // Using a slight timeout to ensure navigation completes before tab selection
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'chat' });
      window.dispatchEvent(event);
    }, 100);
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-green-500 animate-spin mb-4" />
        <p className="text-lg font-medium">Analisi in corso...</p>
        <p className="text-sm text-gray-500">Stiamo esaminando la tua pianta utilizzando i modelli AI</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ImageDisplay 
        imageSrc={imageSrc} 
        isHealthy={analysisDetails?.multiServiceInsights?.isHealthy}
      />
      
      <PlantInfoCard 
        plantInfo={plantInfo}
        analysisDetails={analysisDetails}
      />
      
      {plantInfo.useAI && analysisData && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">Diagnosi AI - Limitazioni di accuratezza:</h3>
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  <li className="flex items-center space-x-2">
                    <span className="inline-block w-16 font-medium">60-75%</span>
                    <span>Diagnosi basata su immagine (se la foto è chiara e mostra bene i sintomi)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="inline-block w-16 font-medium">&lt;50%</span>
                    <span>Precisione se non supportata da esami di laboratorio</span>
                  </li>
                </ul>
                <p className="mt-2 text-xs text-amber-800 font-medium">
                  Per una diagnosi più accurata, ti consigliamo di consultare un fitopatologo esperto
                </p>
              </div>
            </div>
          </div>
          
          <EppoDataPanel 
            analysisDetails={analysisDetails}
          />
          
          <AiServicesData 
            analysisDetails={analysisDetails}
            isAnalyzing={isAnalyzing}
          />
        </>
      )}
      
      <ActionButtons 
        onStartNewAnalysis={onStartNewAnalysis}
        onSaveDiagnosis={plantInfo.useAI ? saveDiagnosis : undefined}
        onChatWithExpert={handleChatWithExpert}
        saveLoading={saveLoading}
        hasValidAnalysis={!!analysisData && !!analysisDetails && plantInfo.useAI}
        useAI={plantInfo.useAI}
      />
    </div>
  );
};

export default DiagnosisResult;
