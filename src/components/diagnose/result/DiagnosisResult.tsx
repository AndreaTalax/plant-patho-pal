import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePremiumStatus } from '@/services/premiumService';
import { useSaveDiagnosis } from '@/hooks/useSaveDiagnosis';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import ActionButtons from './ActionButtons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ProductSuggestions from './ProductSuggestions';

interface DiagnosisResultProps {
  diagnosedDisease?: any;
  confidence?: number;
  isHealthy?: boolean;
  plantInfo: any;
  analysisDetails?: any;
  imageSrc: string;
  onStartNewAnalysis: () => void;
  onSaveDiagnosis?: () => void;
  onChatWithExpert?: () => void;
  saveLoading?: boolean;
  isAnalyzing: boolean;
  hasExpertChatAccess?: boolean;
  analysisData?: any;
}

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({
  diagnosedDisease,
  confidence,
  isHealthy,
  plantInfo,
  analysisDetails,
  imageSrc,
  onStartNewAnalysis,
  onSaveDiagnosis,
  onChatWithExpert,
  saveLoading,
  isAnalyzing,
  hasExpertChatAccess,
  analysisData,
}) => {
  const { user } = useAuth();
  const { hasExpertChatAccess: premiumAccess } = usePremiumStatus();
  const { saveDiagnosis, isSaving: savingDiagnosis } = useSaveDiagnosis();

  const resolvedConfidence = confidence ?? 0;
  const resolvedIsHealthy = !!isHealthy;
  const resolvedSaveLoading = !!saveLoading || savingDiagnosis;
  const resolvedHasExpertChatAccess = premiumAccess;

  const effectiveDiagnosis = diagnosedDisease ?? analysisData;

  const handleSaveDiagnosis = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per salvare la diagnosi');
      return;
    }

    try {
      const diagnosisToSave = {
        user_id: user.id,
        plant_type: plantInfo?.name || effectiveDiagnosis?.name || 'Pianta non identificata',
        plant_variety: analysisDetails?.multiServiceInsights?.plantSpecies || '',
        symptoms: JSON.stringify(
          Array.isArray(plantInfo?.symptoms)
            ? plantInfo.symptoms
            : plantInfo?.symptoms
            ? [plantInfo.symptoms]
            : ['Nessun sintomo specificato']
        ),
        image_url: imageSrc,
        diagnosis_result: effectiveDiagnosis || analysisDetails || {},
        status: 'completed',
      };

      const { data, error } = await supabase
        .from('diagnoses')
        .insert(diagnosisToSave)
        .select()
        .single();

      if (error) throw error;

      toast.success('Diagnosi salvata con successo!');
      return data;
    } catch (error: any) {
      toast.error('Errore nel salvataggio: ' + (error.message || 'Errore sconosciuto'));
    }
  };

  const finalSaveDiagnosis = onSaveDiagnosis || handleSaveDiagnosis;

  if (isAnalyzing) return <div className="text-center">Analisi in corso...</div>;
  if (!imageSrc) return <div className="text-center">Nessuna immagine da mostrare.</div>;

  const detectedDiseases =
    analysisDetails?.risultatiCompleti?.detectedDiseases ||
    plantInfo?.diagnosisResult?.diseases ||
    [];

  const diagnosisData = {
    plantType: plantInfo?.name || effectiveDiagnosis?.name || 'Pianta non identificata',
    plantVariety: analysisDetails?.multiServiceInsights?.plantSpecies || '',
    symptoms: plantInfo?.symptoms || 'Nessun sintomo specificato',
    imageUrl: imageSrc || '',
    analysisResult: effectiveDiagnosis || null,
    diagnosisResult: effectiveDiagnosis || null,
    confidence: resolvedConfidence,
    isHealthy: resolvedIsHealthy,
    plantInfo: plantInfo,
  };

  const handlePayAndSendDiagnosis = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per procedere');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {});
      if (error) throw error;

      if (data?.url) {
        toast.success('Reindirizzamento al pagamento...', {
          description: 'Dopo il pagamento, la diagnosi sarà inviata automaticamente all\'esperto',
        });

        localStorage.setItem(
          'pendingDiagnosis',
          JSON.stringify({
            userId: user.id,
            diagnosisData,
            timestamp: Date.now(),
          })
        );

        window.open(data.url, '_blank');
      } else {
        throw new Error('URL checkout non ricevuto');
      }
    } catch (error) {
      toast.error('Errore durante il processo di pagamento.');
    }
  };

  const handleChatWithExpert = async () => {
    console.log('🗣️ Apertura chat con esperto (diagnosi AI già pronta)');
    if (!user) {
      toast.error('Devi essere autenticato per procedere');
      return;
    }

    if (!resolvedHasExpertChatAccess) {
      toast.error('Accesso Premium richiesto', {
        description: 'Acquista l\'abbonamento Premium per chattare con l\'esperto',
      });
      return;
    }

    try {
      // Nessun invio manuale: la diagnosi è già nel PlantInfoContext e verrà inviata automaticamente.
      toast.success('Apertura chat con l\'esperto...', {
        description: 'La diagnosi AI verrà inviata automaticamente in chat',
      });

      if (onChatWithExpert) await onChatWithExpert();
    } catch (error) {
      toast.error('Errore nell\'apertura della chat');
    }
  };

  // 👇 NUOVO: sincronizza automaticamente la diagnosi AI nel PlantInfoContext
  useEffect(() => {
    if (effectiveDiagnosis && plantInfo && !plantInfo.diagnosisResult) {
      plantInfo.diagnosisResult = { ...effectiveDiagnosis };
      console.log('✅ DiagnosisResult sincronizzato nel PlantInfoContext per invio automatico.');
    }
  }, [effectiveDiagnosis, plantInfo]);

  return (
    <div className="space-y-4 px-2 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-blue-700 bg-clip-text text-transparent">
            {resolvedIsHealthy ? '✅ Pianta Sana!' : '🔬 Risultati Analisi'}
          </h1>
        </div>
        <p className="text-gray-600">
          Analisi completata con successo usando AI multipla e database EPPO
        </p>
      </div>

      {/* IMMAGINE + INFO BASE */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl shadow-lg border border-gray-200">
        <ImageDisplay imageSrc={imageSrc} />
        <div className="mt-4">
          <PlantInfoCard
            plantInfo={plantInfo}
            analysisDetails={analysisDetails}
            standardizedData={effectiveDiagnosis}
          />
        </div>
      </div>

      {/* ... tutte le sezioni di rendering invariato ... */}

      <div className="mt-4">
        <ActionButtons
          onStartNewAnalysis={onStartNewAnalysis}
          onSaveDiagnosis={finalSaveDiagnosis}
          onChatWithExpert={handleChatWithExpert}
          onPayAndSendDiagnosis={handlePayAndSendDiagnosis}
          saveLoading={resolvedSaveLoading}
          hasValidAnalysis={!!effectiveDiagnosis}
          useAI={true}
          diagnosisData={diagnosisData}
        />
      </div>
    </div>
  );
};

export default DiagnosisResult;
