
import { useState } from 'react';
import { AnalysisDetails, DiagnosisResultProps } from '../types';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import ActionButtons from './ActionButtons';
import AiServicesData from './AiServicesData';
import EppoDataPanel from './EppoDataPanel';
import { formatHuggingFaceResult } from '@/utils/plant-analysis';
import { Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({
  imageSrc,
  plantInfo,
  analysisData,
  isAnalyzing,
  onStartNewAnalysis
}) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);

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
          malattia: analysisData.healthy ? 'Sana' : analysisData.label,
          accuratezza: analysisData.score,
          user_id: user.id,
          risultati_completi: analysisData
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
      
      <EppoDataPanel 
        analysisDetails={analysisDetails}
      />
      
      <AiServicesData 
        analysisDetails={analysisDetails}
        isAnalyzing={isAnalyzing}
      />
      
      <ActionButtons 
        onStartNewAnalysis={onStartNewAnalysis}
        onSaveDiagnosis={saveDiagnosis}
        saveLoading={saveLoading}
        hasValidAnalysis={!!analysisData && !!analysisDetails}
      />
    </div>
  );
};

export default DiagnosisResult;
