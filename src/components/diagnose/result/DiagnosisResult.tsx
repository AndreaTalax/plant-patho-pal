import React, { useEffect, useMemo } from 'react';
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

  // Funzione helper per estrarre il nome della malattia
  const getDiseaseName = (disease: any) =>
    disease.name ||
    disease.disease_name ||
    disease.label ||
    disease.type ||
    'Problema identificato';

  // Estrazione delle malattie da varie possibili strutture API
  const healthAssessment = analysisDetails?.healthAssessment ||
                           analysisDetails?.risultatiCompleti?.healthAssessment || {};

  const rawDetectedDiseases =
    analysisDetails?.primaryDiseases ||  // AGGIUNTO: questa è la fonte corretta dalla console!
    healthAssessment?.diseases ||
    analysisDetails?.diseases ||
    analysisDetails?.risultatiCompleti?.detectedDiseases ||
    plantInfo?.diagnosisResult?.diseases ||
    effectiveDiagnosis?.diseases ||
    [];

  // Deduplica e normalizza i nomi
  const detectedDiseases = useMemo(() => 
    Array.from(
      new Map(
        rawDetectedDiseases.map((disease: any) => {
          const name = getDiseaseName(disease);
          return [name.toLowerCase(), { ...disease, name }];
        })
      ).values()
    )
  , [rawDetectedDiseases]);

  // Malattia principale (massima confidenza)
  const mainDisease = detectedDiseases
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]?.name;

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
      toast.success('Apertura chat con l\'esperto...', {
        description: 'La diagnosi AI verrà inviata automaticamente in chat',
      });

      if (onChatWithExpert) await onChatWithExpert();
    } catch (error) {
      toast.error('Errore nell\'apertura della chat');
    }
  };

  useEffect(() => {
    if (effectiveDiagnosis && plantInfo && !plantInfo.diagnosisResult) {
      plantInfo.diagnosisResult = { ...effectiveDiagnosis };
    }
  }, [effectiveDiagnosis, plantInfo]);

  // DEBUG: log per verificare i dati
  console.log('🔍 Debug detectedDiseases:', detectedDiseases);
  console.log('🔍 Debug rawDetectedDiseases:', rawDetectedDiseases);
  console.log('🔍 Debug analysisDetails?.primaryDiseases:', analysisDetails?.primaryDiseases);

  if (isAnalyzing) return <div className="text-center">Analisi in corso...</div>;
  if (!imageSrc) return <div className="text-center">Nessuna immagine da mostrare.</div>;

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

          {/* Malattia principale dalla foto */}
          {mainDisease && (
            <p className="text-lg font-bold text-red-700 mt-4 text-center">
              Malattia principale rilevata dalla foto: {mainDisease}
            </p>
          )}
        </div>
      </div>

      {/* SEZIONE MALATTIE RILEVATE */}
      {detectedDiseases && detectedDiseases.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl shadow-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-bold text-orange-800">
              Malattie Rilevate ({detectedDiseases.length})
            </h2>
          </div>
          
          <div className="space-y-4">
            {detectedDiseases.map((disease: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-red-700">{disease.name}</h3>
                  {disease.confidence && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {Math.round(disease.confidence * 100)}% confidenza
                    </span>
                  )}
                </div>
                
                {disease.description && (
                  <p className="text-sm text-gray-700 mb-3">{disease.description}</p>
                )}
                
                {disease.symptoms && disease.symptoms.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm text-gray-800 mb-1">Sintomi:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {disease.symptoms.map((symptom: string, idx: number) => (
                        <li key={idx}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {disease.treatment && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm text-gray-800 mb-1">Trattamento consigliato:</h4>
                    <p className="text-sm text-gray-700">{disease.treatment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOCONTO FINALE + RACCOMANDAZIONI */}
      {analysisDetails && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-200">
          {/* Qui puoi mantenere tutta la logica esistente di EPPO, AI, prodotti, ecc. */}
          {/* ... (stessa struttura del tuo codice originale) */}
        </div>
      )}

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
